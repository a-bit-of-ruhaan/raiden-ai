/**
 * RAIDEN AI — CONTEXT LIBRARY CONTROLLER
 * Ingestion and management of documents, files, and snippets for local AI context.
 */

class LibraryController {
  init() {
    this.bindEvents();
    this.renderLibraryList();
  }

  bindEvents() {
    const btnImport = document.getElementById('btn-import-file');
    if (btnImport) {
      btnImport.addEventListener('click', () => this.handleImportFile());
    }

    const dropzone = document.getElementById('library-dropzone');
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.processFiles(e.dataTransfer.files);
        }
      });
      dropzone.addEventListener('click', () => this.handleImportFile());
    }

    const fileInput = document.getElementById('library-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.processFiles(e.target.files);
        }
      });
    }
  }

  async handleImportFile() {
    // Try native dialog
    try {
      const fileData = await raidenAPI.openFileDialog();
      if (fileData && !fileData.error) {
        const item = {
          id: 'doc-' + Date.now(),
          name: fileData.name,
          size: fileData.size,
          lineCount: fileData.line_count || fileData.content.split('\n').length,
          extension: fileData.extension,
          dateAdded: new Date().toISOString(),
          content: fileData.content
        };
        appState.addLibraryItem(item);
        this.renderLibraryList();
        showToast(`Imported ${item.name} to Library`, 'success');
        return;
      }
    } catch (e) {
      console.warn('Native dialog fallback to input', e);
    }

    const fileInput = document.getElementById('library-file-input');
    if (fileInput) fileInput.click();
  }

  processFiles(files) {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const item = {
          id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          name: file.name,
          size: file.size,
          lineCount: content.split('\n').length,
          extension: '.' + file.name.split('.').pop().toLowerCase(),
          dateAdded: new Date().toISOString(),
          content: content
        };
        appState.addLibraryItem(item);
        this.renderLibraryList();
        showToast(`Added ${item.name} to Library`, 'success');
      };
      reader.readAsText(file);
    });
  }

  renderLibraryList() {
    const container = document.getElementById('library-items-list');
    if (!container) return;

    if (!appState.libraryItems || appState.libraryItems.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 13px;">
          No documents in library yet. Import code or markdown files to get started.
        </div>
      `;
      return;
    }

    container.innerHTML = appState.libraryItems.map(item => `
      <div class="library-item-card">
        <div class="lib-item-left">
          <div class="lib-file-icon">
            <span style="font-size: 10px; font-weight: 700; letter-spacing: 0.5px;">${(item.extension || '.TXT').replace('.', '').toUpperCase()}</span>
          </div>
          <div class="lib-file-meta">
            <span class="lib-file-name">${escapeHtml(item.name)}</span>
            <span class="lib-file-sub">${formatBytes(item.size)} • ${item.lineCount || 0} lines • Added ${timeAgo(item.dateAdded)}</span>
          </div>
        </div>
        <div class="lib-actions">
          <button class="btn-secondary" onclick="libraryController.previewItem('${item.id}')" title="Inspect Content">
            ${ICONS.eye}
            <span>Inspect</span>
          </button>
          <button class="btn-primary" onclick="libraryController.queryInChat('${item.id}')" title="Reference in Chat">
            ${ICONS.chat}
            <span>Ask RAIDEN</span>
          </button>
          <button class="btn-icon-header" onclick="libraryController.deleteItem('${item.id}')" title="Delete Document">
            ${ICONS.trash}
          </button>
        </div>
      </div>
    `).join('');
  }

  previewItem(itemId) {
    const item = appState.libraryItems.find(i => i.id === itemId);
    if (!item) return;

    const modalTitle = document.getElementById('preview-modal-title');
    const modalBody = document.getElementById('preview-modal-body');

    if (modalTitle) modalTitle.textContent = `${item.name} (${formatBytes(item.size)})`;
    if (modalBody) {
      const lang = item.extension.replace('.', '') || 'plaintext';
      modalBody.innerHTML = `
        <div class="code-block-wrapper" style="margin: 0; max-height: 400px; overflow-y: auto;">
          <pre><code class="language-${lang}">${escapeHtml(item.content)}</code></pre>
        </div>
      `;
    }

    openModal('preview-file-modal');
  }

  queryInChat(itemId) {
    const item = appState.libraryItems.find(i => i.id === itemId);
    if (!item) return;

    appState.createSession(`Analysis: ${item.name}`);
    window.appController.navigateTo('chat');
    chatController.renderCurrentSession();
    chatController.seedPrompt(`I have loaded ${item.name} into context.\n\n\`\`\`${item.extension.replace('.', '')}\n${item.content}\n\`\`\`\n\nPlease review this file, explain what it does, and identify any potential bugs or optimizations.`);
    showToast(`Loaded ${item.name} into Chat`, 'success');
  }

  deleteItem(itemId) {
    appState.removeLibraryItem(itemId);
    this.renderLibraryList();
    showToast('Removed item from Library', 'info');
  }
}

window.libraryController = new LibraryController();
