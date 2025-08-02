/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
import Module from './Module.js';

class ModuleManager {
    constructor(net) {
	this.net = net;
	this.modules = new Map(); // id → Module instance
    }

    /**
     * Register or load a module.
     *
     * - If `id` is already registered and `opts.reload` is false, returns the result of `.get(id)` (respects unpacking logic).
     * - If `opts.reload` is true, reinitializes and reloads the module.
     * - If `opts.unpack` is true (default), `.get()` will return the exports. If false, returns full Module instance.
     *
     * @param {string} id - Unique module name
     * @param {string|object} input - URL string or full config object
     * @param {object} [opts] - Options (e.g., { reload: true, unpack: false })
     * @returns {Promise<any>} exports or Module instance depending on `unpack`
     */
    async load(id, input, opts = {}) {
	const reload = opts.reload === true;

	if (this.modules.has(id) && !reload) {
	    console.warn(`[ModuleManager] Module '${id}' already loaded — skipping (use { reload: true } to force)`);
	    return this.get(id, opts);
	}

	let module;
	if (typeof input === 'object') {
	    module = new Module({ id, ...input });
	} else if (typeof input === 'string') {
	    module = new Module({ id, url: input, ...opts });
	} else {
	    throw new Error(`ModuleManager.load: invalid input for '${id}'`);
	}

	this.modules.set(id, module);
	await module.load();
	return this.get(id, opts); // unified output
    }

    get(id, opts = {}) {
	const module = this.modules.get(id);
	if (!module || !module.loaded) return null;

	const unpack = opts.unpack ?? 'exports';

	switch (unpack) {
	case 'namespace': return module.namespace;
	case 'module': return module;
	case 'exports': {
	    const mod = module.namespace;
	    if (typeof mod?.default === 'function') return mod;
	    if (typeof mod?.default === 'object') return mod.default;
	    return mod;
	}
	default: return module.namespace;
	}
    }    
    /**
     * @returns {string[]} list of loaded module IDs
     */
    list() {
	return [...this.modules.keys()];
    }
}

export default ModuleManager;
