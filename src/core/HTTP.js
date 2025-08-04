/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

/**
 * HTTP
 * A lightweight HTTP client wrapper for performing GET and POST requests with flexible configuration.
 * Provides automatic base URL construction, query encoding, timeout handling, request parsing, and response formatting.
 *
 * Designed for modular applications using reusable network contexts (e.g., Net, SyncLoader, BootStrap).
 *
 * Public Methods:
 * - get(path, opts = {})                → Perform a GET request with optional query, formatting, and response handler.
 * - post(path, data, opts = {})         → Perform a POST request with JSON, URL-encoded, or raw body support.
 * - put(path, data, opts = {})          → Perform a PUT request with similar body handling as POST.
 * - patch(path, data, opts = {})        → Perform a PATCH request with flexible encoding.
 * - delete(path, opts = {})             → Perform a DELETE request (no request body).
 * - head(path, opts = {})               → Perform a HEAD request to fetch headers only.
 * - options(path, opts = {})            → Perform an OPTIONS request for CORS or method introspection.
 
 
 * All other methods are internal and subject to change.
 *
 * 🔧 Features:
 * - Intelligent base path resolution (via `protocol`, `host`, `port`, `url`, etc.)
 * - Optional absolute path bypass (`opts.absolute`)
 * - Automatic parsing of request payloads:
 *     • Objects → JSON
 *     • FormData, URLSearchParams, string, Blob, ArrayBuffer supported
 * - Automatic parsing of response formats (JSON, text, blob, etc.)
 * - Flexible response formats: body only, full metadata, or raw `Response`
 * - Timeout support (via AbortController)
 * - Compatible with SyncLoader and BatchLoader pipelines
 *
 * ✅ Usage:
 *   const http = new HTTP({ host: "example.com", protocol: "https", port: 8080 });
 *   const data = await http.get("/api/config");
 *
 *   // POST JSON automatically
 *   await http.post("/save", { score: 42 });
 *
 *   // Bypass base URL
 *   await http.get("/override", { absolute: true });
 *
 * See also: `fetch_enum.js` for supported fetch-specific option sets.
 */

import FETCH_CONSTANTS from './fetch_enum.js';
export class HTTP {
    // Default fetch behavior shared across all instances (can be extended)
    // Example: override in a subclass to set global `signal`, `credentials`, etc.
    // See `fetch_enum.js` for available fetch config patterns.
    static FETCH_DEFAULTS = {
	//"signal": false
    };
    // Default debug logging handler (can be replaced or disabled)
    // Used for emitting warnings, errors, or diagnostics in wrapped requests.
    // not used by default, purely for test use during inital setups.
    static debugHandler = debugHandler;
    static get BODY_METHODS() {
	return ['POST', 'PUT', 'PATCH'];
    }
    
    static get BODYLESS_METHODS() {
	return ['HEAD', 'GET', 'OPTIONS', 'DELETE'];
    }
    /**
     * Constructs a new HTTP instance.
     *
     * @param {object} [opts={}] - Configuration options:
     *   - `url` or `host` / `protocol` / `port`: used to build base URL
     *   - `headers`: default headers (e.g., Authorization)
     *   - `absolute`: if true, disables base path resolution per request
     *   - Any additional fields are parsed by `parseOpts()`
     */
    constructor(opts = {}) {
	this.opts = this.parseOpts(opts);
	this.base = this.buildBase(this.opts.url);
	this.headers = this.opts.headers || {};
    }

    async get(path, opts = {}) {
	return this._noBodyRequest('GET', path, opts);
    }
    async delete(path, opts = {}) {
	return this._noBodyRequest('DELETE', path, opts);
    }

    async head(path, opts = {}) {
	return this._noBodyRequest('HEAD', path, opts);
    }

    async options(path, opts = {}) {
	return this._noBodyRequest('OPTIONS', path, opts);
    }
    async post(path, data, opts = {}) {
	return this._bodyRequest('POST', path, data, opts);
    }

