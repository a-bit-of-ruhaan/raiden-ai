/**
 * RAIDEN AI — MODEL CENTER CONTROLLER
 * Model inspection, dual-model routing configuration, runtime discovery,
 * and generation parameter tuning.
 */

class ModelCenterController {
  init() {
    this.bindEvents();
    this.loadModels();
    this.loadModelConfig();
    this.loadRoutingHistory();
  }

  bindEvents() {
    // Temperature slider
    const tempSlider = document.getElementById('temp-slider');
    const tempValue = document.getElementById('temp-slider-val');
    if (tempSlider && tempValue) {
      tempSlider.value = appState.settings.temperature;
      tempValue.textContent = appState.settings.temperature;
      tempSlider.addEventListener('input', (e) => {
        appState.settings.temperature = parseFloat(e.target.value);
        tempValue.textContent = e.target.value;
        appState.saveToStorage();
      });
    }

    // Top-P slider
    const topPSlider = document.getElementById('topp-slider');
    const topPValue = document.getElementById('topp-slider-val');
    if (topPSlider && topPValue) {
      topPSlider.value = appState.settings.topP;
      topPValue.textContent = appState.settings.topP;
      topPSlider.addEventListener('input', (e) => {
        appState.settings.topP = parseFloat(e.target.value);
        topPValue.textContent = e.target.value;
        appState.saveToStorage();
      });
    }

    // System prompt editor
    const sysPromptInput = document.getElementById('system-prompt-textarea');
    if (sysPromptInput) {
      sysPromptInput.value = appState.settings.systemPrompt;
      sysPromptInput.addEventListener('change', (e) => {
        appState.settings.systemPrompt = e.target.value.trim();
        appState.saveToStorage();
        showToast('System prompt updated', 'success');
      });
    }

    // Reset prompt button
    const btnResetPrompt = document.getElementById('btn-reset-system-prompt');
    if (btnResetPrompt && sysPromptInput) {
      btnResetPrompt.addEventListener('click', () => {
        appState.settings.systemPrompt = DEFAULT_SYSTEM_PROMPT;
        sysPromptInput.value = DEFAULT_SYSTEM_PROMPT;
        appState.saveToStorage();
        showToast('System prompt reset to default', 'info');
      });
    }

    // Model mode radio/select
    const modeRadios = document.querySelectorAll('input[name="model-mode-radio"]');
    modeRadios.forEach(r => {
      r.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.switchModelMode(e.target.value);
        }
      });
    });

    // Save Advanced Model input
    const btnSaveAdv = document.getElementById('btn-save-advanced-model');
    const advInput = document.getElementById('input-advanced-model-name');
    if (btnSaveAdv && advInput) {
      btnSaveAdv.addEventListener('click', async () => {
        const val = advInput.value.trim();
        if (val) {
          appState.advancedModel = val;
          appState.saveToStorage();
          await raidenAPI.setAdvancedModel(val);
          this.loadModelConfig();
          showToast(`Advanced model updated to: ${val}`, 'success');
        }
      });
    }

    // Refresh routing history button
    const btnRefreshRouting = document.getElementById('btn-refresh-routing-log');
    if (btnRefreshRouting) {
      btnRefreshRouting.addEventListener('click', () => {
        this.loadRoutingHistory();
        showToast('Routing log refreshed', 'info');
      });
    }
  }

  async switchModelMode(mode) {
    appState.modelMode = mode;
    appState.saveToStorage();
    await raidenAPI.setModelMode(mode);
    if (window.chatController) {
      window.chatController.updateModelModeUI();
    }
    showToast(`Model mode set to: ${mode.toUpperCase()}`, 'info');
  }

  async loadModelConfig() {
    try {
      const cfg = await raidenAPI.getModelConfig();
      if (cfg) {
        if (cfg.model_mode) {
          appState.modelMode = cfg.model_mode;
          const radio = document.querySelector(`input[name="model-mode-radio"][value="${cfg.model_mode}"]`);
          if (radio) radio.checked = true;
        }

        const advInput = document.getElementById('input-advanced-model-name');
        if (advInput && cfg.advanced_model) {
          advInput.value = cfg.advanced_model;
          appState.advancedModel = cfg.advanced_model;
        }

        // Check whether advanced model is installed
        const advStatusBadge = document.getElementById('adv-model-status-badge');
        if (advStatusBadge && cfg.installed_models) {
          const isInstalled = cfg.installed_models.some(m => m.toLowerCase().includes(cfg.advanced_model.toLowerCase().split(':')[0]));
          if (isInstalled) {
            advStatusBadge.textContent = 'Installed & Ready';
            advStatusBadge.className = 'brand-badge badge-success';
          } else {
            advStatusBadge.textContent = 'Not Installed (Auto-fallback to 3B)';
            advStatusBadge.className = 'brand-badge badge-warning';
          }
        }
      }
    } catch (e) {
      console.warn('Error loading model config:', e);
    }
  }

  async loadModels() {
    try {
      const models = await raidenAPI.getModels();
      appState.modelsList = models;
      this.renderModelDetails(models);
    } catch (e) {
      console.warn('Failed loading models:', e);
    }
  }

  renderModelDetails(models) {
    const active = models[0] || {
      name: 'qwen2.5-coder:3b',
      parameter_size: '3.1B',
      quantization_level: 'Q4_K_M',
      format: 'gguf',
      size: 1929912626
    };

    const nameEl = document.getElementById('active-model-name');
    if (nameEl) nameEl.textContent = active.name;

    const sizeEl = document.getElementById('spec-param-size');
    if (sizeEl) sizeEl.textContent = active.parameter_size || '3.1B';

    const quantEl = document.getElementById('spec-quant-level');
    if (quantEl) quantEl.textContent = active.quantization_level || 'Q4_K_M';

    const formatEl = document.getElementById('spec-format');
    if (formatEl) formatEl.textContent = (active.format || 'gguf').toUpperCase();

    const diskEl = document.getElementById('spec-disk-size');
    if (diskEl) diskEl.textContent = formatBytes(active.size || 1929912626);

    // Populate header model badge text
    const badgeName = document.getElementById('header-model-name');
    if (badgeName) {
      const modeLabel = (appState.modelMode || 'auto').toUpperCase();
      badgeName.textContent = `${active.name} [${modeLabel}]`;
    }
  }

  async loadRoutingHistory() {
    const listEl = document.getElementById('routing-history-list');
    if (!listEl) return;

    try {
      const history = await raidenAPI.getRoutingHistory();
      if (!history || history.length === 0) {
        listEl.innerHTML = '<div style="font-size: 12.5px; color: var(--text-tertiary); padding: 12px 0;">No routing events recorded yet. Send prompts in chat to see real-time routing decisions.</div>';
        return;
      }

      listEl.innerHTML = history.slice(-8).reverse().map(item => `
        <div class="routing-log-item">
          <div class="routing-log-header">
            <span class="routing-log-model">${escapeHtml(item.selected_model)}</span>
            <span class="routing-badge complexity-${item.complexity.toLowerCase()}">${item.complexity}</span>
            ${item.fallback_used ? '<span class="routing-badge badge-warning">FALLBACK</span>' : ''}
            <span class="routing-log-time">${item.duration_ms} ms</span>
          </div>
          <div class="routing-log-prompt">"${escapeHtml(item.prompt_snippet)}"</div>
          <div class="routing-log-reason">${escapeHtml(item.reason)}</div>
        </div>
      `).join('');
    } catch (e) {
      listEl.innerHTML = `<div style="color: var(--text-tertiary); font-size: 12px;">Could not load routing history: ${e}</div>`;
    }
  }
}

window.modelCenterController = new ModelCenterController();
