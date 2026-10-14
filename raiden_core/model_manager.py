"""
RAIDEN Model Lifecycle & Inference Provider Manager
Ensures safe, low-resource sequential model loading, concurrency protection,
flexible provider abstraction, streaming support, and cancellation.
"""

import gc
import time
import threading
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Iterator, Callable
import ollama

logger = logging.getLogger("raiden.model_manager")

class ModelProvider(ABC):
    """Abstract interface decoupling RAIDEN's intelligence layer from specific runtimes."""

    @abstractmethod
    def generate(self, model: str, messages: List[Dict[str, str]], options: Dict[str, Any]) -> str:
        pass

    @abstractmethod
    def generate_stream(self, model: str, messages: List[Dict[str, str]], options: Dict[str, Any]) -> Iterator[str]:
        pass

    @abstractmethod
    def get_installed_models(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def unload(self, model: str) -> bool:
        pass


class OllamaProvider(ModelProvider):
    """Concrete provider implementation for the local Ollama inference engine."""

    def generate(self, model: str, messages: List[Dict[str, str]], options: Dict[str, Any]) -> str:
        response = ollama.chat(
            model=model,
            messages=messages,
            options=options
        )
        return response.get("message", {}).get("content", "")

    def generate_stream(self, model: str, messages: List[Dict[str, str]], options: Dict[str, Any]) -> Iterator[str]:
        stream = ollama.chat(
            model=model,
            messages=messages,
            options=options,
            stream=True
        )
        for chunk in stream:
            content = chunk.get("message", {}).get("content", "")
            if content:
                yield content

    def get_installed_models(self) -> List[Dict[str, Any]]:
        try:
            res = ollama.list()
            items = []
            for m in res.models:
                details = getattr(m, "details", None)
                model_name = getattr(m, "model", str(m))
                items.append({
                    "name": model_name,
                    "size": getattr(m, "size", 0),
                    "modified_at": str(getattr(m, "modified_at", "")),
                    "parameter_size": getattr(details, "parameter_size", "unknown") if details else "unknown",
                    "quantization_level": getattr(details, "quantization_level", "unknown") if details else "unknown",
                    "format": getattr(details, "format", "gguf") if details else "gguf",
                    "family": getattr(details, "family", "unknown") if details else "unknown"
                })
            return items
        except Exception as e:
            logger.warning(f"Failed to query Ollama installed models: {e}")
            return []

    def unload(self, model: str) -> bool:
        if not model:
            return True
        try:
            logger.info(f"Evicting model '{model}' from VRAM via keep_alive=0...")
            try:
                ollama.chat(model=model, messages=[], keep_alive=0)
            except Exception:
                try:
                    ollama.generate(model=model, prompt="", keep_alive=0)
                except Exception:
                    pass
            gc.collect()
            logger.info(f"Model '{model}' evicted successfully.")
            return True
        except Exception as e:
            logger.warning(f"Error while evicting model '{model}': {e}")
            return False


class ModelManager:
    """Manages model lifecycle, execution locking, sequential unloading, and streaming."""

    def __init__(
        self,
        default_model: str = "qwen2.5-coder:3b",
        context_length: int = 4096,
        sequential_loading: bool = True,
        provider: Optional[ModelProvider] = None
    ):
        self.default_model = default_model
        self.active_model = default_model
        self.loaded_model: Optional[str] = None
        self.context_length = context_length
        self.sequential_loading = sequential_loading
        self.provider = provider or OllamaProvider()
        self._inference_lock = threading.Lock()
        self._is_generating = False
        self._cancel_requested = False
        self._last_generation_time = 0.0

    def get_installed_models(self) -> List[Dict[str, Any]]:
        return self.provider.get_installed_models()

    def get_installed_model_names(self) -> List[str]:
        models = self.get_installed_models()
        return [m["name"] for m in models]

    def unload_model(self, model_name: str) -> bool:
        success = self.provider.unload(model_name)
        if success and self.loaded_model == model_name:
            self.loaded_model = None
        return success

    def prepare_model_for_inference(self, target_model: str) -> bool:
        """
        Implements sequential loading strategy:
        If target model differs from currently loaded model and sequential loading is enabled,
        unloads the previous model first before loading the new one to prevent OOM/crash.
        """
        if not self.sequential_loading:
            self.loaded_model = target_model
            return True

        if self.loaded_model and self.loaded_model != target_model:
            logger.info(f"Sequential model switch: unloading {self.loaded_model} before loading {target_model}")
            self.unload_model(self.loaded_model)
            time.sleep(0.3)  # Cooldown for hardware VRAM release

        self.loaded_model = target_model
        return True

    def cancel_generation(self):
        """Signals active generation loop to terminate immediately."""
        self._cancel_requested = True
        logger.info("Generation cancellation requested.")

    def _build_gen_options(
        self,
        temperature: float = 0.6,
        top_p: float = 0.85,
        repeat_penalty: float = 1.15,
        stop_sequences: Optional[List[str]] = None,
        context_length: Optional[int] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        ctx = context_length or self.context_length
        options = {
            "temperature": float(temperature),
            "top_p": float(top_p),
            "repeat_penalty": float(repeat_penalty),
            "num_ctx": int(ctx),
            "num_predict": int(max_tokens) if max_tokens else 2048
        }
        if stop_sequences:
            options["stop"] = stop_sequences
        return options

    def generate_chat_response(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.6,
        top_p: float = 0.85,
        repeat_penalty: float = 1.15,
        stop_sequences: Optional[List[str]] = None,
        context_length: Optional[int] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Thread-safe inference execution with concurrency locking and resource protection.
        """
        if not self._inference_lock.acquire(blocking=False):
            return "Error: Concurrency limit reached. Another generation is already in progress on this device."

        try:
            self._is_generating = True
            self._cancel_requested = False
            start_ts = time.time()

            self.prepare_model_for_inference(model)
            gen_options = self._build_gen_options(
                temperature=temperature,
                top_p=top_p,
                repeat_penalty=repeat_penalty,
                stop_sequences=stop_sequences,
                context_length=context_length,
                max_tokens=max_tokens
            )

            logger.info(f"Starting inference with model '{model}' (ctx: {gen_options['num_ctx']}, temp: {temperature})")
            reply = self.provider.generate(model=model, messages=messages, options=gen_options)
            self._last_generation_time = time.time() - start_ts
            return reply

        except ollama.ResponseError as oe:
            logger.error(f"Ollama ResponseError: {oe}")
            if "not found" in str(oe).lower():
                return f"Model Error: Model '{model}' was not found. Please install it with 'ollama pull {model}' or configure a different model."
            return f"Ollama Runtime Error: {str(oe)}"
        except Exception as e:
            logger.error(f"Inference exception: {e}")
            return f"Ollama Connection Error: {str(e)}"
        finally:
            self._is_generating = False
            self._inference_lock.release()

    def generate_chat_response_stream(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.6,
        top_p: float = 0.85,
        repeat_penalty: float = 1.15,
        stop_sequences: Optional[List[str]] = None,
        context_length: Optional[int] = None,
        max_tokens: Optional[int] = None,
        chunk_callback: Optional[Callable[[str], None]] = None
    ) -> Iterator[str]:
        """
        Yields tokens in real-time as they are produced, supporting cancellation.
        """
        if not self._inference_lock.acquire(blocking=False):
            yield "Error: Concurrency limit reached. Another generation is already in progress on this device."
            return

        try:
            self._is_generating = True
            self._cancel_requested = False
            start_ts = time.time()

            self.prepare_model_for_inference(model)
            gen_options = self._build_gen_options(
                temperature=temperature,
                top_p=top_p,
                repeat_penalty=repeat_penalty,
                stop_sequences=stop_sequences,
                context_length=context_length,
                max_tokens=max_tokens
            )

            logger.info(f"Streaming inference with model '{model}' (ctx: {gen_options['num_ctx']}, temp: {temperature})")
            stream_iter = self.provider.generate_stream(model=model, messages=messages, options=gen_options)

            for token in stream_iter:
                if self._cancel_requested:
                    logger.info("Streaming stopped due to user cancellation.")
                    break
                if chunk_callback:
                    try:
                        chunk_callback(token)
                    except Exception as cb_err:
                        logger.debug(f"Chunk callback error: {cb_err}")
                yield token

            self._last_generation_time = time.time() - start_ts

        except ollama.ResponseError as oe:
            logger.error(f"Ollama Streaming ResponseError: {oe}")
            err_msg = f"\n[Model Error: Model '{model}' not found. Please pull it with 'ollama pull {model}']"
            if chunk_callback:
                chunk_callback(err_msg)
            yield err_msg
        except Exception as e:
            logger.error(f"Inference streaming exception: {e}")
            err_msg = f"\n[Ollama Connection Error: {str(e)}]"
            if chunk_callback:
                chunk_callback(err_msg)
            yield err_msg
        finally:
            self._is_generating = False
            self._inference_lock.release()

    def is_generating(self) -> bool:
        return self._is_generating

    def get_status(self) -> Dict[str, Any]:
        return {
            "active_model": self.active_model,
            "loaded_model": self.loaded_model,
            "sequential_loading": self.sequential_loading,
            "is_generating": self._is_generating,
            "last_generation_seconds": round(self._last_generation_time, 2)
        }