    async put(path, data, opts = {}) {
	return this._bodyRequest('PUT', path, data, opts);
    }

    async patch(path, data, opts = {}) {
	return this._bodyRequest('PATCH', path, data, opts);
    }

    
    /**
     * Parses and normalizes HTTP configuration options.
     * This method extracts high-level flags and request behavior settings, and
     * merges in validated fetch-compatible options via `buildDefaultFetchOpts()`.
     *
     * Commonly used internally by the constructor, but may be reused to pre-validate
     * configuration for ad hoc HTTP requests.
     *
     * @param {object} opts - Raw user-supplied options.
     * @param {string} [opts.protocol] - URL scheme (`http` or `https`). Falls back to browser `window.location.protocol`.
     * @param {string} [opts.host] - Target hostname (e.g., `example.com`). Defaults to `window.location.hostname` or `'localhost'`.
     * @param {number|string} [opts.port] - Port number. Parsed as integer. Defaults to browser `window.location.port`, if available.
     * @param {string} [opts.url] - Full base URL (e.g., `"https://example.com:3000/"`). Optional override to use instead of separate `protocol`, `host`, and `port`.
     * @param {object} [opts.headers] - HTTP headers object to include with every request. Merged as-is if valid.
     *
     * @param {boolean} [opts.absolute=false] - If true, bypasses base URL when building request paths.
     * @param {number|null} [opts.timeout=null] - Optional timeout in milliseconds (if supported by fetch polyfill).
     * @param {boolean} [opts.json=true] - If true, automatically JSON-encode body for `POST`, and decode responses as JSON.
     * @param {string} [opts.format='body'] - One of: `'body'`, `'full'`, or `'raw'` — controls the shape of returned data.
     * @param {boolean} [opts.urlencoded=false] - If true, POST bodies will be sent as `application/x-www-form-urlencoded`.
     *
     * Also applies entries from `buildDefaultFetchOpts()`:
     * See `FETCH_CONSTANTS` and `FETCH_DEFAULTS` for allowed categories like:
     * - `mode`, `credentials`, `cache`, `redirect`, etc.
     *
     * @returns {object} A normalized and merged options object used internally for all HTTP requests.
     */
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
	out.absolute = opts.absolute ?? false;
	out.timeout = opts.timeout ?? null;
	out.json = opts.json ?? true;
	out.format = opts.format || 'body';
	out.urlencoded = opts.urlencoded || false;

