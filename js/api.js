/**
 * RAIDEN AI — BACKEND API BRIDGE
 * Interfaces with Python's PyWebView js_api and local Ollama backend.
 * Provides bridge methods for Dual-Model Routing, Memory, Web Research, and PC Tools.
 */

class RaidenAPI {
  constructor() {
    this.isBridgeReady = false;
    this.checkBridge();
  }

  checkBridge() {
    if (window.pywebview && window.pywebview.api) {
      this.isBridgeReady = true;
      return true;
    }
    return false;
  }

  async sendChat(userPrompt, sessionId = 'default', systemPrompt = null, model = null, temperature = 0.6, history = null, topP = 0.85, modelMode = null, searchEnabled = null, roastMode = null, escalate = false) {
    if (!this.checkBridge()) {
      await new Promise(r => setTimeout(r, 200));
    }

    if (window.pywebview && window.pywebview.api && window.pywebview.api.chat) {
      try {
        const response = await window.pywebview.api.chat(
          userPrompt,
          sessionId,
          systemPrompt,
          model,
          temperature,
          history,
          topP,
          modelMode,
          searchEnabled,
          roastMode,
          escalate
        );
        return response;
      } catch (err) {
        console.error('API Chat Error:', err);
        throw new Error(err.message || String(err));
      }
    } else {
      throw new Error('PyWebView backend bridge is not connected.');
    }
  }

