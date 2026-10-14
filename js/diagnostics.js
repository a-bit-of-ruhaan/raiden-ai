/**
 * RAIDEN AI — SYSTEM DIAGNOSTICS CONTROLLER
 * Runtime monitoring of Ollama, GPU, RAM, and system health.
 */

class DiagnosticsController {
  init() {
    this.bindEvents();
    this.refreshTelemetry();
  }

  bindEvents() {
    const btnRefresh = document.getElementById('btn-run-diagnostics');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => this.runHealthCheck());
    }
  }

  async refreshTelemetry() {
    try {
      const stats = await raidenAPI.getSystemStatus();
      if (stats) {
        appState.telemetry = stats;
        this.renderTelemetry(stats);
      }
    } catch (e) {
      console.warn('Error fetching telemetry:', e);
    }
  }

  renderTelemetry(stats) {
    // 1. Ollama status
    const ollamaStatusEl = document.getElementById('diag-ollama-status');
    if (ollamaStatusEl) {
      ollamaStatusEl.textContent = stats.ollama_online ? 'Connected' : 'Offline';
      ollamaStatusEl.style.color = stats.ollama_online ? 'var(--color-success)' : 'var(--color-danger)';
    }

    // 2. GPU Telemetry — show dynamically detected name
    const gpuNameEl = document.getElementById('diag-gpu-name');
    if (gpuNameEl) gpuNameEl.textContent = stats.gpu_name || 'Not detected';

    const gpuVramEl = document.getElementById('diag-gpu-vram');
    if (gpuVramEl) {
      if (stats.gpu_available && stats.gpu_total_mb) {
        gpuVramEl.textContent = `${stats.gpu_used_mb || 0} MB / ${stats.gpu_total_mb} MB`;
      } else {
        gpuVramEl.textContent = 'GPU information unavailable';
      }
    }

    const gpuBarEl = document.getElementById('diag-gpu-bar');
    if (gpuBarEl && stats.gpu_total_mb) {
      const percent = Math.min(100, Math.round(((stats.gpu_used_mb || 0) / stats.gpu_total_mb) * 100));
      gpuBarEl.style.width = `${percent}%`;
    }

    // 3. RAM Telemetry
    const ramLoadEl = document.getElementById('diag-ram-load');
    if (ramLoadEl) ramLoadEl.textContent = `${stats.ram_load_percent || 0}%`;

    const ramSubEl = document.getElementById('diag-ram-sub');
    if (ramSubEl) {
      ramSubEl.textContent = `${stats.ram_avail_gb || 0} GB free of ${stats.ram_total_gb || 0} GB`;
    }

    const ramBarEl = document.getElementById('diag-ram-bar');
    if (ramBarEl) {
      ramBarEl.style.width = `${stats.ram_load_percent || 0}%`;
    }

    // 4. Model runtime
    const modelActiveEl = document.getElementById('diag-model-active');
    if (modelActiveEl) modelActiveEl.textContent = stats.active_model || appState.activeModel;

    // 5. System table
    const osEl = document.getElementById('telemetry-os');
    if (osEl) osEl.textContent = stats.platform || 'Unknown';

    const pyEl = document.getElementById('telemetry-python');
    if (pyEl) pyEl.textContent = stats.python_version || 'Unknown';

    // Update sidebar status — show connection state, not GPU name
    const hwBadge = document.getElementById('sidebar-hw-text');
    if (hwBadge) {
      if (stats.ollama_online) {
        hwBadge.textContent = 'Local runtime ready';
      } else {
        hwBadge.textContent = 'Runtime unavailable';
      }
    }

    // Update status dot
    const statusDot = document.getElementById('sidebar-status-dot');
    if (statusDot) {
      if (stats.ollama_online) {
        statusDot.classList.remove('offline');
      } else {
        statusDot.classList.add('offline');
      }
    }
  }

  async runHealthCheck() {
    showToast('Running diagnostics...', 'info');
    const start = Date.now();
    await this.refreshTelemetry();
    const duration = Date.now() - start;
    showToast(`Diagnostics complete (${duration}ms)`, 'success');
  }
}

window.diagnosticsController = new DiagnosticsController();
