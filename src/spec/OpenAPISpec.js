/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
import AbstractSpec from './AbstractSpec.js';

/**
 * OpenAPISpec
 * 
 * Represents a parsed OpenAPI 3.x specification in normalized form.
 * This class provides introspection and request scaffolding utilities
 * compatible with a general-purpose HTTP layer (e.g. `HTTP.js`).
 * 
 * Subclasses `AbstractSpec`, exposing a consistent interface for operation lookup,
 * request option derivation, and URL resolution.
 * 
 * @see https://spec.openapis.org/oas/v3.1.0
 * @see AbstractSpec (base class)
 * 
 * Key Responsibilities:
 * - Parse and normalize OpenAPI `paths`, `servers`, and `info`
 * - Support `operationId` lookup via `getOperation()`
 * - Derive HTTP request options based on request/response content types
 * - Expose consistent `id` and `source` metadata for spec management
 *
 * Limitations:
 * - Does not resolve `$ref` pointers or variable substitution in URLs
 * - Only supports basic HTTP method/format deduction (get/post, json/html)
 *
 * Typical Usage:
 * ```js
 * const spec = new OpenAPISpec(mySpecJson, 'https://api.example.com/spec.json');
 * const op = spec.getOperation('listDogs');
 * const opts = spec.getRequestOptions(op);
 * const url = spec.resolveUrl(op);
 * ```
 */

class OpenAPISpec extends AbstractSpec {
    constructor(spec, source = null) {
	super(spec,source);

	this.raw = spec;


	this.paths = spec.paths || {};
	this.servers = spec.servers || [];
	this.info = spec.info || {};
	this._id = spec['x-id'] ?? null;
    }


    /**
     * Resolves a base URL from the OpenAPI `servers` list.
     *
     * @param {object} options
     * @param {number} [options.index=0] - Index of the server entry to use (fallback if no `id`)
     * @param {string|null} [options.id=null] - Optional ID to match against `description` or `x-id`
     * @param {boolean} [options.object=false] - If true, return the full server object instead of just the URL
     * @returns {string|object|null} The resolved base URL (string) or the full server object, or null if not found
     *
     * @example
     * spec.getBaseUrl();                            // → "https://api.example.com"
     * spec.getBaseUrl({ index: 1 });                // → "https://staging.example.com"
     * spec.getBaseUrl({ id: 'staging' });           // → "https://staging.example.com"
     * spec.getBaseUrl({ object: true });            // → { url, description, variables? }
     * spec.getBaseUrl({ id: 'dev', object: true }); // → { url, description, ... } or null
     *
     * @see https://spec.openapis.org/oas/v3.1.0#server-object

     // Example server entry:
     * {
     *   url: string,                  // Required: Base URL (may include variables like {region})
     *   description?: string,         // Optional: Human-readable label (e.g., "Production")
     *   variables?: {                 // Optional: URL variable resolution (if using templates)
     *      [name: string]: {
     *         default: string,          // Required default value
     *         enum?: string[],          // Optional allowed values
     *         description?: string      // Optional explanation
     *      }
     *   },
     *   "x-id"?: string               // Optional custom identifier (OpenAPI extension)
     * }
     */

    
    getBaseUrl({ index = 0, id = null, object = false } = {}) {
	if (!Array.isArray(this.servers) || this.servers.length === 0)
	    return object ? null : '';

	// Try to match by `description` or `x-id`
	if (id) {
	    const match = this.servers.find(s => s.description === id || s['x-id'] === id);
	    return object ? match ?? null : match?.url ?? '';
	}

	// or lookup by index
	const entry = this.servers[index];
	return object ? entry ?? null : entry?.url ?? '';
    }


