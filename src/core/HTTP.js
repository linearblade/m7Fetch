/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
import FETCH_CONSTANTS from './fetch_enum.js';
export class HTTP {
    //if you want to set different defaults, just extend the class and overwrite the vals. see fetch_enums.js;
    static FETCH_DEFAULTS = {
	//"signal": false
    };
    static debugHandler = debugHandler;

    constructor(opts = {}) {
	this.opts = this.parseOpts(opts);
	this.base = this.buildBase(this.opts.url);
	this.headers = this.opts.headers || {};
    }


    parseOpts(opts) {
	const out = {};

	const location = typeof window !== 'undefined' ? window.location : {};

	// Use browser values if opts don’t provide them
	const proto = (opts.protocol || location.protocol || 'http:').replace(/:$/, '');
	out.protocol = ['http', 'https'].includes(proto) ? proto : 'http';

	out.host = opts.host || location.hostname || 'localhost';

	const port = opts.port !== undefined
	      ? parseInt(opts.port, 10)
	      : location.port
	      ? parseInt(location.port, 10)
	      : null;
	out.port = Number.isInteger(port) && port > 0 ? port : null;

	if (typeof opts.url === 'string' && opts.url.trim()) {
	    out.url = opts.url.trim().replace(/\s/g, '');
	}

	out.headers = (opts.headers && typeof opts.headers === 'object')
	    ? { ...opts.headers }
	: {};

	out.timeout = opts.timeout ?? null;
	out.json = opts.json ?? true;
	out.format = opts.format || 'body';
	out.urlencoded = opts.urlencoded || false;

	const extra = this.buildDefaultFetchOpts(opts);
	return { ...out, ...extra };
    }

    buildDefaultFetchOpts(opts = {}) {
	const cls = this.constructor;
	const out = {};

	for (const key in cls.FETCH_DEFAULTS) {
	    const allowed = FETCH_CONSTANTS[key];
	    const value = opts[key];
	    const defaultValue = cls.FETCH_DEFAULTS[key];

	    if ((value !== undefined || defaultValue !== undefined) &&
		allowed &&
		(allowed.length === 0 || allowed.includes(value))) {
		out[key] = value ?? defaultValue;
	    }
	}

	return out;
    }
    
    buildBase(url) {
	if (url) return url;

	const protocol = this.opts.protocol;
	const host = this.opts.host;
	const port = this.opts.port;
	const portPart = port ? `:${port}` : '';

	return `${protocol}://${host}${portPart}/`;
    }
    

    buildPath(path) {
	const cleanBase = this.base.endsWith('/') ? this.base : this.base + '/';
	const cleanPath = path.startsWith('/') ? path.slice(1) : path;
	return cleanBase + cleanPath;
    }

    buildGet(path, params) {
	const url = this.buildPath(path);
	const query = this.toQueryParams(params);

	if (!query) return url;

	if (url.endsWith('?')) {
	    return url + query;
	}

	if (url.includes('?')) {
	    return `${url}&${query}`;
	}

	return `${url}?${query}`;
    }



    
    /**
     * Perform an HTTP GET request with optional query parameters, timeout, and response handling.
     *
     * @param {string} path - The endpoint path to request (relative to base URL).
     * @param {Object} [opts={}] - Optional settings for the request.
     * @param {Object} [opts.params] - Flat key-value pairs to append as query string.
     * @param {Object} [opts.headers] - Additional headers to include in the request.
     * @param {boolean} [opts.json=false] - If true, parses the response as JSON. If false, returns the raw Response object.
     * @param {number} [opts.timeout] - Optional timeout in milliseconds. Aborts the request if exceeded.
     * @param {function} [opts.handler] - Optional callback function. If provided, receives the parsed response as argument.
     * @returns {Promise<*>} - Resolves to the parsed response (JSON or Response), or the return value of the handler.
     *
     * @example
     * // Simple GET
     * const data = await http.get('/api/items');
     *
     * @example
     * // With query parameters
     * await http.get('/api/search', { params: { q: 'dog', limit: 10 } });
     *
     * @example
     * // With handler
     * http.get('/api/data', { handler: (data) => console.log(data) });
     *
     * @example
     * // With timeout and custom headers
     * const result = await http.get('/api/info', {
     *   timeout: 2000,
     *   headers: { 'X-Auth': 'abc123' },
     *   json: true
     * });
     */

