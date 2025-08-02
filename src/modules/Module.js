/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
class Module {
    constructor({ id, url, version = null, meta = {}, exports: exportKeys = null }) {
	if (!id || !url) throw new Error('Module requires both id and url');

	this.id = id;
	this.url = url;
	this.version = version;
	this.meta = meta;
	this.exportKeys = exportKeys;

	this.loaded = false;
	this.namespace = null;
	this.exports = null;
	this.main = null;
    }

    async load() {
	if (this.loaded) return this.namespace;

	try {
	    const mod = await import(this.url);
	    this.namespace = mod;
	    this.loaded = true;
	    return this.namespace;

	} catch (err) {
	    console.error(`[Module:${this.id}] Failed to load from ${this.url}`, err);
	    throw err;
	}
    }
}

export default Module;