    /**
     * Retrieves an operation by its `operationId` from the OpenAPI `paths` object.
     * This allows calling or inspecting specific endpoint definitions by name.
     *
     * If `opts.object` is true, only the raw OpenAPI operation object is returned.
     * Otherwise, the returned object includes the `path` and `method` alongside
     * the operation's fields.
     *
     * @see https://spec.openapis.org/oas/v3.1.0#operation-object
     *
     * @param {string} id - The `operationId` to locate (must be unique across all methods)
     * @param {object} [opts]
     * @param {boolean} [opts.object=false] - If true, return only the raw OpenAPI operation object
     * @returns {object|null} Either the raw `op` or enriched `{ path, method, ...op }`, or null if not found
     *
     * @example
     * // With opts.object = false (default):
     * {
     *   path: "/dogs/{id}",
     *   method: "get",
     *   operationId: "getDog",
     *   summary: "Get a specific dog by ID",
     *   responses: {
     *     "200": {
     *       description: "Success",
     *       content: {
     *         "application/json": { schema: { ... } }
     *       }
     *     }
     *   }
     * }
     */
    getOperation(id, opts = {}) {
	for (const [path, methods] of Object.entries(this.paths)) {
	    for (const [method, op] of Object.entries(methods)) {
		if (op && typeof op === 'object' && op.operationId === id) {
		    return opts.object
			? op
			: { path, method: method.toLowerCase(), ...op };
		}
	    }
	}
	return null;
    }


    /**
     * Returns the HTTP method (e.g., 'get', 'post') associated with an operation.
     *
     * @param {object|string} opOrId - Either the operation object or an `operationId` string
     * @param {object} [opts]
     * @param {boolean} [opts.object=false] - Forwarded to getOperation if `opOrId` is an ID
     * @returns {string} Lowercase HTTP method name, or 'get' as default fallback
     */
    getMethod(opOrId, opts = {}) {
	let op = opOrId;

	if (typeof opOrId === 'string') {
	    op = this.getOperation(opOrId, opts);
	    if (!op) return 'get'; // fallback or throw if desired
	}

	return op.method?.toLowerCase?.() || 'get';
    }

    /**
     * Constructs the full URL for an operation by combining the base URL and path.
     *
     * @param {object|string} opOrId - The operation object or an `operationId` string
     * @param {object} [opts]
     * @param {boolean} [opts.object=false] - Passed to `getOperation()` if `opOrId` is an ID
     * @param {object} [opts.base] - Optional override for getBaseUrl() parameters (e.g., { id: 'staging' })
     * @returns {string} Fully resolved URL (e.g., "https://api.example.com/dogs")
     */
    resolveUrl(opOrId, opts = {}) {
	let op = opOrId;

	if (typeof opOrId === 'string') {
	    op = this.getOperation(opOrId, opts);
	    if (!op) return '';
	}

	const baseUrl = this.getBaseUrl(opts.base || {});
	return baseUrl + op.path;
    }



    /**
     * Derives sensible default request options for a given OpenAPI operation.
     *
     * This method is primarily intended for use with the internal `HTTP` class
     * to infer default behaviors like `json: true`, `urlencoded: true`, or `format: 'raw'`
     * based on the declared request body and response types in the OpenAPI spec.
     *
     * It is especially useful for auto-setting headers and encoding options
     * without requiring manual user input.
     *
     * @param {object|string} opOrId - An operation object or `operationId` string
     * @param {object} [opts]
     * @param {boolean} [opts.object=false] - If true, passes { object: true } to `getOperation()`
     * @returns {object} Options hash compatible with `HTTP.get()` / `HTTP.post()`
     *
     * @example
     * spec.getRequestOptions('getDog');
     * // → { json: true }
     *
     * spec.getRequestOptions(op);
     * // → { urlencoded: true, format: 'body' }
     */
    getRequestOptions(opOrId, opts = {}) {
	let op = opOrId;

	if (typeof opOrId === 'string') {
	    op = this.getOperation(opOrId, opts);
	    if (!op) return {};
	}

	const out = {};

	// Body format hints
	const content = op.requestBody?.content ?? {};
	if (content['application/x-www-form-urlencoded']) {
	    out.urlencoded = true;
	} else if (content['application/json']) {
	    out.json = true;
	}

	// Response content type hints
	const responseTypes = Object.values(op.responses || {}).flatMap(r =>
	    Object.keys(r.content || {})
	);

	if (responseTypes.includes('text/html')) {
	    out.format = 'raw';
	    out.json = false;
	} else if (responseTypes.includes('application/json')) {
	    out.json ??= true;
	}

	return out;
    }

    export() {
	return JSON.parse(JSON.stringify(this.raw)); 
    }
}

export default OpenAPISpec;
