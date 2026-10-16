/**
 * RAIDEN AI — MAIN APPLICATION CONTROLLER
 * Routing, global shortcuts, sidebar sessions, and lifecycle initialization.
 */

class AppController {
  constructor() {
    this.sidebar = null;
    this.isSidebarCollapsed = false;
  }

  init() {
    this.sidebar = document.getElementById('sidebar');

    // Initialize Markdown and highlight.js
    if (window.initMarkdownParser) {
      window.initMarkdownParser();
    }

    // Initialize all modular controllers
    if (window.chatController) window.chatController.init();
    if (window.toolsController) window.toolsController.init();
    if (window.libraryController) window.libraryController.init();
    if (window.historyController) window.historyController.init();
    if (window.modelCenterController) window.modelCenterController.init();
    if (window.diagnosticsController) window.diagnosticsController.init();
    if (window.settingsController) window.settingsController.init();

    // Synchronize backend dual-model and memory config
    if (appState.syncBackendConfig) {
      appState.syncBackendConfig().then(() => {
        if (window.chatController) {
          window.chatController.updateModelModeUI();
          window.chatController.updateWebSearchButtonUI();
        }
        if (window.settingsController) {
          window.settingsController.syncTogglesFromBackend();
        }
      });
    }

    // Synchronize chats, history, and user profile from persistent disk storage
    if (appState.syncFromDiskStorage) {
      appState.syncFromDiskStorage();
    }
    if (appState.syncUserProfile) {
      appState.syncUserProfile();
    }

    this.bindGlobalEvents();
    this.renderSidebarSessions();
    this.navigateTo(appState.activePage || 'chat');

    // Initialize Cyber-Ronin Desktop Mascot Companion (130px x 130px)
    if (window.MascotController && document.getElementById('raidenCanvas') && !window.mascotController) {
      window.mascotController = new window.MascotController({
        canvasId: 'raidenCanvas',
        bubbleId: 'raiden-dialogue-bubble',
        containerId: 'raiden-mascot-container',
        width: 130,
        height: 130
      });
    }

    // Periodic telemetry refresh
    setInterval(() => {
      if (window.diagnosticsController) {
        window.diagnosticsController.refreshTelemetry();
      }
    }, 15000);
  }

