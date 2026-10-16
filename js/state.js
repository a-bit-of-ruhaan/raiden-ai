/**
 * RAIDEN AI — STATE MANAGEMENT
 * Central store for sessions, library items, settings, and runtime status.
 */

const DEFAULT_SYSTEM_PROMPT = 
  "You are RAIDEN, a fast, local AI desktop assistant running entirely on this machine. " +
  "If asked who made you, say you were built by Ruhaan.\n\n" +
  "Tone & Style:\n" +
  "- Speak naturally like a sharp, supportive friend sitting beside the user.\n" +
  "- Jump straight into answers without canned corporate filler like \"Certainly!\" or \"I'd be happy to help!\".\n" +
  "- When invited, deliver witty, playful roasts; otherwise be direct, warm, and helpful.\n\n" +
  "Instructions:\n" +
  "- Follow the user's formatting instructions strictly and exactly (e.g., line counts, brevity, code-only outputs, or bullet styles).\n" +
  "- For coding tasks, provide clean, idiomatic code with helpful comments.\n" +
  "- Be honest: if you do not know something or lack tool access, state it plainly without fabricating facts.";

class AppState {
  constructor() {
    this.sessions = [];
    this.activeSessionId = null;
    this.activePage = 'chat';
    this.libraryItems = [];
    this.activeModel = 'qwen2.5-coder:3b';
    this.modelsList = [];
    this.attachedFile = null;
    this.isGenerating = false;
    this.generationStartTime = 0;
    this.telemetry = {
      ollama_online: false,
      active_model: 'qwen2.5-coder:3b',
      gpu_name: '',
      gpu_total_mb: 0,
      gpu_free_mb: 0,
      gpu_used_mb: 0,
      gpu_available: false,
      ram_total_gb: 0,
      ram_avail_gb: 0,
      ram_load_percent: 0,
      platform: '',
      python_version: ''
    };

    this.modelMode = 'auto'; // 'auto' | 'fast' | 'advanced'
    this.fastModel = 'qwen2.5-coder:3b';
    this.advancedModel = 'llama3.1:8b';
    this.webSearchEnabled = false;
    this.offlineMode = false;
    this.memoryEnabled = true;
    this.memoriesList = [];
    this.toolAuditLogs = [];
    this.routingHistory = [];

    // Personalization & Real-Friend Profile
    this.userProfile = {
      name: '',
      role: '',
      interests: '',
      roast_level: 'Playful',
      notes: ''
    };
    this.vibeMode = 'friend'; // 'friend' | 'roast' | 'academic' | 'code' | 'chill' | 'hinglish'
    this.roastMode = 'off'; // 'off' | 'playful' | 'brutal'

    this.settings = {
      accent: 'black',
      density: 'comfortable',
      enterToSend: true,
      soundEnabled: true,
      temperature: 0.65,
      topP: 0.85,
      systemPrompt: DEFAULT_SYSTEM_PROMPT
    };

    this.init();
  }

  async syncBackendConfig() {
    if (window.raidenAPI) {
      try {
        const cfg = await raidenAPI.getModelConfig();
        if (cfg) {
          if (cfg.model_mode) this.modelMode = cfg.model_mode;
          if (cfg.fast_model) this.fastModel = cfg.fast_model;
          if (cfg.advanced_model) this.advancedModel = cfg.advanced_model;
          if (cfg.web_search_enabled !== undefined) this.webSearchEnabled = cfg.web_search_enabled;
          if (cfg.offline_mode !== undefined) this.offlineMode = cfg.offline_mode;
          if (cfg.memory_enabled !== undefined) this.memoryEnabled = cfg.memory_enabled;
          this.saveToStorage();
        }
      } catch (e) {
        console.warn('Config sync error:', e);
      }
    }
  }

  init() {
    this.loadFromStorage();

    // Default session if none exist
    if (!this.sessions || this.sessions.length === 0) {
      this.createSession('New Conversation');
    } else if (!this.activeSessionId) {
      this.activeSessionId = this.sessions[0].id;
    }

    // Default library sample if empty
    if (!this.libraryItems || this.libraryItems.length === 0) {
      this.libraryItems = [
        {
          id: 'doc-raiden-guide',
          name: 'Raiden_Architecture_Overview.md',
          size: 820,
          lineCount: 18,
          extension: '.md',
          dateAdded: new Date().toISOString(),
          content: `# RAIDEN AI Architecture Overview\n\n- **Inference Runtime**: Ollama (local GGUF engine)\n- **Primary Model**: Qwen 2.5 Coder 3B (Q4_K_M quantization)\n- **Interface**: PyWebView desktop application\n- **Capabilities**: Code generation, debugging, document analysis, general Q&A\n- **Data handling**: All inference runs locally on-device.`
        }
      ];
    }
  }

