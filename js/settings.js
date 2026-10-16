/**
 * RAIDEN AI — SETTINGS & PREFERENCES CONTROLLER
 * Accent themes, keyboard settings, local storage export,
 * Web research toggles, offline mode, SQLite memory management, and tool audit viewer.
 */

class SettingsController {
  init() {
    this.bindEvents();
    this.applySettingsToDOM();
    this.syncTogglesFromBackend();
    this.loadPersonalizationAndStats();
  }

  async syncTogglesFromBackend() {
    try {
      const cfg = await raidenAPI.getModelConfig();
      if (cfg) {
        // Web Search toggle
        const searchToggle = document.getElementById('setting-web-search-toggle');
        if (searchToggle) {
          searchToggle.checked = !!cfg.web_search_enabled;
          appState.webSearchEnabled = searchToggle.checked;
        }

        // Offline Mode toggle
        const offlineToggle = document.getElementById('setting-offline-toggle');
        if (offlineToggle) {
          offlineToggle.checked = !!cfg.offline_mode;
          appState.offlineMode = offlineToggle.checked;
        }

        // Memory toggle
        const memoryToggle = document.getElementById('setting-memory-toggle');
        if (memoryToggle) {
          memoryToggle.checked = !!cfg.memory_enabled;
          appState.memoryEnabled = memoryToggle.checked;
        }

        // Screen Perception Subsystem
        try {
          const screenStatus = await raidenAPI.getScreenPerceptionStatus();
          if (screenStatus) {
            const screenToggle = document.getElementById('setting-screen-perception-toggle');
            if (screenToggle) screenToggle.checked = !!screenStatus.enabled;

            const visionSelect = document.getElementById('setting-vision-model-select');
            if (visionSelect && screenStatus.vision_model) visionSelect.value = screenStatus.vision_model;

            const modeSelect = document.getElementById('setting-screen-mode-select');
            if (modeSelect && screenStatus.social_mode) modeSelect.value = screenStatus.social_mode;

            const sourceSelect = document.getElementById('setting-screen-source-select');
            if (sourceSelect && screenStatus.capture_source) sourceSelect.value = screenStatus.capture_source;

            const telemetryDesc = document.getElementById('setting-screen-telemetry-desc');
            if (telemetryDesc) {
              if (screenStatus.latest_observation) {
                const obs = screenStatus.latest_observation;
                telemetryDesc.textContent = `Active Model: ${screenStatus.vision_model} · Last Seen: ${obs.app_context || 'Desktop'} · Latency: ${obs.latency_ms || 0}ms`;
              } else {
                telemetryDesc.textContent = `Status: ${screenStatus.enabled ? 'Observing Active' : 'Idle / Disabled'} · Model: ${screenStatus.vision_model || 'llava-phi3'}`;
              }
            }
          }
        } catch (se) {
          console.debug('Screen perception sync error:', se);
        }
      }
    } catch (e) {
      console.warn('Could not sync toggles from backend:', e);
    }
  }