	const extra = this.buildDefaultFetchOpts(opts);
	return { ...out, ...extra };
    }


    /**
     * Constructs a filtered and validated set of fetch options.
     * This pulls from `this.constructor.FETCH_DEFAULTS` and selectively
     * applies overrides from user-provided `opts`, while validating against
     * `FETCH_CONSTANTS`.
     *
     * {
     *   mode: 'same-origin',   // Valid override
     *   timeout: 5000,         // Not part of FETCH_CONSTANTS — will be ignored
     *   credentials: 'omit'    // Valid override
     * }
     * @param {object} opts - Raw user fetch options (e.g., `{ mode: "cors" }`)
     * @returns {object} - Validated and merged fetch options
     */
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

    /**
     * Constructs a base URL string for use in HTTP requests.
     *
     * This function builds the full base URL using either:
     * - An explicit `url` passed to the constructor or `parseOpts()`
     * - Or dynamically from `protocol`, `host`, and `port` fields
     *
     * @param {string} [url] - Optional full URL string to override derived base path.
     * @returns {string} A full base URL (e.g., `"https://example.com:3000/"`)
     *
     * Example outputs:
     *   buildBase("https://foo.com/api/") → "https://foo.com/api/"
     *   buildBase() → "http://localhost/" (with default fallback values)
     */
    
    buildBase(url) {
	if (url) return url;

	const protocol = this.opts.protocol;
	const host = this.opts.host;
	const port = this.opts.port;
	const portPart = port ? `:${port}` : '';

	return `${protocol}://${host}${portPart}/`;
    }


    /**
     * Resolves a full URL for a given request path.
     *
     * If `opts.absolute` is `true`, the input path is returned untouched,
     * allowing bypass of base URL construction. Otherwise, the path is joined
     * with the instance's configured base URL.
     *
     * @param {string} path - The request path (e.g., `/api/data` or `data.json`)
     * @param {object} [opts={}] - Optional overrides.
     * @param {boolean} [opts.absolute=false] - If true, skips base URL prefixing.
     * @returns {string} Fully qualified request URL.
     *
     * Examples:
     *   buildPath("/users")          → "http://localhost/users"
     *   buildPath("config.json")     → "http://localhost/config.json"
     *   buildPath("/external", { absolute: true }) → "/external"
     */
    buildPath(path, opts = {}) {
	const absolute = opts?.absolute ?? this.opts.absolute ?? false;
	const cleanBase = this.base.endsWith('/') ? this.base : this.base + '/';
	return absolute
            ? path // leave absolute path untouched
            : cleanBase + (path.startsWith('/') ? path.slice(1) : path);
    }


    /**
     * Constructs a full GET request URL with query parameters.
     *
     * This method joins a base URL (via `buildPath`) with serialized
     * query parameters. It handles edge cases like existing `?` or
     * trailing `?` in the path.
     *
     * @param {string} path - The request path (relative or absolute).
     * @param {object} [params={}] - Key-value object of query parameters.
     * @param {object} [opts={}] - Optional overrides (e.g., `{ absolute: true }`).
     * @returns {string} Full URL with query string.
     *
     * Examples:
     *   buildGet("/api/data", { q: "search" })
     *     → "http://localhost/api/data?q=search"
     *
     *   buildGet("config?", { debug: true }, { absolute: true })
     *     → "config?debug=true"
     */
    
    buildGet(path, params,opts={}) {
	const url = this.buildPath(path,opts);
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
     * Perform an HTTP request without a body, supporting query parameters, custom headers, timeout configuration, and response formatting.
     *
     * Supports automatic base path resolution, query string encoding, timeout handling,
     * response parsing (JSON, full metadata, or raw), and post-processing via handler.
     *
     * @param {string} path - Endpoint path to request. Can be relative or absolute depending on `opts.absolute`.
     * @param {Object} [opts={}] - Optional settings for the request.
     * @param {Object} [opts.params] - Flat key-value pairs to append as query string (e.g., { q: 'dog' } → ?q=dog).
     * @param {Object} [opts.headers] - Additional headers to include with the request.
     * @param {boolean} [opts.json=true] - If true, parses the response as JSON. If false, returns raw response or body.
     * @param {string} [opts.format='body'] - Output format: 'body' (default), 'full' (Response + metadata), or 'raw' (Response only).
     * @param {boolean} [opts.absolute=false] - If true, bypasses base URL and uses `path` exactly as given.
     * @param {number} [opts.timeout] - Optional timeout in milliseconds. Request is aborted if exceeded.
     * @param {function} [opts.handler] - Optional post-processing callback. Receives parsed response; return value becomes final result.
     *
     * @returns {Promise<*>} - Resolves to the parsed (and optionally transformed) response, based on `format`, `json`, and `handler`.
     *
     * @example
     * // Basic GET
     * const data = await http.get('/api/items');
     *
     * @example
     * // With query parameters
     * const search = await http.get('/api/search', { params: { q: 'hex', limit: 5 } });
     *
     * @example
     * // With absolute URL override
     * const config = await http.get('/config.json', { absolute: true });
     *
     * @example
     * // With post-processing handler
     * const user = await http.get('/user/profile', {
     *   handler: (data) => data.profile
     * });
     */
    async _noBodyRequest(method, path, opts = {}) {
	const {
	    params,
	    headers = {},
	    ...fetchOpts
	} = opts;
	if (!this.constructor.BODYLESS_METHODS.includes(method.toUpperCase() ) )
	    throw new Error(`Invalid HTTP method "${method}" for _noBodyRequest(). Must be one of: ${this.constructor.BODYLESS_METHODS.join(', ')}`);

	const url = this.buildGet(path, params,opts);
	const timeoutConfig = this.withTimeout(opts);

	const start = performance.now();
	const defaultFetchOpts = this.buildDefaultFetchOpts(this.opts);
	const res = await fetch(url, {
	    method: method.toUpperCase(),
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
    

    /**
     * Perform an HTTP request with a request body, supporting automatic encoding (JSON, URL-encoded, or raw), configurable timeouts, and customizable response parsing.
     *
     * Supports raw, JSON, or URL-encoded payloads. Automatically sets content-type headers when needed.
     * Can be used with absolute URLs, custom timeouts, and post-processing handlers.
     *
     * @param {string} path - Endpoint path to post to. Can be relative or absolute depending on `opts.absolute`.
     * @param {*} data - Request payload. Can be a plain object, string, Blob, FormData, or JSON-serializable value.
     * @param {Object} [opts={}] - Optional configuration for the request.
     * @param {Object} [opts.headers] - Additional headers to include.
     * @param {boolean} [opts.urlencoded=false] - If true, encodes `data` as application/x-www-form-urlencoded.
     * @param {boolean} [opts.json=true] - If true (default), encodes `data` as JSON. Ignored if `data` is raw or urlencoded.
     * @param {boolean} [opts.absolute=false] - If true, bypasses base URL and uses `path` exactly as provided.
     * @param {number} [opts.timeout] - Optional timeout in milliseconds. Aborts the request if exceeded.
     * @param {string} [opts.format='body'] - Output format: 'body' (default), 'full' (Response + metadata), or 'raw' (Response only).
     * @param {function} [opts.handler] - Optional post-processing callback. Receives parsed response; return value becomes final result.
     *
     * @returns {Promise<*>} - Resolves to parsed (and optionally transformed) response, depending on `format`, `json`, and `handler`.
     *
     * @example
     * // Simple POST with JSON body
     * await http.post('/api/save', { name: 'chess', score: 100 });
     *
     * @example
     * // URL-encoded form post
     * await http.post('/api/form', { q: 'dogs', limit: 10 }, { urlencoded: true });
     *
     * @example
     * // Raw string or file upload
     * await http.post('/upload', fileBlob);
     *
     * @example
     * // With handler and timeout
     * await http.post('/api/submit', payload, {
     *   timeout: 3000,
     *   handler: (res) => res.status === 'ok'
     * });
     */


    
    async _bodyRequest(method,path, data, opts = {}) {
	const {
	    headers = {},
	    urlencoded = this.opts.urlencoded ?? false,
	    json = this.opts.json ?? true,
	    ...fetchOpts
	} = opts;

	if (!this.constructor.BODY_METHODS.includes(method.toUpperCase() ) )
	    throw new Error(`Invalid HTTP method "${method}" for _bodyRequest(). Must be one of: ${this.constructor.BODY_METHODS.join(', ')}`);

	const url = this.buildPath(path,opts);
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
	    method: method.toUpperCase(),
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


    /**
     * Constructs a fetch-compatible timeout configuration using `AbortController`.
     *
     * If a `timeout` value is provided (in milliseconds), returns a `{ signal }` object
     * that can be passed directly to `fetch()` to enable automatic request abortion.
     * If `timeout` is missing or explicitly disabled via `opts.signal === false`, returns an empty object.
     *
     * @param {Object} [opts={}] - Request-specific overrides.
     * @param {number} [opts.timeout] - Timeout duration in milliseconds. Overrides global timeout if provided.
     * @param {boolean} [opts.signal=false] - If explicitly set to `false`, disables timeout signal creation.
     * @returns {Object} - Either `{ signal: AbortSignal }` or `{}`.
     *
     * @example
     * const timeoutConfig = http.withTimeout({ timeout: 3000 });
     * await fetch(url, { ...timeoutConfig });
     */
    
    withTimeout(opts = {}) {
	const timeout = opts.timeout ?? this.opts.timeout;

	if (!timeout || opts.signal === false || this.opts.signal === false) {
	    return {}; // No timeout, or explicitly disabled
	}

	const controller = new AbortController();

	setTimeout(() => controller.abort(), timeout);

	return { signal: controller.signal };
    }
    

    /**
     * Parses an HTTP response object based on configuration flags.
     *
     * Supports automatic JSON decoding, response body formatting, and full metadata packaging.
     *
     * @param {Response} res - The raw `fetch` response object.
     * @param {Object} [opts={}] - Optional settings that affect parsing behavior.
     * @param {boolean} [opts.json=true] - If true and response is JSON-compatible, parses the body as JSON.
     * @param {string} [opts.format="body"] - Determines the return format:
     *   - `"body"` (default): returns the parsed body (JSON or text)
     *   - `"full"`: returns an object with status, headers, body, and timing
     *   - `"raw"`: returns the original `Response` object unprocessed
     * @param {number|null} [elapsed=null] - Optional elapsed time (in ms) for diagnostics.
     * @returns {Promise<*>} - A parsed body, a full response object, or the raw Response.
     *
     * @example
     * const res = await fetch(...);
     * const data = await http.parseResponse(res, { json: true, format: "body" });
     *
     * @example
     * const full = await http.parseResponse(res, { format: "full" });
     * console.log(full.status, full.body);
     */
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


    /**
     * Converts a `Headers` object (from `fetch`) into a plain JavaScript object.
     *
     * Useful for extracting response headers in a structured format.
     *
     * @param {Headers} headers - The `Headers` instance to convert.
     * @returns {Object} A plain object with header keys and values.
     *
     * @example
     * const res = await fetch('/api');
     * const headers = http.headersToObject(res.headers);
     * console.log(headers['content-type']); // e.g., "application/json"
     */
    headersToObject(headers) {
	const out = {};
	for (const [key, value] of headers.entries()) {
	    out[key] = value;
	}
	return out;
    }

    /**
     * Optionally processes a parsed response using a user-defined handler.
     *
     * If a `handler` function is provided in `opts`, it is invoked with the response data.
     * The original data is always returned regardless of whether a handler is used.
     *
     * @param {*} data - The parsed response data to process.
     * @param {Object} [opts={}] - Optional handler configuration.
     * @param {function} [opts.handler] - A callback to execute with the response data.
     * @returns {*} The original `data`, unchanged by the handler.
     *
     * @example
     * const res = await http.get('/api/info', {
     *   handler: (data) => console.log("Received:", data)
     * });
     */
    processResponse(data, opts = {}) {
	if (typeof opts.handler === 'function') {
	    opts.handler(data);
	}
	return data;
    }

    /**
     * Converts a flat object of key-value pairs into a URL-encoded query string.
     *
     * Useful for appending query parameters to GET request URLs or form submissions.
     *
     * @param {Object} params - An object containing key-value pairs to encode.
     * @returns {string} A URL-encoded query string (e.g., "a=1&b=2"), or an empty string if invalid input.
     *
     * @example
     * http.toQueryParams({ foo: "bar", count: 5 });
     * // → "foo=bar&count=5"
     */
    toQueryParams(params) {
	if (!params || typeof params !== 'object') return '';
	const query = new URLSearchParams(params).toString();
	return query ?? '';
    }

    
}


/**
 * debugHandler
 * A simple debugging utility to log HTTP response metadata to the console.
 *
 * Intended for use with the `handler` option in HTTP requests to inspect
 * full response details, including status, headers, and body.
 *
 * @param {Object} resp - The full response object returned by `parseResponse` with `format: "full"`.
 *
 * Example Output:
 * 📦 HTTP Response Debug
 * Status: 200
 * OK: true
 * URL: http://example.com/data
 * Elapsed Time (ms): 123.45
 * Headers: { "content-type": "application/json", ... }
 * Body: { ... }
 *
 * @example
 * const http = new HTTP({ handler: debugHandler });
 * await http.get("/api/data", { format: "full" });
 */

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