  createSession(title = 'New Conversation') {
    const newSession = {
      id: 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    this.sessions.unshift(newSession);
    this.activeSessionId = newSession.id;
    this.saveToStorage();
    return newSession;
  }

  getActiveSession() {
    return this.sessions.find(s => s.id === this.activeSessionId) || this.sessions[0];
  }

  deleteSession(sessionId) {
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
    if (this.sessions.length === 0) {
      this.createSession('New Conversation');
    } else if (this.activeSessionId === sessionId) {
      this.activeSessionId = this.sessions[0].id;
    }
    this.saveToStorage();
  }

  renameSession(sessionId, newTitle) {
    const s = this.sessions.find(sess => sess.id === sessionId);
    if (s && newTitle.trim()) {
      s.title = newTitle.trim();
      s.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  addMessage(sessionId, role, content) {
    const s = this.sessions.find(sess => sess.id === sessionId);
    if (!s) return null;

    const msg = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      role: role,
      content: content,
      timestamp: new Date().toISOString()
    };

    s.messages.push(msg);
    s.updatedAt = new Date().toISOString();

    // Auto-update conversation title if it's the first user message and default title
    if (role === 'user' && (s.title === 'New Conversation' || s.title === 'Chat')) {
      const cleanTitle = content.replace(/[#*`\n]/g, ' ').trim().slice(0, 36);
      s.title = cleanTitle || 'Conversation';
    }

    this.saveToStorage();
    return msg;
  }

  clearSession(sessionId) {
    const s = this.sessions.find(sess => sess.id === sessionId);
    if (s) {
      s.messages = [];
      s.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  addLibraryItem(item) {
    this.libraryItems.unshift(item);
    this.saveToStorage();
  }

  removeLibraryItem(itemId) {
    this.libraryItems = this.libraryItems.filter(i => i.id !== itemId);
    this.saveToStorage();
  }

  saveToStorage() {
    try {
      const data = {
        sessions: this.sessions,
        activeSessionId: this.activeSessionId,
        libraryItems: this.libraryItems,
        settings: this.settings,
        activeModel: this.activeModel,
        modelMode: this.modelMode,
        fastModel: this.fastModel,
        advancedModel: this.advancedModel,
        webSearchEnabled: this.webSearchEnabled,
        offlineMode: this.offlineMode,
        memoryEnabled: this.memoryEnabled,
        userProfile: this.userProfile,
        vibeMode: this.vibeMode,
        roastMode: this.roastMode
      };
      localStorage.setItem('raiden_store_v2', JSON.stringify(data));

      // Also persist to backend if available
      if (window.pywebview && window.pywebview.api && window.pywebview.api.save_storage) {
        window.pywebview.api.save_storage(JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  loadFromStorage() {
    try {
      const raw = localStorage.getItem('raiden_store_v2');
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.sessions)) this.sessions = data.sessions;
        if (data.activeSessionId) this.activeSessionId = data.activeSessionId;
        if (Array.isArray(data.libraryItems)) this.libraryItems = data.libraryItems;
        if (data.modelMode) this.modelMode = data.modelMode;
        if (data.fastModel) this.fastModel = data.fastModel;
        if (data.advancedModel) this.advancedModel = data.advancedModel;
        if (data.webSearchEnabled !== undefined) this.webSearchEnabled = data.webSearchEnabled;
        if (data.offlineMode !== undefined) this.offlineMode = data.offlineMode;
        if (data.memoryEnabled !== undefined) this.memoryEnabled = data.memoryEnabled;
        if (data.userProfile) this.userProfile = { ...this.userProfile, ...data.userProfile };
        if (data.vibeMode) this.vibeMode = data.vibeMode;
        if (data.roastMode) this.roastMode = data.roastMode;
        if (data.settings) {
          this.settings = { ...this.settings, ...data.settings };
          // Auto-migrate legacy/stale prompts to the new Soul & Emotion prompt
          if (!this.settings.systemPrompt || !this.settings.systemPrompt.includes('SOUL, PERSONALITY & EMOTION')) {
            this.settings.systemPrompt = DEFAULT_SYSTEM_PROMPT;
            this.saveToStorage();
          }
        }
        if (data.activeModel) this.activeModel = data.activeModel;
      }
    } catch (e) {
      console.warn('Storage load error:', e);
    }
  }

  async syncUserProfile() {
    if (window.raidenAPI) {
      try {
        const profile = await raidenAPI.getUserProfile();
        if (profile && Object.keys(profile).length > 0) {
          this.userProfile = { ...this.userProfile, ...profile };
          this.saveToStorage();
        }
      } catch (e) {
        console.warn('Profile sync error:', e);
      }
    }
  }

  async syncFromDiskStorage() {
    if (window.raidenAPI) {
      try {
        const diskRaw = await raidenAPI.loadStorage();
        if (diskRaw) {
          const diskData = typeof diskRaw === 'string' ? JSON.parse(diskRaw) : diskRaw;
          if (diskData && Array.isArray(diskData.sessions) && diskData.sessions.length > 0) {
            const localHasMessages = this.sessions && this.sessions.some(s => s.messages && s.messages.length > 0);
            const diskHasMessages = diskData.sessions.some(s => s.messages && s.messages.length > 0);
            if (!localHasMessages || (diskHasMessages && diskData.sessions.length >= this.sessions.length)) {
              this.sessions = diskData.sessions;
              if (diskData.activeSessionId) this.activeSessionId = diskData.activeSessionId;
              if (Array.isArray(diskData.libraryItems) && diskData.libraryItems.length > 0) {
                this.libraryItems = diskData.libraryItems;
              }
              if (diskData.userProfile) this.userProfile = { ...this.userProfile, ...diskData.userProfile };
              this.saveToStorage();
              if (window.appController) window.appController.renderSidebarSessions();
              if (window.chatController) window.chatController.renderCurrentSession();
            }
          }
        }
      } catch (e) {
        console.warn('Disk storage load error:', e);
      }
    }
  }
}

window.appState = new AppState();