    async get(path, opts = {}) {
	const {
	    params,
	    headers = {},
	    ...fetchOpts
	} = opts;

	const url = this.buildGet(path, params);
	const timeoutConfig = this.withTimeout(opts);

	const start = performance.now();
	const defaultFetchOpts = this.buildDefaultFetchOpts(this.opts);
	const res = await fetch(url, {
	    method: 'GET',
	    headers: { ...this.headers, ...headers },
	    ...defaultFetchOpts,
	    ...fetchOpts,
	    ...timeoutConfig
	});
	const elapsed = performance.now() - start;
	//ignore until decided on a better way to handle this.
	//if (!res.ok)
	//throw new Error(`GET ${path} failed: ${res.status} ${res.statusText}`);

	const data = await this.parseResponse(res, opts,elapsed);
	return this.processResponse(data, opts);
    }
    

    async post(path, data, opts = {}) {
	const {
	    headers = {},
	    urlencoded = this.opts.urlencoded ?? false,
	    json = this.opts.json ?? true,
	    ...fetchOpts
	} = opts;

	const url = this.buildPath(path);
	const timeoutConfig = this.withTimeout(opts);


	let body;
	const finalHeaders = { ...this.headers, ...headers };

	// Determine body type
	const isRaw =
	      typeof data === 'string' ||
	      data instanceof Blob ||
	      data instanceof FormData ||
	      data instanceof ArrayBuffer;

	if (isRaw) {
	    body = data; // raw body
	} else if (urlencoded) {
	    body = this.toQueryParams(data);
	    finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
	} else if (json) {
	    body = JSON.stringify(data);
	    finalHeaders['Content-Type'] = 'application/json';
	} else {
	    body = data;
	}
	const defaultFetchOpts = this.buildDefaultFetchOpts(this.opts);
	const start = performance.now();
	const res = await fetch(url, {
	    method: 'POST',
	    headers: finalHeaders,
	    body,
	    ...defaultFetchOpts,
	    ...fetchOpts,
	    ...timeoutConfig
	});
	const elapsed = performance.now() - start;

	//ignore until I decide waht to do with this.
	//if (!res.ok)
	//	    throw new Error(`POST ${path} failed: ${res.status} ${res.statusText}`);

	const parsed = await this.parseResponse(res, opts, elapsed);
	return this.processResponse(parsed, opts);
    }

    withTimeout(opts = {}) {
	const timeout = opts.timeout ?? this.opts.timeout;

	if (!timeout || opts.signal === false || this.opts.signal === false) {
	    return {}; // No timeout, or explicitly disabled
	}

	const controller = new AbortController();

	setTimeout(() => controller.abort(), timeout);

	return { signal: controller.signal };
    }
    
    /*
    withTimeout(opts = {}) {
	const timeout = opts.timeout !== undefined ? opts.timeout : this.opts.timeout;
	if (!timeout) return {};

	const controller = new AbortController();
	setTimeout(() => controller.abort(), timeout);
	return { signal: controller.signal };
    }*/

    async parseResponse(res, opts = {}, elapsed = null) {
	const isJSON = opts.json ?? this.opts.json ?? true;
	const format = opts.format || this.opts.format || 'body';
	const contentType = res.headers.get('content-type') || '';
	const isContentJSON = contentType.includes('application/json');

	let body;
	if (isJSON && isContentJSON) {
	    body = await res.json();
	} else {
	    body = await res.text();
	}

	if (format === 'raw') return res;

	if (format === 'full') {
	    return {
		status: res.status,
		statusText: res.statusText,
		ok: res.ok,
		url: res.url,
		redirected: res.redirected,
		elapsedMs: elapsed,
		headers: this.headersToObject(res.headers),
		body
	    };
	}

	return body;
    }

    headersToObject(headers) {
	const out = {};
	for (const [key, value] of headers.entries()) {
	    out[key] = value;
	}
	return out;
    }

    processResponse(data, opts = {}) {
	if (typeof opts.handler === 'function') {
	    opts.handler(data);
	}
	return data;
    }

    toQueryParams(params) {
	if (!params || typeof params !== 'object') return '';
	const query = new URLSearchParams(params).toString();
	return query ?? '';
    }

    
}


function debugHandler(resp) {
  console.log('📦 HTTP Response Debug');
  console.log('Status:', resp.status);
  console.log('OK:', resp.ok);
  console.log('URL:', resp.url);
  console.log('Elapsed Time (ms):', resp.elapsedMs);
  console.log('Headers:', resp.headers);
  console.log('Body:', resp.body);
}


export default HTTP;