  bindGlobalEvents() {
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');
        if (page) this.navigateTo(page);
      });
    });

    // New Chat buttons
    document.querySelectorAll('.btn-new-chat').forEach(btn => {
      btn.addEventListener('click', () => {
        const session = appState.createSession('New Conversation');
        this.renderSidebarSessions();
        this.navigateTo('chat');
        chatController.renderCurrentSession();
        if (window.mascotController) {
          window.mascotController.handleSystemEvent('CHAT_CLEARED');
        }
        showToast('Created new conversation', 'info');
      });
    });

    // Sidebar collapse toggle
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    if (btnToggleSidebar) {
      btnToggleSidebar.addEventListener('click', () => {
        this.toggleSidebar();
      });
    }

    // Clear active chat button
    const btnClearChat = document.getElementById('btn-clear-chat');
    if (btnClearChat) {
      btnClearChat.addEventListener('click', () => {
        appState.clearSession(appState.activeSessionId);
        chatController.renderCurrentSession();
        raidenAPI.clearChat(appState.activeSessionId);
        if (window.mascotController) {
          window.mascotController.handleSystemEvent('CHAT_CLEARED');
        }
        showToast('Cleared conversation history', 'info');
      });
    }

    // Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        appState.createSession('New Conversation');
        this.renderSidebarSessions();
        this.navigateTo('chat');
        chatController.renderCurrentSession();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (window.settingsController) {
          const isCurrent = document.documentElement.getAttribute('data-ripper-mode') === 'true';
          window.settingsController.setRipperMode(!isCurrent, true);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.navigateTo('history');
        const searchInput = document.getElementById('history-search-input');
        if (searchInput) searchInput.focus();
      } else if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
      }
    });

    // Close modal clicks on backdrop
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('open');
      });
    });
  }

  navigateTo(pageId) {
    if (pageId === 'chat-hub') pageId = 'chat';
    appState.activePage = pageId;

    // Update nav links
    document.querySelectorAll('.nav-item').forEach(item => {
      const p = item.getAttribute('data-page');
      if (p === pageId || (pageId === 'chat' && p === 'chat-hub')) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Show/hide view containers
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.remove('active');
    });

    const targetView = document.getElementById(`page-${pageId}`);
    if (targetView) {
      targetView.classList.add('active');
    }

    // Update Header
    const viewTitle = document.getElementById('header-view-title');
    const chatTitleWrap = document.getElementById('header-chat-title-wrap');

    if (pageId === 'chat') {
      if (viewTitle) viewTitle.style.display = 'none';
      if (chatTitleWrap) chatTitleWrap.style.display = 'flex';
      chatController.renderCurrentSession();
    } else {
      if (viewTitle) {
        viewTitle.style.display = 'flex';
        viewTitle.textContent = this.getPageTitle(pageId);
      }
      if (chatTitleWrap) chatTitleWrap.style.display = 'none';
    }

    // Specific page refreshes
    if (pageId === 'history' && window.historyController) {
      window.historyController.renderHistoryList();
    } else if (pageId === 'library' && window.libraryController) {
      window.libraryController.renderLibraryList();
    } else if (pageId === 'diagnostics' && window.diagnosticsController) {
      window.diagnosticsController.refreshTelemetry();
    } else if (pageId === 'settings' && window.settingsController) {
      window.settingsController.loadPersonalizationAndStats();
    }
  }

  getPageTitle(pageId) {
    const titles = {
      'chat': 'Chat Hub',
      'chat-hub': 'Chat Hub',
      'tools': 'Explore Tools',
      'library': 'Context Library',
      'history': 'Conversation History',
      'model-center': 'Model Center',
      'diagnostics': 'System Diagnostics & Telemetry',
      'settings': 'Settings & Preferences'
    };
    return titles[pageId] || 'RAIDEN AI';
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (this.sidebar) {
      this.sidebar.classList.toggle('collapsed', this.isSidebarCollapsed);
    }
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    if (toggleBtn) {
      toggleBtn.innerHTML = this.isSidebarCollapsed ? ICONS.chevronRight : ICONS.chevronLeft;
    }
  }

  renderSidebarSessions() {
    const container = document.getElementById('sidebar-sessions-list');
    if (!container) return;

    const recentSessions = appState.sessions.slice(0, 15);
    container.innerHTML = recentSessions.map(session => {
      const isActive = session.id === appState.activeSessionId;
      return `
        <div class="session-item ${isActive ? 'active' : ''}" onclick="appController.selectSession('${session.id}')">
          <span class="session-title-text">${escapeHtml(session.title)}</span>
          <div class="session-actions" onclick="event.stopPropagation()">
            <button class="session-btn-icon" onclick="appController.renameSessionPrompt('${session.id}')" title="Rename Conversation">
              ${ICONS.edit}
            </button>
            <button class="session-btn-icon delete" onclick="appController.deleteSessionPrompt('${session.id}')" title="Delete Conversation">
              ${ICONS.trash}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  selectSession(sessionId) {
    appState.activeSessionId = sessionId;
    appState.saveToStorage();
    this.renderSidebarSessions();
    this.navigateTo('chat');
    chatController.renderCurrentSession();
  }

  renameSessionPrompt(sessionId) {
    const session = appState.sessions.find(s => s.id === sessionId);
    if (!session) return;
    const newTitle = prompt('Rename conversation:', session.title);
    if (newTitle && newTitle.trim()) {
      appState.renameSession(sessionId, newTitle);
      this.renderSidebarSessions();
      chatController.renderCurrentSession();
    }
  }

  deleteSessionPrompt(sessionId) {
    if (confirm('Delete this conversation?')) {
      appState.deleteSession(sessionId);
      this.renderSidebarSessions();
      chatController.renderCurrentSession();
      showToast('Conversation deleted', 'info');
    }
  }
}

window.appController = new AppController();

// Boot application when DOM is ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.appController.init();
  });
} else {
  window.appController.init();
}
