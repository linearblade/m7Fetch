/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
import HTTP       from '../core/HTTP.js';
import AutoLoader from '../loader/AutoLoader.js';

/**
 * SpecManager
 * -----------
 * Manages and dispatches API specification documents (e.g. OpenAPI).
 * 
 * This class acts as a multiplexer for multiple spec definitions,
 * enabling unified access to API operations via an ID-based registry.
 * 
 * It supports loading specs from:
 * - direct instances (e.g. `new OpenAPISpec(...)`)
 * - structured spec objects (with `"x-type"` field)
 * - remote URLs (JSON or text), via AutoLoader
 * 
 * Primary use case:
 * Centralized coordination of dynamic, declarative APIs, especially those
 * defined using OpenAPI or custom schema formats. Used with NetCore or HTTP clients.
 * 
 * Usage:
 * ```js
 * const manager = new SpecManager({ http, loader });
 * await manager.load('/api/openapi.json'); // via autoloader
 * const result = await manager.call('example-api', 'getDog', { params: { id: 123 } });
 * ```
 * 
 * Registered specs must expose a common interface, including at minimum:
 * - `id`           → unique string identifier
 * - `getOperation(id)`
 * - `getMethod(op)` → returns 'get' or 'post'
 * - `resolveUrl(op)`
 * - `getRequestOptions(op)`
 * 
 * Dependencies:
 * - `HTTP.js`      → for actual network requests
 * - `AutoLoader.js` → resolves and instantiates typed spec objects
 * 
 * @class SpecManager
 */

class SpecManager {
    /**
     * @param {object} deps
     * @param {HTTP} [deps.http] - The HTTP client to use for requests
     * @param {AutoLoader} [deps.loader] - Loader for URL or object-based specs
     */
    constructor({ http: net = null, loader = null } = {}) {
	this.net = net ?? new HTTP();
	this.loader = loader ?? new AutoLoader(this.net);
	this.specs = new Map();
    }

    /**
     * Registers or loads a spec.
     * Accepts:
     * - A spec instance with `.id`
     * - A plain spec object with `x-type`
     * - A URL string to fetch
     *
     * @param {object|string} input - The spec or source
     * @param {string|null} name - Optional override ID
     * @param {object} [opts] - Passed to loader (if used)
     * @returns {Promise<string>} The registered ID
     */
    async load(input, name = null,opts ={}) {
	let spec = input;

	// Use loader if not a spec instance (duck-type via id getter)
	const isInstance =
	      typeof spec === 'object' &&
	      spec !== null &&
	      typeof spec.id !== 'undefined';

	if (!isInstance) {
	    if (!this.loader) throw new Error('SpecManager: No loader available for structured input');
	    spec = await this.loader.load(input,opts); // supports URL or object
	}

	const id = name ?? spec.id;
	if (!id) {
	    throw new Error(`SpecManager: Spec must have a name or spec.id. source: ${spec.source ?? 'unknown'}`);
	}

	this.specs.set(id, spec);
	return id;
    }

    /**
     * Retrieve a registered spec by ID
     * @param {string} id
     * @returns {object|null} Spec instance or null if not found
     */
    get(id) {
	return this.specs.get(id) ?? null;
    }

    /**
     * List all registered spec IDs
     * @returns {string[]} Array of registered spec IDs
     */
    list() {
	return Array.from(this.specs.keys());
    }


    /**
     * Look up an operation from a registered spec
     *
     * @param {string} opId - The operationId defined in the spec
     * @param {string} specId - The ID of the registered spec to search
     * @returns {object|null} The operation object or null if not found
     * @throws {Error} If the spec ID is not registered
     */
    getOperation(opId, specId) {
	const spec = this.get(specId);
	if (!spec) {
	    throw new Error(`SpecManager: Spec '${specId}' not found`);
	}
	return spec.getOperation(opId);
    }

  /**
   * Executes a registered operation using HTTP
   * @param {string} specId
   * @param {string} opId
   * @param {object} [params={}] - Options merged with spec defaults
   * @returns {Promise<any>}
   */
    
    async call(specId,opId,  params = {}) {
	const spec = this.get(specId);
	if (!spec)
	    throw new Error(`SpecManager: Spec '${specId}' not loaded`);

	const op = spec.getOperation(opId);
	if (!op)
	    throw new Error(`SpecManager: Operation '${opId}' not found in '${specId}'`);

	const method = spec.getMethod(op);
	if (!['get', 'post'].includes(method))
	    throw new Error(`SpecManager: Unsupported method '${method}' for '${opId}'`);

	const url = spec.resolveUrl(op); // should come before the fetch
	const specOpts = spec.getRequestOptions(op);
	const mergedOpts = { ...specOpts, ...params };

	return await this.net[method](url, mergedOpts);
    }

    
 }

export default SpecManager;