  async getModels() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_models) {
      try {
        return await window.pywebview.api.get_models();
      } catch (err) {
        console.warn('API get_models error:', err);
      }
    }
    return [
      {
        name: 'qwen2.5-coder:3b',
        size: 1929912626,
        parameter_size: '3.1B',
        quantization_level: 'Q4_K_M',
        format: 'gguf',
        family: 'qwen2'
      }
    ];
  }

  async getModelConfig() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_model_config) {
      try {
        return await window.pywebview.api.get_model_config();
      } catch (err) {
        console.warn('API get_model_config error:', err);
      }
    }
    return {
      fast_model: 'qwen2.5-coder:3b',
      advanced_model: 'llama3.1:8b',
      model_mode: 'auto',
      installed_models: ['qwen2.5-coder:3b'],
      offline_mode: false,
      web_search_enabled: false,
      memory_enabled: true,
      sequential_loading: true
    };
  }

  async setModelMode(mode) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.set_model_mode) {
      try {
        return await window.pywebview.api.set_model_mode(mode);
      } catch (err) {
        console.warn('API set_model_mode error:', err);
      }
    }
    return { success: true, model_mode: mode };
  }

  async setAdvancedModel(modelName) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.set_advanced_model) {
      try {
        return await window.pywebview.api.set_advanced_model(modelName);
      } catch (err) {
        console.warn('API set_advanced_model error:', err);
      }
    }
    return { success: true, advanced_model: modelName };
  }

  async toggleWebSearch(enabled) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.toggle_web_search) {
      try {
        return await window.pywebview.api.toggle_web_search(enabled);
      } catch (err) {
        console.warn('API toggle_web_search error:', err);
      }
    }
    return { success: true, web_search_enabled: enabled };
  }

  async toggleOfflineMode(enabled) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.toggle_offline_mode) {
      try {
        return await window.pywebview.api.toggle_offline_mode(enabled);
      } catch (err) {
        console.warn('API toggle_offline_mode error:', err);
      }
    }
    return { success: true, offline_mode: enabled };
  }

  async toggleMemory(enabled) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.toggle_memory) {
      try {
        return await window.pywebview.api.toggle_memory(enabled);
      } catch (err) {
        console.warn('API toggle_memory error:', err);
      }
    }
    return { success: true, memory_enabled: enabled };
  }

  async getMemories(category = null) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_memories) {
      try {
        return await window.pywebview.api.get_memories(category);
      } catch (err) {
        console.warn('API get_memories error:', err);
      }
    }
    return [];
  }

  async addMemory(content, category = 'fact') {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.add_memory) {
      try {
        return await window.pywebview.api.add_memory(content, category);
      } catch (err) {
        console.warn('API add_memory error:', err);
      }
    }
    return { success: true };
  }

  async deleteMemory(memoryId) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.delete_memory) {
      try {
        return await window.pywebview.api.delete_memory(memoryId);
      } catch (err) {
        console.warn('API delete_memory error:', err);
      }
    }
    return { success: true };
  }

  async clearMemories() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.clear_memories) {
      try {
        return await window.pywebview.api.clear_memories();
      } catch (err) {
        console.warn('API clear_memories error:', err);
      }
    }
    return { success: true };
  }

  async executeTool(toolName, args = null, confirmed = false) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.execute_tool) {
      try {
        return await window.pywebview.api.execute_tool(toolName, args, confirmed);
      } catch (err) {
        console.warn('API execute_tool error:', err);
        return { success: false, error: String(err) };
      }
    }
    return { success: false, error: 'PyWebView bridge not connected' };
  }

  async getToolLog(limit = 50) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_tool_log) {
      try {
        return await window.pywebview.api.get_tool_log(limit);
      } catch (err) {
        console.warn('API get_tool_log error:', err);
      }
    }
    return [];
  }

  async getRoutingHistory() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_routing_history) {
      try {
        return await window.pywebview.api.get_routing_history();
      } catch (err) {
        console.warn('API get_routing_history error:', err);
      }
    }
    return [];
  }

  async getSystemStatus() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_system_status) {
      try {
        return await window.pywebview.api.get_system_status();
      } catch (err) {
        console.warn('API get_system_status error:', err);
      }
    }
    return appState.telemetry;
  }

  async openFileDialog() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.open_file_dialog) {
      try {
        return await window.pywebview.api.open_file_dialog();
      } catch (err) {
        console.warn('API open_file_dialog error:', err);
      }
    }
    return null;
  }

  async clearChat(sessionId = 'default') {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.clear_chat) {
      try {
        return await window.pywebview.api.clear_chat(sessionId);
      } catch (err) {
        console.warn('API clear_chat error:', err);
      }
    }
    return true;
  }

  async stopGeneration() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.stop_generation) {
      try {
        return await window.pywebview.api.stop_generation();
      } catch (err) {
        console.warn('API stop_generation error:', err);
      }
    }
    return { success: true };
  }

  // ------------------- Personalization & User Profile Bridge -------------------

  async getUserProfile() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_user_profile) {
      try {
        return await window.pywebview.api.get_user_profile();
      } catch (err) {
        console.warn('API get_user_profile error:', err);
      }
    }
    return appState.userProfile || {};
  }

  async saveUserProfile(profileDict) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.save_user_profile) {
      try {
        return await window.pywebview.api.save_user_profile(profileDict);
      } catch (err) {
        console.warn('API save_user_profile error:', err);
      }
    }
    return { success: true, profile: profileDict };
  }

  // ------------------- Local Storage & Database Management Bridge -------------------

  async getStorageStats() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_storage_stats) {
      try {
        return await window.pywebview.api.get_storage_stats();
      } catch (err) {
        console.warn('API get_storage_stats error:', err);
      }
    }
    return {
      conversations_count: appState.sessions ? appState.sessions.length : 0,
      messages_count: appState.sessions ? appState.sessions.reduce((acc, s) => acc + (s.messages ? s.messages.length : 0), 0) : 0,
      memories_count: 0,
      profile_fields_count: 0,
      db_size_kb: 0
    };
  }

  async exportAllData() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.export_all_data) {
      try {
        return await window.pywebview.api.export_all_data();
      } catch (err) {
        console.warn('API export_all_data error:', err);
      }
    }
    return JSON.stringify({ sessions: appState.sessions, settings: appState.settings }, null, 2);
  }

  async importData(data) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.import_data) {
      try {
        return await window.pywebview.api.import_data(data);
      } catch (err) {
        console.warn('API import_data error:', err);
        return { success: false, error: String(err) };
      }
    }
    return { success: false, error: 'Bridge not available' };
  }

  async getChatHistoryDB(limit = 100) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_chat_history_db) {
      try {
        return await window.pywebview.api.get_chat_history_db(limit);
      } catch (err) {
        console.warn('API get_chat_history_db error:', err);
      }
    }
    return [];
  }

  async syncConversationsToDB(sessions) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.sync_conversations_to_db) {
      try {
        return await window.pywebview.api.sync_conversations_to_db(sessions);
      } catch (err) {
        console.warn('API sync_conversations_to_db error:', err);
        return { success: false, error: String(err) };
      }
    }
    return { success: true };
  }

  async loadStorage() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.load_storage) {
      try {
        return await window.pywebview.api.load_storage();
      } catch (err) {
        console.warn('API load_storage error:', err);
      }
    }
    return null;
  }

  async saveStorage(jsonString) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.save_storage) {
      try {
        return await window.pywebview.api.save_storage(jsonString);
      } catch (err) {
        console.warn('API save_storage error:', err);
      }
    }
    return true;
  }

  async getScreenPerceptionStatus() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_screen_perception_status) {
      try {
        return await window.pywebview.api.get_screen_perception_status();
      } catch (err) {
        console.warn('API get_screen_perception_status error:', err);
      }
    }
    try {
      const res = await fetch('http://127.0.0.1:8765/api/screen/status');
      if (res.ok) return await res.json();
    } catch (e) {}
    return { enabled: false, status: 'unavailable' };
  }

  async setScreenPerceptionEnabled(enabled) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.set_screen_perception_enabled) {
      try {
        return await window.pywebview.api.set_screen_perception_enabled(enabled);
      } catch (err) {
        console.warn('API set_screen_perception_enabled error:', err);
      }
    }
    try {
      const res = await fetch('http://127.0.0.1:8765/api/screen/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !!enabled })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { enabled: !!enabled };
  }

  async setScreenPerceptionMode(mode) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.set_screen_perception_mode) {
      try {
        return await window.pywebview.api.set_screen_perception_mode(mode);
      } catch (err) {
        console.warn('API set_screen_perception_mode error:', err);
      }
    }
    try {
      const res = await fetch('http://127.0.0.1:8765/api/screen/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: mode })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { mode: mode };
  }

  async setVisionModel(modelName) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.set_vision_model) {
      try {
        return await window.pywebview.api.set_vision_model(modelName);
      } catch (err) {
        console.warn('API set_vision_model error:', err);
      }
    }
    return { vision_model: modelName };
  }

  async triggerScreenObservation(companionId = 'void') {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.trigger_screen_observation) {
      try {
        return await window.pywebview.api.trigger_screen_observation(companionId);
      } catch (err) {
        console.warn('API trigger_screen_observation error:', err);
      }
    }
    try {
      const res = await fetch('http://127.0.0.1:8765/api/screen/observe_now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companion_id: companionId })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  }

  async getScreenPerceptionHistory() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_screen_perception_history) {
      try {
        return await window.pywebview.api.get_screen_perception_history();
      } catch (err) {
        console.warn('API get_screen_perception_history error:', err);
      }
    }
    try {
      const res = await fetch('http://127.0.0.1:8765/api/screen/history');
      if (res.ok) {
        const data = await res.json();
        return data.history || [];
      }
    } catch (e) {}
    return [];
  }
}

window.raidenAPI = new RaidenAPI();
