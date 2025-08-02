/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
/**
 * AbstractSpec
 *
 * Base class for all API specification formats (e.g., OpenAPI, custom, or minimal specs).
 * Defines a common metadata interface (`id`, `source`) and a set of abstract methods
 * that must be implemented by concrete subclasses.
 *
 * This class enables plug-and-play interoperability with tools like `SpecManager`
 * and generic network loaders by enforcing a consistent contract.
 *
 * Subclasses must implement the following methods:
 * - getBaseUrl()
 * - getOperation(id, opts)
 * - getMethod(opOrId, opts)
 * - resolveUrl(opOrId, opts)
 * - getRequestOptions(opOrId, opts)
 * - export()
 *
 * Optional properties like `_id` and `_source` provide metadata context for
 * debugging, manifest management, or network tracing.
 *
 * Typical subclass:
 * ```js
 * class OpenAPISpec extends AbstractSpec {
 *   constructor(spec, source) {
 *     super(spec, source);
 *     this._id = spec['x-id'] || null;
 *     // ...
 *   }
 * }
 * ```
 *
 * This class should never be instantiated directly.
 */

class AbstractSpec {
    constructor(spec,source=null){
	this._source = source ?? null;
	this._id = null; //filled out by descendent
    }
    /**
     * @returns {string|null} Unique spec ID, or null if unspecified
     */
    get id() {
	return this._id;
    }

    /**
     * @param {string} opId
     * @returns {object|null} Operation definition, or null if not found
     */
    getOperation(opId) {
	throw new Error('AbstractSpec: getOperation(opId) must be implemented');
    }

    /**
     * @param {object} op - The operation object returned from getOperation()
     * @returns {string} HTTP method: 'get', 'post', etc
     */
    getMethod(op) {
	throw new Error('AbstractSpec: getMethod(op) must be implemented');
    }

    /**
     * @param {object} op - The operation object
     * @returns {string} Fully resolved absolute URL
     */
    resolveUrl(op) {
	throw new Error('AbstractSpec: resolveUrl(op) must be implemented');
    }

    /**
     * @param {object} op - The operation object
     * @returns {object} Default request options (e.g., headers, json=true)
     */
    getRequestOptions(op) {
	return {}; // optional override
    }

    /**
     * Optional: file or origin path for debugging/error tracking
     */

    get source() {
	return this._source ?? null;
    }
    export() {
	throw new Error(`${this.constructor.name}: export() must be implemented`);
    }
}

export default AbstractSpec;
