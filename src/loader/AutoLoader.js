/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
import HTTP from '../core/HTTP.js';
import loaders from './index.js';

/**
 * AutoLoader
 * ----------
 * Automatically loads and delegates parsing of a specification document (e.g., OpenAPI, custom formats).
 *
 * It determines the appropriate spec loader based on an `x-type` field:
 * - If given a plain object with an `x-type`, it dispatches directly to the matching loader.
 * - If given a URL (string), it fetches the data (via GET or POST), extracts `x-type`, and then delegates.
 *
 * Each type must correspond to a registered loader in `loaders/`, such as `openapi`, `simple`, etc.
 * This allows dynamic support for different API or data specifications in a plug-and-play architecture.
 *
 * ⚠ Request behavior (GET/POST, headers, timeouts, etc.) is controlled via options compatible with `HTTP.js`.
 * See `HTTP.js` for supported request options like:
 * - `headers`, `timeout`, `json`, `format`, `credentials`, etc.
 *
 * Request options:
 * - `method`: `'get'` or `'post'` (default: `'get'`)
 * - `data`: POST body payload if using `method: 'post'`
 * - all remaining options are forwarded to the HTTP fetcher
 *
 * Example:
 * ```js
 * const loader = new AutoLoader();
 *
 * // Load from a URL using GET
 * const spec = await loader.load('/api/openapi.json');
 *
 * // Load from a URL using POST
 * const spec = await loader.load('/specs/load.php', {
 *   method: 'post',
 *   data: { project: 'alpha' },
 *   timeout: 3000
 * });
 *
 * // Load from an inlined object
 * const spec = await loader.load({
 *   'x-type': 'openapi',
 *   openapi: '3.0.3',
 *   paths: { ... }
 * });
 * ```
 *
 * @class AutoLoader
 */

export default class AutoLoader {
    constructor(net = null) {
	this.net = net ?? new HTTP();
    }

    async load(input,opts= {}) {
	let specData = null;
	let type = null;

	const { method=null, data:postData=null, ...submitOpts } = opts;
	const requestMethod = this._getRequestMethod(method);
	
	if (typeof input === 'object' && input !== null) {
	    specData = input;
	    type = input['x-type'];
	} else if (typeof input === 'string') {
	    const fetchOpts = { json: true, ...submitOpts };
	    if (requestMethod == 'post'){
		specData = await this.net.post(input, postData, fetchOpts);
		
	    }else {
		specData = await this.net.get(input, fetchOpts);
	    }
	    if (typeof specData !== 'object' || specData === null)
		throw new Error("AutoLoader: fetched data is not a valid object");
	    
	    type = specData['x-type'];
	}
	
	
	if (!type || !loaders[type]) {
	    throw new Error(`AutoLoader: unsupported or missing x-type: ${type}`);
	}

	const LoaderClass = loaders[type];
	const loader = new LoaderClass(this.net);
	return await loader.load(specData);
    }
    
    _getRequestMethod(method) {
        const defaultMethod = 'get';
        if (!method) return defaultMethod;
        const normalized = String(method).toLowerCase();

        if (normalized === "get" || normalized === "post") {
            return normalized;
        }

        return null;
    }
}
