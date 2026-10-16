/**
 * RAIDEN AI — CHAT CONTROLLER & WORKSPACE
 */

function playPopSound() {
  if (!window.appState || !window.appState.settings || !window.appState.settings.soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
}

function playChimeSound() {
  if (!window.appState || !window.appState.settings || !window.appState.settings.soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch (e) {}
}

class ChatController {
  constructor() {
    this.chatScrollArea = null;
    this.chatContainer = null;
    this.composerTextarea = null;
    this.sendButton = null;
    this.generationIndicator = null;
    this.genTimerElement = null;
    this.attachmentBar = null;
    this.chatTitleInput = null;
    this.timerInterval = null;
    this.abortController = null;
  }

  init() {
    this.chatScrollArea = document.getElementById('chat-scroll-area');
    this.chatContainer = document.getElementById('chat-messages-container');
    this.composerTextarea = document.getElementById('composer-textarea');
    this.sendButton = document.getElementById('btn-send-prompt');
    this.generationIndicator = document.getElementById('generation-indicator');
    this.genTimerElement = document.getElementById('gen-timer');
    this.attachmentBar = document.getElementById('composer-attachment-bar');
    this.chatTitleInput = document.getElementById('chat-title-input');

    this.bindEvents();
    this.updateWebSearchButtonUI();
    this.updateModelModeUI();
    this.updateMoodBadgeUI();
    this.renderCurrentSession();
  }

  bindEvents() {
    // Auto-grow textarea
    if (this.composerTextarea) {
      this.composerTextarea.addEventListener('input', () => {
        this.composerTextarea.style.height = 'auto';
        this.composerTextarea.style.height = Math.min(this.composerTextarea.scrollHeight, 180) + 'px';
        this.updateSendButtonState();
        if (window.mascotController) {
          window.mascotController.handleSystemEvent('TYPING');
        }
      });

      this.composerTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (appState.settings.enterToSend) {
            if (!e.shiftKey) {
              e.preventDefault();
              this.sendMessage();
            }
          } else {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              this.sendMessage();
            }
          }
        }
      });
    }

    // Send button
    if (this.sendButton) {
      this.sendButton.addEventListener('click', () => this.sendMessage());
    }

    // Stop generation
    const stopBtn = document.getElementById('btn-stop-gen');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stopGeneration());
    }

    // Editable chat title
    if (this.chatTitleInput) {
      this.chatTitleInput.addEventListener('change', () => {
        const val = this.chatTitleInput.value.trim();
        if (val) {
          appState.renameSession(appState.activeSessionId, val);
          window.appController.renderSidebarSessions();
        }
      });
    }

    // File attachment button
    const btnAttach = document.getElementById('btn-attach-file');
    if (btnAttach) {
      btnAttach.addEventListener('click', () => this.handleAttachFile());
    }

    // Web Search Toggle button
    const btnSearch = document.getElementById('btn-toggle-web-search');
    if (btnSearch) {
      btnSearch.addEventListener('click', () => {
        appState.webSearchEnabled = !appState.webSearchEnabled;
        appState.saveToStorage();
        raidenAPI.toggleWebSearch(appState.webSearchEnabled);
        this.updateWebSearchButtonUI();
        showToast(appState.webSearchEnabled ? 'Online Web Research enabled' : 'Web Research disabled (Offline/Local only)', 'info');
      });
    }

    // Model mode selector (Auto / Fast / Advanced)
    const modelModeSelect = document.getElementById('composer-model-mode-select');
    if (modelModeSelect) {
      modelModeSelect.value = appState.modelMode || 'auto';
      modelModeSelect.addEventListener('change', (e) => {
        const mode = e.target.value;
        appState.modelMode = mode;
        appState.saveToStorage();
        raidenAPI.setModelMode(mode);
        this.updateModelModeUI();
        showToast(`Model routing mode: ${mode.toUpperCase()}`, 'info');
      });
    }

    // Interactive Quick Actions Bar
    const quickBar = document.getElementById('composer-quick-bar');
    if (quickBar) {
      quickBar.addEventListener('click', (e) => {
        const pill = e.target.closest('.quick-vibe-pill');
        if (pill && pill.dataset.prompt) {
          const raw = pill.dataset.prompt.replace(/\\n/g, '\n');
          if (pill.textContent.includes('Roast')) {
            this.setRoastMode('brutal', false);
          }
          this.seedPrompt(raw);
        }
      });
    }

    // Dedicated Roast Mode selector in header
    const roastSelect = document.getElementById('header-roast-mode-select');
    if (roastSelect) {
      roastSelect.value = appState.roastMode || 'off';
      roastSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        this.setRoastMode(val, true);
      });
    }

    // Preset / Vibe mode selector in composer toolbar
    const modeSelect = document.getElementById('composer-mode-select');
    if (modeSelect) {
      modeSelect.value = appState.vibeMode || 'friend';
      modeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        appState.vibeMode = val;
        if (val === 'brutal_roast') {
          appState.roastMode = 'brutal';
        } else if (val === 'roast') {
          appState.roastMode = 'playful';
        } else {
          appState.roastMode = 'off';
        }
        appState.saveToStorage();
        this.updateMoodBadgeUI();
        const labels = {
          friend: 'Best Friend mode active ⚡ (warm, witty banter)',
          brutal_roast: '💀 Roast My Code active! (Brutal, funny, merciless burns ready)',
          roast: 'Roast Master active 🔥 (playful comedic banter)',
          academic: 'Deep Reasoning active 🧠 (exam-grade structured depth)',
          code: 'Code Ninja active 💻 (clean syntax & architecture)',
          chill: 'Chill Buddy active ☕ (relaxed, cozy conversation)',
          hinglish: 'Desi Hinglish active 🇮🇳 (bhai vibe)'
        };
        showToast(labels[val] || 'Mode updated', val === 'brutal_roast' ? 'warning' : 'info');
      });
    }

    // Intercept clicks on links inside chat messages to open via safe browser tool
    if (this.chatContainer) {
      this.chatContainer.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href) {
          e.preventDefault();
          raidenAPI.executeTool('open_url', { url: link.href });
        }
      });
    }
  }

  setRoastMode(mode, showNotification = true) {
    appState.roastMode = mode;
    if (mode === 'brutal') {
      appState.vibeMode = 'brutal_roast';
    } else if (mode === 'playful') {
      appState.vibeMode = 'roast';
    } else {
      if (appState.vibeMode === 'brutal_roast' || appState.vibeMode === 'roast') {
        appState.vibeMode = 'friend';
      }
    }
    appState.saveToStorage();
    this.updateMoodBadgeUI();

    if (showNotification) {
      if (mode === 'brutal') {
        showToast('💀 Roast My Code: BRUTAL mode active! Zero mercy, comedy gold, and savage code burns ready.', 'warning');
      } else if (mode === 'playful') {
        showToast('🌶️ Playful Roast active (lighthearted teasing & tips).', 'info');
      } else {
        showToast('🌿 Roast Mode disabled (Normal companion mode active).', 'info');
      }
    }
  }

  updateMoodBadgeUI() {
    const moodEmojiEl = document.getElementById('header-mood-emoji');
    const moodTextEl = document.getElementById('header-mood-text');
    const modeSelect = document.getElementById('composer-mode-select');
    const roastSelect = document.getElementById('header-roast-mode-select');
    const vibe = appState.vibeMode || 'friend';
    const roast = appState.roastMode || 'off';

    if (modeSelect) {
      modeSelect.value = vibe;
    }
    if (roastSelect) {
      roastSelect.value = roast;
      if (roast === 'brutal') {
        roastSelect.classList.add('active-brutal');
      } else {
        roastSelect.classList.remove('active-brutal');
      }
    }

    const moodMap = {
      friend: { emoji: '⚡', text: 'Best Friend' },
      brutal_roast: { emoji: '💀', text: 'Brutal Roaster' },
      roast: { emoji: '🔥', text: 'Roast Master' },
      academic: { emoji: '🧠', text: 'Deep Reasoning' },
      code: { emoji: '💻', text: 'Code Ninja' },
      chill: { emoji: '☕', text: 'Chill Buddy' },
      hinglish: { emoji: '🇮🇳', text: 'Desi Hinglish' }
    };

    const m = moodMap[vibe] || moodMap.friend;
    if (moodEmojiEl) moodEmojiEl.textContent = m.emoji;
    if (moodTextEl) moodTextEl.textContent = m.text;

    // Dynamic placeholder hint
    if (this.composerTextarea) {
      if (roast === 'brutal' || vibe === 'brutal_roast') {
        this.composerTextarea.placeholder = 'Paste code or ask anything... brutal roast flamethrower active 🔥💀';
      } else if (roast === 'playful' || vibe === 'roast') {
        this.composerTextarea.placeholder = 'Paste code or ask anything... playful banter & roasts ready 🔥';
      } else {
        this.composerTextarea.placeholder = 'Ask RAIDEN anything... (paste code, execute queries, or debug errors)';
      }
    }
  }

  updateWebSearchButtonUI() {
    const btn = document.getElementById('btn-toggle-web-search');
    if (!btn) return;
    const label = btn.querySelector('.tool-btn-label') || btn;
    if (appState.webSearchEnabled) {
      btn.classList.add('active');
      label.textContent = 'Web: On';
      btn.title = 'Web Research: Enabled (Click to disable)';
    } else {
      btn.classList.remove('active');
      label.textContent = 'Web';
      btn.title = 'Web Research: Disabled (Click to enable)';
    }
  }

  updateModelModeUI() {
    const sel = document.getElementById('composer-model-mode-select');
    if (sel) sel.value = appState.modelMode || 'auto';
    const headerBadge = document.getElementById('header-model-name');
    if (headerBadge) {
      const modeLabel = (appState.modelMode || 'auto').toUpperCase();
      headerBadge.textContent = `${appState.activeModel} [${modeLabel}]`;
    }
  }

  updateSendButtonState() {
    if (!this.sendButton || !this.composerTextarea) return;
    const hasText = this.composerTextarea.value.trim().length > 0;
    const hasFile = !!appState.attachedFile;
    this.sendButton.disabled = (!hasText && !hasFile) || appState.isGenerating;
  }

  renderCurrentSession() {
    const session = appState.getActiveSession();
    if (!session) return;

    if (this.chatTitleInput) {
      this.chatTitleInput.value = session.title || 'Conversation';
    }

    if (!this.chatContainer) return;
    this.chatContainer.innerHTML = '';

    if (!session.messages || session.messages.length === 0) {
      this.renderWelcomeScreen();
    } else {
      session.messages.forEach(msg => {
        this.appendMessageElement(msg);
      });
    }

    this.updateAttachmentUI();
    this.updateSendButtonState();
    this.scrollToBottom();
  }

  renderWelcomeScreen() {
    const welcome = document.createElement('div');
    welcome.className = 'welcome-hero';
    const userName = (appState.userProfile && appState.userProfile.name) ? appState.userProfile.name : '';
    const greeting = userName ? `Welcome back, ${escapeHtml(userName)}!` : `What would you like to build today?`;
    const sub = userName 
      ? `Your local AI assistant is online. Let's code, debug, learn, or solve complex problems.`
      : `High-performance local AI running directly on your machine. Private, fast, and completely on-device.`;

    welcome.innerHTML = `
      <div class="welcome-brand-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:13px;height:13px;"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <span>LOCAL RUNTIME READY</span>
      </div>
      <h1 class="welcome-title">${greeting}</h1>
      <p class="welcome-subtitle">${sub}</p>
      <div class="welcome-suggestions">
        <button class="suggestion-chip" onclick="chatController.seedPrompt('Roast my code and be completely savage with zero mercy:\\n\\n\`\`\`python\\n\\n\`\`\`')">
          <span>🔥 Roast my code</span>
          <span class="brand-badge">FUN</span>
        </button>
        <button class="suggestion-chip" onclick="chatController.seedPrompt('Here is an error I am encountering. Help me diagnose and fix it cleanly:\\n\\n')">
          <span>🚀 Debug my error</span>
          <span class="brand-badge">CODE</span>
        </button>
        <button class="suggestion-chip" onclick="chatController.seedPrompt('Hey Raiden, vibe check! What\\'s on your mind today?')">
          <span>💬 Vibe check &amp; banter</span>
          <span class="brand-badge">CHAT</span>
        </button>
        <button class="suggestion-chip" onclick="chatController.seedPrompt('Give me your spiciest, most controversial tech or programming hot take!')">
          <span>💡 Spicy tech hot take</span>
          <span class="brand-badge">OPINION</span>
        </button>
        <button class="suggestion-chip" onclick="chatController.seedPrompt('Design a modular architecture for a new scalable project:\\n\\n')">
          <span>⚡ System architecture</span>
          <span class="brand-badge">DESIGN</span>
        </button>
      </div>
    `;
    this.chatContainer.appendChild(welcome);
  }

  seedPrompt(text) {
    if (!this.composerTextarea) return;
    this.composerTextarea.value = text;
    this.composerTextarea.focus();
    this.composerTextarea.style.height = 'auto';
    this.composerTextarea.style.height = Math.min(this.composerTextarea.scrollHeight, 180) + 'px';
    this.updateSendButtonState();
  }

  appendMessageElement(msg) {
    const isUser = msg.role === 'user';
    const row = document.createElement('div');
    row.className = `message-row ${isUser ? 'user' : 'assistant'}`;
    row.id = msg.id;

    let formattedContent = '';
    if (msg.isBridgeError) {
      formattedContent = `
        <div class="bridge-error-banner">
          <div class="bridge-error-header">
            <div class="bridge-pulse-dot"></div>
            <span>Connecting to RAIDEN Core...</span>
          </div>
          <p class="bridge-error-desc">
            The local desktop bridge hasn't connected yet. If the application just launched, it may take a few moments to initialize.
          </p>
          <button class="btn-bridge-retry" onclick="chatController.retryPendingMessage('${msg.id}')">
            ${ICONS.refresh}
            <span>Retry Connection</span>
          </button>
        </div>
      `;
    } else {
      formattedContent = isUser 
        ? escapeHtml(msg.content).replace(/\n/g, '<br>')
        : renderMarkdown(msg.content);
    }

    const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    row.innerHTML = `
      <div class="message-container">
        <div class="message-avatar ${isUser ? 'user-av' : 'bot-av'}">
          ${isUser ? 'You' : '<img src="assets/mascot/avatar_head_32x32.png" class="bot-pixel-avatar" alt="Raiden" />'}
        </div>
        <div class="message-bubble-wrap">
          <div class="message-header">
            <span>${isUser ? 'You' : 'RAIDEN'}</span>
            <span>·</span>
            <span>${timeStr}</span>
            ${!isUser && msg.latencyMs ? `<span class="inference-telemetry-badge">${msg.latencyMs}ms (${(msg.latencyMs / 1000).toFixed(3)}s)</span>` : ''}
          </div>
          <div class="message-bubble">
            ${formattedContent}
          </div>
          <div class="message-actions-bar">
            <button class="btn-msg-action" onclick="chatController.copyMessage('${msg.id}')">
              ${ICONS.copy}
              <span>Copy</span>
            </button>
            ${!isUser ? `
              <button class="btn-msg-action" onclick="chatController.regenerateResponse('${msg.id}')">
                ${ICONS.refresh}
                <span>Regenerate</span>
              </button>
            ` : `
              <button class="btn-msg-action" onclick="chatController.editPrompt('${msg.id}')">
                ${ICONS.edit}
                <span>Edit</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    this.chatContainer.appendChild(row);
  }

  copyMessage(msgId) {
    const session = appState.getActiveSession();
    if (!session) return;
    const msg = session.messages.find(m => m.id === msgId);
    if (msg && msg.content) {
      copyToClipboard(msg.content, 'Message copied');
      if (window.mascotController) {
        window.mascotController.handleSystemEvent('MESSAGE_COPIED', { content: msg.content, role: msg.role });
      }
    }
  }

  async sendMessage() {
    if (appState.isGenerating) return;

    let text = this.composerTextarea ? this.composerTextarea.value.trim() : '';
    if (!text && !appState.attachedFile) return;

    // Remove welcome screen if present
    const welcome = this.chatContainer.querySelector('.welcome-hero');
    if (welcome) welcome.remove();

    // Append attached file context if any
    let fullPrompt = text;
    if (appState.attachedFile) {
      fullPrompt = `[Attached File: ${appState.attachedFile.name}]\n\`\`\`${appState.attachedFile.extension.replace('.', '')}\n${appState.attachedFile.content}\n\`\`\`\n\n${text}`;
      appState.attachedFile = null;
      this.updateAttachmentUI();
    }

    // Reset textarea
    this.composerTextarea.value = '';
    this.composerTextarea.style.height = 'auto';
    this.updateSendButtonState();

    // 1. Add User Message
    const userMsg = appState.addMessage(appState.activeSessionId, 'user', fullPrompt);
    this.appendMessageElement(userMsg);
    this.scrollToBottom();
    window.appController.renderSidebarSessions();

    // Immediate Mascot Acknowledgment Reaction
    if (window.mascotController) {
      window.mascotController.handleSystemEvent('MESSAGE_SENT', { prompt: fullPrompt });
    }

    // 2. Start Generating State & Streaming Element
    this.startGenerating();
    if (window.mascotController) {
      const isRoast = (appState.roastMode === 'brutal' || appState.roastMode === 'playful');
      window.mascotController.handleSystemEvent('LLM_THINKING', { isRoast });
    }

    let streamingText = '';
    const streamRow = document.createElement('div');
    streamRow.className = 'message-row assistant streaming-active';
    streamRow.innerHTML = `
      <div class="message-container">
        <div class="message-avatar bot-av">${ICONS.lightning}</div>
        <div class="message-bubble-wrap">
          <div class="message-header">
            <span>Raiden</span><span>·</span><span class="stream-status">typing...</span>
          </div>
          <div class="message-bubble stream-bubble">
            <span class="typing-dot-pulse">Thinking...</span>
          </div>
        </div>
      </div>
    `;
    this.chatContainer.appendChild(streamRow);
    this.scrollToBottom();

    const bubbleEl = streamRow.querySelector('.stream-bubble');

    window.onStreamChunk = (chunk) => {
      streamingText += chunk;
      this.tokenCount += (chunk.trim().split(/\s+/).length || 1);
      if (bubbleEl) {
        bubbleEl.innerHTML = renderMarkdown(streamingText);
      }
      this.scrollToBottom();
      if (window.mascotController) {
        window.mascotController.handleSystemEvent('STREAMING', { chunk });
      }
    };

    window.onStreamEnd = (finalText) => {
      if (finalText) streamingText = finalText;
      window.onStreamChunk = null;
      window.onStreamEnd = null;
    };

    try {
      const modeSelect = document.getElementById('composer-mode-select');
      let customSystemPrompt = appState.settings.systemPrompt || '';

      if (appState.roastMode === 'brutal' || (modeSelect && modeSelect.value === 'brutal_roast')) {
        customSystemPrompt += "\n\n### [SPECIAL DIRECTIVE: BRUTAL & HILARIOUS ROAST MODE ACTIVATED]\n" +
          "The user has explicitly commanded you to ROAST THEIR CODE OR STATEMENTS MERCILESSLY, BRUTALLY, AND IN AN EXCEPTIONALLY FUNNY WAY!\n" +
          "1. ROAST MERCILESSLY & CREATIVELY: Channel the energy of an unhinged, elite 10x staff engineer doing a standup comedy special. " +
          "Deliver sharp burns, comedic hyperbole, and savage tech metaphors. Make fun of bad variable names, spaghetti logic, " +
          "atrocious algorithmic complexity, anti-patterns, absurd dependencies, or questionable coding choices. " +
          "If they just say something casual or ask a silly question, roast their life choices, sleep schedule, and logic!\n" +
          "2. HILARIOUS, NEVER TRULY HATEFUL: Deliver pure comedy gold and playful destruction—sharp, witty, punchy, and entertaining (never genuinely toxic, discriminatory, or abusive).\n" +
          "3. THE GENIUS FIX (REDEMPTION): Right after vaporizing their code into ashes, say something funny like 'Alright, dry your tears, wipe your keyboard, here's how a real engineer writes it:' " +
          "and provide the absolute cleanest, elegant, production-ready, beautifully formatted refactored code with inline comments explaining why it is superior.";
      } else if (appState.roastMode === 'playful' || (modeSelect && modeSelect.value === 'roast')) {
        customSystemPrompt += "\n\n### [PLAYFUL ROAST MODE]: Deliver a witty, lighthearted roast with clever banter, followed by a friendly tip.";
      } else if (modeSelect) {
        if (modeSelect.value === 'hinglish') {
          customSystemPrompt += "\n\n### [SPECIAL DIRECTIVE: DESI HINGLISH COMPANION & TECH GURU ACTIVE]\n" +
            "The user explicitly selected Hinglish mode. Respond in natural, fluent, witty Roman-script Hinglish (Hindi written in English alphabets).\n" +
            "1. Speak like an intelligent Indian tech buddy / senior dev homie. Use popular slangs naturally: 'bhai', 'yaar', 'bawaal', 'gazab', 'scene kya hai', 'load mat le', 'cook kar diya', 'jugaad', 'ek number'.\n" +
            "2. Keep technical words, function names, and code in English ('array', 'pointer', 'loop', 'recursion', 'async/await'), while verbs and sentence flow are in Hindi ('karna padega', 'dekh bhai', 'sort ho gaya').\n" +
            "3. Use classic Bollywood and meme callbacks where relevant (Hera Pheri, 3 Idiots, Mirzapur, 'Aal Izz Well', '25 din mein paisa double', 'Systummm hang').\n" +
            "4. NEVER use Devanagari script. Strictly use Roman alphabet. No robotic corporate pleasantries.";
        } else if (modeSelect.value === 'code') {
          customSystemPrompt += "\n\nMODE INSTRUCTION: The user explicitly selected Code mode. Focus deeply on software architecture, clean production-ready code, and step-by-step logic.";
        }
      }


      // Collect conversation history (up to last 30 messages) for deep multi-turn coherence
      const currentSession = appState.getActiveSession();
      const recentHistory = (currentSession && currentSession.messages)
        ? currentSession.messages.slice(-30).map(m => ({ role: m.role, content: m.content }))
        : [];

      const responseText = await raidenAPI.sendChat(
        fullPrompt,
        appState.activeSessionId,
        customSystemPrompt,
        appState.activeModel,
        appState.settings.temperature,
        recentHistory,
        appState.settings.topP,
        appState.modelMode,
        appState.webSearchEnabled,
        appState.roastMode
      );

      this.stopGenerating();
      if (streamRow.parentNode) streamRow.remove();

      if (window.mascotController) {
        const isRoast = (appState.roastMode === 'brutal' || appState.roastMode === 'playful');
        window.mascotController.handleSystemEvent('LLM_DONE', { isRoast });
      }

      const finalText = responseText || streamingText;
      const latencyMs = Math.max(1, Math.floor(performance.now() - (appState.generationStartTime || performance.now())));
      // 3. Add Assistant Message
      const botMsg = appState.addMessage(appState.activeSessionId, 'assistant', finalText);
      botMsg.latencyMs = latencyMs;
      this.appendMessageElement(botMsg);
      this.scrollToBottom();
      window.appController.renderSidebarSessions();

    } catch (err) {
      this.stopGenerating();
      if (streamRow.parentNode) streamRow.remove();
      window.onStreamChunk = null;
      window.onStreamEnd = null;

      if (window.mascotController) {
        window.mascotController.handleSystemEvent('ERROR');
      }

      const isBridgeErr = (err.message && err.message.toLowerCase().includes('bridge')) || !window.pywebview;
      const errorContent = isBridgeErr 
        ? 'Connecting to RAIDEN Core...' 
        : `**Error:** ${err.message || 'Unable to reach the local model. Ensure Ollama is running.'}`;

      const botMsg = appState.addMessage(appState.activeSessionId, 'assistant', errorContent);
      if (isBridgeErr) {
        botMsg.isBridgeError = true;
      }
      this.appendMessageElement(botMsg);
      this.scrollToBottom();
      showToast(isBridgeErr ? 'Connecting to local bridge...' : 'Error generating response', isBridgeErr ? 'info' : 'error');
    }
  }

  async regenerateResponse(msgId) {
    if (appState.isGenerating) return;
    const session = appState.getActiveSession();
    if (!session) return;

    const msgIndex = session.messages.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;

    // Find the previous user prompt
    let userPrompt = '';
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (session.messages[i].role === 'user') {
        userPrompt = session.messages[i].content;
        break;
      }
    }

    if (!userPrompt) {
      showToast('No user prompt found to regenerate', 'info');
      return;
    }

    // Remove this assistant message and subsequent messages
    session.messages = session.messages.slice(0, msgIndex);
    appState.saveToStorage();
    this.renderCurrentSession();

    // Start Generating State & Streaming Element
    this.startGenerating();

    let streamingText = '';
    const streamRow = document.createElement('div');
    streamRow.className = 'message-row assistant streaming-active';
    streamRow.innerHTML = `
      <div class="message-container">
        <div class="message-avatar bot-av">${ICONS.lightning}</div>
        <div class="message-bubble-wrap">
          <div class="message-header">
            <span>Raiden</span><span>·</span><span class="stream-status">typing...</span>
          </div>
          <div class="message-bubble stream-bubble">
            <span class="typing-dot-pulse">Thinking...</span>
          </div>
        </div>
      </div>
    `;
    this.chatContainer.appendChild(streamRow);
    this.scrollToBottom();

    const bubbleEl = streamRow.querySelector('.stream-bubble');

    window.onStreamChunk = (chunk) => {
      streamingText += chunk;
      if (bubbleEl) {
        bubbleEl.innerHTML = renderMarkdown(streamingText);
      }
      this.scrollToBottom();
    };

    window.onStreamEnd = (finalText) => {
      if (finalText) streamingText = finalText;
      window.onStreamChunk = null;
      window.onStreamEnd = null;
    };

    try {
      const modeSelect = document.getElementById('composer-mode-select');
      let customSystemPrompt = appState.settings.systemPrompt || '';
      if (modeSelect) {
        if (modeSelect.value === 'hinglish') {
          customSystemPrompt += "\n\n### [SPECIAL DIRECTIVE: DESI HINGLISH COMPANION & TECH GURU ACTIVE]\n" +
            "The user explicitly selected Hinglish mode. Respond in natural, fluent, witty Roman-script Hinglish (Hindi written in English alphabets).\n" +
            "1. Speak like an intelligent Indian tech buddy / senior dev homie. Use popular slangs naturally: 'bhai', 'yaar', 'bawaal', 'gazab', 'scene kya hai', 'load mat le', 'cook kar diya', 'jugaad', 'ek number'.\n" +
            "2. Keep technical words, function names, and code in English ('array', 'pointer', 'loop', 'recursion', 'async/await'), while verbs and sentence flow are in Hindi ('karna padega', 'dekh bhai', 'sort ho gaya').\n" +
            "3. Use classic Bollywood and meme callbacks where relevant (Hera Pheri, 3 Idiots, Mirzapur, 'Aal Izz Well', '25 din mein paisa double', 'Systummm hang').\n" +
            "4. NEVER use Devanagari script. Strictly use Roman alphabet. No robotic corporate pleasantries.";
        } else if (modeSelect.value === 'code') {
          customSystemPrompt += "\n\nMODE INSTRUCTION: The user explicitly selected Code mode. Focus deeply on software architecture, clean production-ready code, and step-by-step logic.";
        }
      }


      const recentHistory = (session && session.messages)
        ? session.messages.slice(-30).map(m => ({ role: m.role, content: m.content }))
        : [];

      const responseText = await raidenAPI.sendChat(
        userPrompt,
        appState.activeSessionId,
        customSystemPrompt,
        appState.activeModel,
        appState.settings.temperature,
        recentHistory,
        appState.settings.topP,
        appState.modelMode,
        appState.webSearchEnabled
      );

      this.stopGenerating();
      if (streamRow.parentNode) streamRow.remove();

      const finalText = responseText || streamingText;
      const botMsg = appState.addMessage(appState.activeSessionId, 'assistant', finalText);
      this.appendMessageElement(botMsg);
      this.scrollToBottom();
      window.appController.renderSidebarSessions();

    } catch (err) {
      this.stopGenerating();
      if (streamRow.parentNode) streamRow.remove();
      window.onStreamChunk = null;
      window.onStreamEnd = null;
      showToast('Regeneration failed', 'error');
    }
  }

  async retryPendingMessage(msgId) {
    const session = appState.getActiveSession();
    if (!session) return;

    const msgIdx = session.messages.findIndex(m => m.id === msgId);
    let userPrompt = '';
    for (let i = (msgIdx !== -1 ? msgIdx - 1 : session.messages.length - 1); i >= 0; i--) {
      if (session.messages[i].role === 'user') {
        userPrompt = session.messages[i].content;
        break;
      }
    }

    if (raidenAPI.checkBridge()) {
      if (msgIdx !== -1) {
        session.messages.splice(msgIdx, 1);
        appState.saveToStorage();
        this.renderCurrentSession();
      }
      if (userPrompt) {
        this.seedPrompt(userPrompt);
        this.sendMessage();
      } else {
        showToast('Bridge connected and ready!', 'success');
      }
    } else {
      showToast('Connecting to local bridge...', 'info');
      const row = document.getElementById(msgId);
      const btn = row ? row.querySelector('.btn-bridge-retry span') : null;
      if (btn) btn.textContent = 'Connecting...';

      setTimeout(() => {
        if (raidenAPI.checkBridge()) {
          showToast('Bridge connected!', 'success');
          if (msgIdx !== -1) {
            session.messages.splice(msgIdx, 1);
            appState.saveToStorage();
            this.renderCurrentSession();
          }
          if (userPrompt) {
            this.seedPrompt(userPrompt);
            this.sendMessage();
          }
        } else {
          if (btn) btn.textContent = 'Retry Connection';
          showToast('Bridge not ready yet. Please ensure main.py is running.', 'warning');
        }
      }, 800);
    }
  }

  editPrompt(msgId) {
    const session = appState.getActiveSession();
    if (!session) return;
    const msg = session.messages.find(m => m.id === msgId);
    if (msg && this.composerTextarea) {
      this.composerTextarea.value = msg.content;
      this.composerTextarea.focus();
      this.composerTextarea.style.height = 'auto';
      this.composerTextarea.style.height = Math.min(this.composerTextarea.scrollHeight, 180) + 'px';
      this.updateSendButtonState();
      showToast('Prompt loaded into composer', 'info');
    }
  }

  startGenerating() {
    appState.isGenerating = true;
    const startTime = performance.now();
    appState.generationStartTime = startTime;
    this.tokenCount = 0;
    this.updateSendButtonState();

    if (this.generationIndicator) {
      this.generationIndicator.classList.add('active');
      const statusText = this.generationIndicator.querySelector('.gen-status-text');
      if (statusText) statusText.textContent = 'Generating response...';
    }

    if (this.genTimerElement) {
      this.genTimerElement.textContent = '0.000s';
      const telemetryEl = document.getElementById('gen-telemetry');
      
      const updateStopwatch = () => {
        if (!appState.isGenerating) return;
        const now = performance.now();
        const elapsedMs = Math.max(0, Math.floor(now - startTime));
        const seconds = (elapsedMs / 1000).toFixed(3);
        this.genTimerElement.textContent = `${seconds}s (${elapsedMs}ms)`;
        
        if (telemetryEl) {
          const tokPerSec = elapsedMs > 80 && this.tokenCount > 0 
            ? ((this.tokenCount / elapsedMs) * 1000).toFixed(1)
            : '0.0';
          telemetryEl.textContent = `${tokPerSec} tok/s`;
        }
        this.stopwatchRaf = requestAnimationFrame(updateStopwatch);
      };
      if (this.stopwatchRaf) cancelAnimationFrame(this.stopwatchRaf);
      this.stopwatchRaf = requestAnimationFrame(updateStopwatch);
    }
    this.scrollToBottom();
  }

  stopGeneration() {
    appState.isGenerating = false;
    if (this.stopwatchRaf) cancelAnimationFrame(this.stopwatchRaf);
    clearInterval(this.timerInterval);
    if (this.generationIndicator) {
      this.generationIndicator.classList.remove('active');
    }
    this.updateSendButtonState();
    if (window.raidenAPI && window.raidenAPI.stopGeneration) {
      window.raidenAPI.stopGeneration();
    }
    if (window.mascotController) {
      window.mascotController.setState('IDLE');
    }
  }

  stopGenerating() {
    appState.isGenerating = false;
    if (this.stopwatchRaf) cancelAnimationFrame(this.stopwatchRaf);
    clearInterval(this.timerInterval);
    if (this.generationIndicator) {
      this.generationIndicator.classList.remove('active');
    }
    this.updateSendButtonState();
    if (window.mascotController) {
      window.mascotController.setState('IDLE');
    }
  }

  scrollToBottom() {
    if (this.chatScrollArea) {
      setTimeout(() => {
        this.chatScrollArea.scrollTop = this.chatScrollArea.scrollHeight;
      }, 50);
    }
  }

  async handleAttachFile() {
    // Attempt native file dialog via Python backend
    try {
      const fileData = await raidenAPI.openFileDialog();
      if (fileData && !fileData.error) {
        appState.attachedFile = fileData;
        this.updateAttachmentUI();
        this.updateSendButtonState();
        showToast(`Attached ${fileData.name}`, 'success');
        return;
      }
    } catch (e) {
      console.warn('Native dialog failed, fallback to input', e);
    }

    // Fallback: trigger hidden HTML5 file input
    const fileInput = document.getElementById('chat-file-input');
    if (fileInput) fileInput.click();
  }

  onHtmlFileInput(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      appState.attachedFile = {
        name: file.name,
        size: file.size,
        extension: '.' + file.name.split('.').pop(),
        content: e.target.result,
        lineCount: e.target.result.split('\n').length
      };
      this.updateAttachmentUI();
      this.updateSendButtonState();
      showToast(`Attached ${file.name}`, 'success');
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  updateAttachmentUI() {
    if (!this.attachmentBar) return;
    if (appState.attachedFile) {
      this.attachmentBar.classList.add('has-attachment');
      this.attachmentBar.innerHTML = `
        <div class="attachment-chip">
          ${ICONS.file}
          <span>${appState.attachedFile.name} (${formatBytes(appState.attachedFile.size)})</span>
          <button class="btn-remove-attachment" onclick="chatController.removeAttachment()">
            ${ICONS.close}
          </button>
        </div>
      `;
    } else {
      this.attachmentBar.classList.remove('has-attachment');
      this.attachmentBar.innerHTML = '';
    }
  }

  removeAttachment() {
    appState.attachedFile = null;
    this.updateAttachmentUI();
    this.updateSendButtonState();
  }
}

window.chatController = new ChatController();
