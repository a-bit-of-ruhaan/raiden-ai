/**
 * RAIDEN COMPANION SYSTEM — COMPANION REGISTRY
 * Discovers packs, validates manifests, loads dialogue files, and manages the active companion pack.
 * 
 * Non-Negotiable Rule 3:
 * A companion is a self-contained pack folder. Adding one requires zero core code changes.
 * Broken manifests are skipped with a warning without breaking the app.
 */

function tryRequirePacks() {
  try {
    return require('./CompanionPacksData.js');
  } catch (e) {
    return null;
  }
}

class CompanionRegistry {
  constructor(options = {}) {
    this.packs = new Map();
    this.activePack = null;
    this.activeCompanionId = null;
    this.basePath = options.basePath || 'companions';

    // Auto-load built-in packs if available
    const builtinPacks = (typeof COMPANION_BUILTIN_PACKS !== 'undefined')
      ? COMPANION_BUILTIN_PACKS
      : ((typeof require !== 'undefined') ? (tryRequirePacks()) : null);

    if (builtinPacks) {
      for (const [id, data] of Object.entries(builtinPacks)) {
        this.register(data);
      }
    }
  }

  /**
   * Validate a companion manifest against the required schema.
   * @param {Object} manifest 
   * @returns {boolean} True if valid
   */
  validateManifest(manifest) {
    if (!manifest || typeof manifest !== 'object') return false;
    if (!manifest.id || typeof manifest.id !== 'string') return false;
    if (!manifest.name || typeof manifest.name !== 'string') return false;
    if (!manifest.palette || typeof manifest.palette !== 'object') return false;
    return true;
  }

  /**
   * Register a companion pack object.
   * @param {Object} pack Contains { manifest, dialogue, sprites }
   */
  register(pack) {
    if (!pack || !pack.manifest) {
      console.warn('[CompanionRegistry] Skipping invalid pack: missing manifest.');
      return false;
    }

    if (!this.validateManifest(pack.manifest)) {
      console.warn(`[CompanionRegistry] Skipping pack '${pack.manifest.id}': failed schema validation.`);
      return false;
    }

    const id = pack.manifest.id.toLowerCase();
    this.packs.set(id, {
      id,
      manifest: pack.manifest,
      dialogue: pack.dialogue || {},
      sprites: pack.sprites || null
    });

    return true;
  }

  /**
   * Fetch and register a pack from the filesystem or server.
   * @param {string} companionId 
   */
  async loadPack(companionId) {
    const id = companionId.toLowerCase();
    try {
      const manifestUrl = `${this.basePath}/${id}/manifest.json`;
      const dialogueUrl = `${this.basePath}/${id}/dialogue.json`;

      const [manifestRes, dialogueRes] = await Promise.all([
        fetch(manifestUrl),
        fetch(dialogueUrl)
      ]);

      if (!manifestRes.ok) {
        throw new Error(`Failed to fetch manifest from ${manifestUrl} (${manifestRes.status})`);
      }

      const manifest = await manifestRes.json();
      const dialogue = dialogueRes.ok ? await dialogueRes.json() : {};

      return this.register({ manifest, dialogue });
    } catch (e) {
      console.warn(`[CompanionRegistry] Could not asynchronously load pack '${companionId}':`, e.message);
      return false;
    }
  }

  /**
   * Select the active companion.
   * @param {string} companionId 
   */
  setActive(companionId) {
    const id = (companionId || '').toLowerCase();
    if (this.packs.has(id)) {
      this.activePack = this.packs.get(id);
      this.activeCompanionId = id;
      return this.activePack;
    }
    // Fallback to void or first available
    const fallbackId = this.packs.has('void') ? 'void' : this.packs.keys().next().value;
    if (fallbackId && this.packs.has(fallbackId)) {
      this.activePack = this.packs.get(fallbackId);
      this.activeCompanionId = fallbackId;
      return this.activePack;
    }
    return null;
  }

  getActive() {
    return this.activePack;
  }

  getAll() {
    return Array.from(this.packs.values());
  }

  getPack(companionId) {
    return this.packs.get((companionId || '').toLowerCase()) || null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompanionRegistry;
}
if (typeof window !== 'undefined') {
  window.CompanionRegistry = CompanionRegistry;
}