  bindEvents() {
    // Ripper Mode toggle in Settings
    const ripperToggle = document.getElementById('setting-ripper-toggle');
    if (ripperToggle) {
      ripperToggle.addEventListener('change', (e) => {
        this.setRipperMode(e.target.checked, true);
      });
    }

    // Ripper Mode toggle button in header
    const headerRipperBtn = document.getElementById('btn-toggle-ripper');
    if (headerRipperBtn) {
      headerRipperBtn.addEventListener('click', () => {
        const isCurrent = document.documentElement.getAttribute('data-ripper-mode') === 'true';
        this.setRipperMode(!isCurrent, true);
      });
    }

    // Density
    const densitySelect = document.getElementById('setting-density-select');
    if (densitySelect) {
      densitySelect.value = appState.settings.density || 'comfortable';
      densitySelect.addEventListener('change', (e) => {
        appState.settings.density = e.target.value;
        appState.saveToStorage();
        this.applySettingsToDOM();
      });
    }

    // Enter to send
    const enterToggle = document.getElementById('setting-enter-toggle');
    if (enterToggle) {
      enterToggle.checked = appState.settings.enterToSend;
      enterToggle.addEventListener('change', (e) => {
        appState.settings.enterToSend = e.target.checked;
        appState.saveToStorage();
        showToast(`Send behavior set to: ${e.target.checked ? 'Enter' : 'Ctrl+Enter'}`, 'info');
      });
    }

    // Web Search toggle
    const searchToggle = document.getElementById('setting-web-search-toggle');
    if (searchToggle) {
      searchToggle.addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        appState.webSearchEnabled = enabled;
        appState.saveToStorage();
        await raidenAPI.toggleWebSearch(enabled);
        if (window.chatController) {
          window.chatController.updateWebSearchButtonUI();
        }
        showToast(enabled ? 'Web Research enabled' : 'Web Research disabled', 'info');
      });
    }

    // Offline Mode toggle
    const offlineToggle = document.getElementById('setting-offline-toggle');
    if (offlineToggle) {
      offlineToggle.addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        appState.offlineMode = enabled;
        appState.saveToStorage();
        await raidenAPI.toggleOfflineMode(enabled);
        showToast(enabled ? 'Strict Offline Mode activated' : 'Offline Mode deactivated', 'info');
      });
    }

    // Memory toggle
    const memoryToggle = document.getElementById('setting-memory-toggle');
    if (memoryToggle) {
      memoryToggle.addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        appState.memoryEnabled = enabled;
        appState.saveToStorage();
        await raidenAPI.toggleMemory(enabled);
        showToast(enabled ? 'Long-Term Memory enabled' : 'Long-Term Memory disabled', 'info');
      });
    }

    // Manage memories modal button
    const btnManageMem = document.getElementById('btn-manage-memories');
    if (btnManageMem) {
      btnManageMem.addEventListener('click', () => {
        this.openMemoriesModal();
      });
    }

    // Screen Perception Controls
    const screenToggle = document.getElementById('setting-screen-perception-toggle');
    if (screenToggle) {
      screenToggle.addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        const res = await raidenAPI.setScreenPerceptionEnabled(enabled);
        showToast(enabled ? 'Real-time Screen Perception activated 👀' : 'Screen Perception disabled', 'info');
        if (window.mascotController) {
          window.mascotController.triggerDialogue(
            enabled ? 'Screen observation active! Raiden visual senses online. 👀✨' : 'Screen perception paused.'
          );
        }
      });
    }

    const visionModelSelect = document.getElementById('setting-vision-model-select');
    if (visionModelSelect) {
      visionModelSelect.addEventListener('change', async (e) => {
        await raidenAPI.setVisionModel(e.target.value);
        showToast(`Vision model set to: ${e.target.value}`, 'info');
      });
    }

    const screenModeSelect = document.getElementById('setting-screen-mode-select');
    if (screenModeSelect) {
      screenModeSelect.addEventListener('change', async (e) => {
        await raidenAPI.setScreenPerceptionMode(e.target.value);
        showToast(`Commentary mode set to: ${e.target.value}`, 'info');
      });
    }

    const btnObserveNow = document.getElementById('btn-screen-observe-now');
    if (btnObserveNow) {
      btnObserveNow.addEventListener('click', async () => {
        btnObserveNow.disabled = true;
        btnObserveNow.textContent = 'Analyzing Desktop...';
        try {
          const res = await raidenAPI.triggerScreenObservation(
            window.mascotController ? (window.mascotController.activeCompanionId || 'void') : 'void'
          );
          if (res && res.observation) {
            const obs = res.observation;
            const comm = res.commentary;
            const telemetryDesc = document.getElementById('setting-screen-telemetry-desc');
            if (telemetryDesc) {
              telemetryDesc.textContent = `Saw: ${obs.app_context || 'Desktop'} · ${obs.activity_summary.slice(0, 70)} (${obs.latency_ms}ms)`;
            }
            if (comm && comm.text && window.mascotController) {
              window.mascotController.setState(comm.mood || 'ALERT', 4000);
              window.mascotController.triggerDialogue(comm.text);
            }
            showToast(`Screen analyzed: ${obs.app_context || 'Visual scene'}`, 'success');
          } else {
            showToast('Screen inspection completed (no notable changes)', 'info');
          }
        } catch (err) {
          showToast(`Screen observation failed: ${err.message}`, 'error');
        } finally {
          btnObserveNow.disabled = false;
          btnObserveNow.textContent = '👁️ Inspect Screen Now';
        }
      });
    }

    // Clear memories button
    const btnClearMem = document.getElementById('btn-clear-memories-data');
    if (btnClearMem) {
      btnClearMem.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all long-term memories from the SQLite database?')) {
          await raidenAPI.clearMemories();
          this.renderMemoriesList();
          showToast('Long-term memory cleared', 'info');
        }
      });
    }

    // View tool audit log button
    const btnToolAudit = document.getElementById('btn-view-tool-audit');
    if (btnToolAudit) {
      btnToolAudit.addEventListener('click', () => {
        this.openToolAuditModal();
      });
    }

    // Add memory button in modal
    const btnAddMem = document.getElementById('btn-add-memory-confirm');
    const inputAddMem = document.getElementById('input-new-memory-text');
    const selectAddCategory = document.getElementById('select-new-memory-category');
    if (btnAddMem && inputAddMem) {
      btnAddMem.addEventListener('click', async () => {
        const text = inputAddMem.value.trim();
        const cat = selectAddCategory ? selectAddCategory.value : 'fact';
        if (text) {
          const res = await raidenAPI.addMemory(text, cat);
          if (res && res.success) {
            inputAddMem.value = '';
            this.renderMemoriesList();
            showToast('Saved to persistent memory', 'success');
          } else {
            showToast(res ? res.error : 'Failed to save memory', 'error');
          }
        }
      });
    }

    // Export all data
    const btnExportAll = document.getElementById('btn-export-all-data');
    if (btnExportAll) {
      btnExportAll.addEventListener('click', async () => {
        try {
          let exportContent = '';
          const backendBackup = await raidenAPI.exportAllData();
          if (backendBackup && typeof backendBackup === 'string' && backendBackup.startsWith('{')) {
            exportContent = backendBackup;
          } else {
            const exportData = {
              sessions: appState.sessions,
              libraryItems: appState.libraryItems,
              settings: appState.settings,
              userProfile: appState.userProfile || {},
              exportedAt: new Date().toISOString(),
              app: 'RAIDEN AI'
            };
            exportContent = JSON.stringify(exportData, null, 2);
          }
          const blob = new Blob([exportContent], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `raiden_backup_${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
          showToast('Comprehensive data backup exported', 'success');
        } catch (err) {
          console.error('Export error:', err);
          showToast('Failed to export backup', 'error');
        }
      });
    }

    // Import backup
    const btnImport = document.getElementById('btn-import-data-file');
    const fileInput = document.getElementById('backup-file-input');
    if (btnImport && fileInput) {
      btnImport.addEventListener('click', () => {
        fileInput.value = '';
        fileInput.click();
      });

      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const raw = evt.target.result;
            const parsed = JSON.parse(raw);
            const res = await raidenAPI.importData(parsed);

            if (parsed.sessions && Array.isArray(parsed.sessions)) {
              appState.sessions = parsed.sessions;
              appState.saveToStorage();
              if (window.appController) window.appController.renderSidebarSessions();
            }

            await this.loadPersonalizationAndStats();
            showToast('Backup imported and merged successfully', 'success');
          } catch (err) {
            console.error('Import error:', err);
            showToast('Invalid backup file format', 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    // Sync active chat to SQLite
    const btnSyncSqlite = document.getElementById('btn-sync-sqlite');
    if (btnSyncSqlite) {
      btnSyncSqlite.addEventListener('click', async () => {
        try {
          if (appState.sessions && appState.sessions.length > 0) {
            await raidenAPI.syncConversationsToDB(appState.sessions);
          }
          await this.loadPersonalizationAndStats();
          showToast('All conversations synced to SQLite database', 'success');
        } catch (err) {
          console.warn('Sync error:', err);
          showToast('Failed to sync to SQLite', 'error');
        }
      });
    }

    // User Personalization Save
    const btnSaveProfile = document.getElementById('btn-save-user-profile');
    if (btnSaveProfile) {
      btnSaveProfile.addEventListener('click', async () => {
        const profile = {
          name: document.getElementById('setting-user-name')?.value.trim() || '',
          nickname: document.getElementById('setting-user-nickname')?.value.trim() || '',
          role: document.getElementById('setting-user-role')?.value.trim() || '',
          interests: document.getElementById('setting-user-interests')?.value.trim() || '',
          roast_level: document.getElementById('setting-user-roast')?.value || 'Playful',
          notes: document.getElementById('setting-user-notes')?.value.trim() || ''
        };

        appState.userProfile = profile;
        appState.saveToStorage();
        await raidenAPI.saveUserProfile(profile);
        await this.loadPersonalizationAndStats();
        showToast('Personalization preferences saved', 'success');
      });
    }

    // Clear all data
    const btnClearAll = document.getElementById('btn-clear-all-data');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        openModal('confirm-reset-modal');
      });
    }

    const btnConfirmReset = document.getElementById('btn-confirm-reset-all');
    if (btnConfirmReset) {
      btnConfirmReset.addEventListener('click', async () => {
        localStorage.removeItem('raiden_store_v2');
        localStorage.removeItem('raiden_ripper_mode');
        appState.sessions = [];
        appState.libraryItems = [];
        appState.userProfile = {};
        await raidenAPI.clearMemories();
        await raidenAPI.saveUserProfile({});
        appState.createSession('New Conversation');
        closeModal('confirm-reset-modal');
        window.location.reload();
      });
    }
  }

  async loadPersonalizationAndStats() {
    try {
      // 1. Load User Profile
      const profile = await raidenAPI.getUserProfile();
      if (profile && typeof profile === 'object') {
        const nameInput = document.getElementById('setting-user-name');
        const nickInput = document.getElementById('setting-user-nickname');
        const roleInput = document.getElementById('setting-user-role');
        const interestInput = document.getElementById('setting-user-interests');
        const roastSelect = document.getElementById('setting-user-roast');
        const notesInput = document.getElementById('setting-user-notes');

        if (nameInput) nameInput.value = profile.name || '';
        if (nickInput) nickInput.value = profile.nickname || '';
        if (roleInput) roleInput.value = profile.role || '';
        if (interestInput) interestInput.value = profile.interests || '';
        if (roastSelect && profile.roast_level) roastSelect.value = profile.roast_level;
        if (notesInput) notesInput.value = profile.notes || '';
      }

      // 2. Load Storage Stats
      const stats = await raidenAPI.getStorageStats();
      if (stats) {
        const msgEl = document.getElementById('stat-total-messages');
        const convEl = document.getElementById('stat-total-convs');
        const sizeEl = document.getElementById('stat-db-size');

        if (msgEl) msgEl.textContent = stats.messages_count ?? 0;
        if (convEl) convEl.textContent = stats.conversations_count ?? 0;
        if (sizeEl) sizeEl.textContent = `${stats.db_size_kb ?? 0} KB`;
      }
    } catch (e) {
      console.warn('Could not load personalization and storage stats:', e);
    }
  }

  async openMemoriesModal() {
    openModal('memories-manager-modal');
    await this.renderMemoriesList();
  }

  async renderMemoriesList() {
    const container = document.getElementById('memories-modal-list');
    if (!container) return;
    container.innerHTML = '<div style="font-size: 12px; color: var(--text-tertiary);">Loading persistent memories...</div>';

    const mems = await raidenAPI.getMemories();
    if (!mems || mems.length === 0) {
      container.innerHTML = '<div style="font-size: 12.5px; color: var(--text-tertiary); padding: 12px 0;">No memories currently stored. Add preferences or facts above.</div>';
      return;
    }

    container.innerHTML = mems.map(m => `
      <div class="memory-card-row">
        <div class="memory-info">
          <span class="memory-category-tag">${escapeHtml(m.category)}</span>
          <span class="memory-content-text">${escapeHtml(m.content)}</span>
          <span class="memory-meta-time">${new Date(m.created_at).toLocaleDateString()}</span>
        </div>
        <button class="btn-icon-danger" onclick="settingsController.deleteMemory(${m.id})" title="Delete memory">
          ${ICONS.trash}
        </button>
      </div>
    `).join('');
  }

  async deleteMemory(id) {
    await raidenAPI.deleteMemory(id);
    this.renderMemoriesList();
    showToast('Memory item deleted', 'info');
  }

  async openToolAuditModal() {
    openModal('tool-audit-modal');
    const container = document.getElementById('tool-audit-modal-list');
    if (!container) return;
    container.innerHTML = '<div style="font-size: 12px; color: var(--text-tertiary);">Loading audit log...</div>';

    const logs = await raidenAPI.getToolLog(40);
    if (!logs || logs.length === 0) {
      container.innerHTML = '<div style="font-size: 12.5px; color: var(--text-tertiary); padding: 12px 0;">No tools have been executed in this session yet.</div>';
      return;
    }

    container.innerHTML = logs.map(l => `
      <div class="audit-log-row">
        <div class="audit-header">
          <span class="audit-tool-name">${escapeHtml(l.tool_name)}</span>
          <span class="audit-status-badge status-${escapeHtml(l.status)}">${escapeHtml(l.status)}</span>
          <span class="audit-timestamp">${new Date(l.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="audit-args">Args: <code>${escapeHtml(l.arguments)}</code></div>
        <div class="audit-result">${escapeHtml(l.result || 'No output')}</div>
      </div>
    `).join('');
  }

  setRipperMode(enabled, notify = true) {
    const isEnabled = !!enabled;
    const root = document.documentElement;
    if (isEnabled) {
      root.setAttribute('data-ripper-mode', 'true');
    } else {
      root.removeAttribute('data-ripper-mode');
    }
    try {
      localStorage.setItem('raiden_ripper_mode', isEnabled ? 'true' : 'false');
    } catch (e) {
      console.warn('Could not save ripper mode to storage:', e);
    }

    // Sync settings toggle checkbox if present
    const toggle = document.getElementById('setting-ripper-toggle');
    if (toggle) toggle.checked = isEnabled;

    // Sync header button if present
    const headerBtn = document.getElementById('btn-toggle-ripper');
    if (headerBtn) {
      headerBtn.classList.toggle('active', isEnabled);
      headerBtn.title = isEnabled 
        ? 'Negative Void Theme Active (Click to switch to Stark Zine)'
        : 'Invert Canvas / Monochromatic Void Mode';
    }

    const themeZineBtn = document.getElementById('btn-theme-zine');
    const themeVoidBtn = document.getElementById('btn-theme-void');
    if (themeZineBtn && themeVoidBtn) {
      themeZineBtn.classList.toggle('active', !isEnabled);
      themeVoidBtn.classList.toggle('active', isEnabled);
    }

    if (notify) {
      showToast(isEnabled ? 'Negative Void Theme Active' : 'Stark Zine Theme Active', 'info');
    }
  }

  setAccent(accentName) {
    appState.settings.accent = 'black';
    appState.saveToStorage();
    this.applySettingsToDOM();
  }

  applySettingsToDOM() {
    const root = document.documentElement;
    root.setAttribute('data-density', appState.settings.density || 'comfortable');

    // Apply Inverted / Void Mode state from localStorage
    const savedRipper = localStorage.getItem('raiden_ripper_mode') === 'true';
    this.setRipperMode(savedRipper, false);

    // Update enter-hint in composer with typewriter notation
    const composerHint = document.getElementById('composer-shortcut-hint');
    if (composerHint) {
      composerHint.textContent = appState.settings.enterToSend 
        ? 'ENTER --> send | SHIFT+ENTER --> newline'
        : 'CTRL+ENTER --> send | ENTER --> newline';
    }

    // Sync mascot companion preferences to settings controls
    if (window.mascotController && window.mascotController.applySettingsUI) {
      window.mascotController.applySettingsUI();
    }
  }
}

window.settingsController = new SettingsController();
