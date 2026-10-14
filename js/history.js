/**
 * RAIDEN AI — CHAT HISTORY CONTROLLER
 * Full conversation log, search, export, and session management.
 */

class HistoryController {
  constructor() {
    this.searchQuery = '';
    this.sessionToDelete = null;
  }

  init() {
    this.bindEvents();
    this.renderHistoryList();
  }

  bindEvents() {
    const searchInput = document.getElementById('history-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderHistoryList();
      });
    }

    const btnConfirmDelete = document.getElementById('btn-confirm-delete-session');
    if (btnConfirmDelete) {
      btnConfirmDelete.addEventListener('click', () => {
        if (this.sessionToDelete) {
          appState.deleteSession(this.sessionToDelete);
          this.sessionToDelete = null;
          closeModal('confirm-delete-modal');
          this.renderHistoryList();
          window.appController.renderSidebarSessions();
          chatController.renderCurrentSession();
          showToast('Conversation deleted', 'info');
        }
      });
    }
  }

  renderHistoryList() {
    const container = document.getElementById('history-cards-list');
    if (!container) return;

    let filtered = appState.sessions;
    if (this.searchQuery) {
      filtered = filtered.filter(s => {
        const titleMatch = (s.title || '').toLowerCase().includes(this.searchQuery);
        const msgMatch = (s.messages || []).some(m => (m.content || '').toLowerCase().includes(this.searchQuery));
        return titleMatch || msgMatch;
      });
    }

    if (!filtered || filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 13px;">
          ${this.searchQuery ? 'No conversations found matching your search.' : 'No conversations recorded yet.'}
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(session => {
      const msgCount = session.messages ? session.messages.length : 0;
      const lastMsg = msgCount > 0 ? session.messages[msgCount - 1].content : 'No messages yet';
      const cleanSnippet = lastMsg.replace(/[#*`\n]/g, ' ').slice(0, 100);

      return `
        <div class="history-card" onclick="historyController.openSession('${session.id}')">
          <div class="history-card-info">
            <h3 class="history-card-title">${session.title}</h3>
            <p class="history-card-snippet">${cleanSnippet}</p>
            <span class="history-card-time">${msgCount} messages • Updated ${timeAgo(session.updatedAt || session.createdAt)}</span>
          </div>
          <div class="session-actions" style="display: flex; gap: 8px;" onclick="event.stopPropagation()">
            <button class="btn-secondary" onclick="historyController.exportSession('${session.id}')" title="Export Markdown">
              ${ICONS.download}
              <span>Export</span>
            </button>
            <button class="btn-danger" onclick="historyController.promptDeleteSession('${session.id}')" title="Delete">
              ${ICONS.trash}
              <span>Delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  openSession(sessionId) {
    appState.activeSessionId = sessionId;
    appState.saveToStorage();
    window.appController.navigateTo('chat');
    chatController.renderCurrentSession();
    window.appController.renderSidebarSessions();
  }

  exportSession(sessionId) {
    const session = appState.sessions.find(s => s.id === sessionId);
    if (!session) return;

    let markdown = `# ${session.title}\n*Exported from RAIDEN AI on ${new Date().toLocaleString()}*\n\n---\n\n`;
    (session.messages || []).forEach(m => {
      const author = m.role === 'user' ? '**You**' : '**Raiden**';
      markdown += `### ${author} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-z0-9_-]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported conversation as Markdown', 'success');
  }

  promptDeleteSession(sessionId) {
    this.sessionToDelete = sessionId;
    openModal('confirm-delete-modal');
  }
}

window.historyController = new HistoryController();
