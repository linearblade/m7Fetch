

# --- begin: src/batch/BatchLoader.js ---

/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
// vendor/network/BatchLoader.js

import SyncLoader from './SyncLoader.js';
import concurrencyLimiter from '../utils/concurrencyLimiter.js';

/**
 * BatchLoader
 *
 * A flexible tool for coordinating multiple HTTP requests via `net.http.get()`,
 * tracked by a unique ID and resolved through an internal SyncLoader.
 *
 * `net` is passed from the main Net object and used to perform requests.
 * `context` stores the result of each fetch, keyed by its `id`.
 *
 * Each entry in the input array should follow this structure:
 *
 *   {
 *     id: "config",             // Required: unique identifier for the request
 *     method: "get" | "post",   // Optional: HTTP method (defaults to "get"); invalid values fallback to "get"
 *     url: "/config.json",      // Required: URL of the resource to fetch
 *     handler: (res) => {},     // Optional: function to transform or validate the response
 *     opts: { ... }             // Optional: per-request fetch options (merged with global defaults)
 *   }
 *
 * Constructor options:
 *
 *   {
 *     batch: function          // Optional: custom batch handler.
 *                              // If omitted, defaults to this.batchStatus.
 *     fetch: { ... }           // Optional: default fetch options applied to all requests.
 *   }
 *
 * Handler behavior:
 * - If a handler is provided and it returns `false`, the request is marked as failed in SyncLoader.
 * - If no handler is provided, the raw response is stored in `.context[id]`.
 * - All results are stored in `.context`, unless the batch handler overrides it.
 *
  * Batch handler modes:
 * - `batchStatus` (default): stores the result and marks failure if `!res.ok`.
 * - `batchStore`: stores the result unconditionally, regardless of response status.
 * - `batchNone`: skips all automatic storage and failure handling — the user is fully responsible
 *   for deciding what to do with the response. To trigger failure handling via SyncLoader,
 *   simply return `false` from the handler. You do not need to call `sync.set()` or `sync.fail()` manually.
 * - to construct a custom batch handler, read customBatchHandlers.md
 *
 * To retrieve a stored result:
 *   batch.get("config") → the resolved response or transformed value.
 *
 * @class
 */

export class BatchLoader {
    constructor(net,{fetch={}, batch=null} ={}) {
	this.net = net;
	this.context = {};  // Store results for later access
	this.fetchOpts = fetch;
	this.batchHandler = batch;
    }

    setFetchOpts(opts={}){	this.fetchOpts = opts;    }
    setBatchHandler(handler){	this.batchHandler = handler;    }
    //these arent really class members, but save typing this.constructor.fn ...
    //begin fake statics
    //will store your results.
    batchStore(obj,id,handler){
	return (res) => {
	    obj.context[id] = res;
	    return handler?handler(res):res;
	}
    }
    //requires format:full (default) to be set, discard 400 errors, read Net.HTTP for details.
    //if you want more granular pre response handling, use a custom handler
    batchStatus(obj,id,handler)  {
	return (res) => {
	    obj.context[id] = res;
	    if (!res.ok) {
		return false;
	    }
	    if(handler)
		return handler(res);
	    return res;
	}
    }
    //does nothing with your results. up to you.
    batchNone(obj,id,handler){
	return handler?handler(res):res;;
    }
    //end fake statics

    /**
     * Run a list of HTTP requests and coordinate their completion using SyncLoader.
     * Triggers a callback (`load`) when all have completed, or (`fail`) if any fail.
     *
     * @param {Array<Object>} loadList - A list of request definitions:
     *   [
     *     {
     *       id: "config",                 // Required: unique string identifier for the request
     *       method: "get" | "post",       // Optional: HTTP method (defaults to "get"); invalid values fallback to "get"
     *       url: "/config.json",          // Required: resource URL to fetch
     *       handler: (res) => {},         // Optional: function to process or validate the result
     *       opts: { format: "full" }      // Optional: additional fetch options passed to net.http
     *     },
     *     ...
     *   ]
     *
     * @param {Function|null} load - Callback fired when all items have successfully loaded.
     * @param {Function|null} fail - Callback fired if any item fails.
     * @param {Object} [options={}] - Optional control flags.
     * @param {boolean} [options.awaitAll=true] - If true, waits for all responses to complete before returning.
     *                                            If false, returns immediately with unresolved promises.
     * @param {boolean} [options.limit=8] - sets the concurrency limit for fetch requests.
     *                                      If you wish to disable it (and you probably dont), just set it very high.
     *
     * @returns {Promise<{sync: SyncLoader, results: Object<string, any>|Promise<any>[]}>>}
     * Resolves to an object containing:
     * - `sync`: The SyncLoader controller tracking completion and failure states.
     * - `results`: 
     *     - If `awaitAll` is `true`: a map of `{ id → handler result }` after all requests resolve.
     *     - If `awaitAll` is `false`: an array of unresolved Promises in submission order.
     *
     * The load/fail callbacks are invoked as:
     *   (prepend, data)
     *
     * Where:
     *   prepend = {
     *     context: this.context,      // all collected responses (from handler or raw)
     *     trigger: id,                // ID of the last-loaded item that triggered resolution
     *     controller: SyncLoader.controller  // Sync state, including check/run/fail
     *   }
     *
     *   data = result of the last-triggering handler (optional)
     *
     * Note:
     * - If using a batch handler like `batchNone`, the user must return `false` from their handler
     *   to trigger the fail path — manual `sync.set()` or `sync.fail()` is not required.
     * - All successful responses or transformed values are stored in `.context` by default
     *   unless suppressed by the batch handler.
     * - If using awaitAll = false, handlers will fire as they receive data. afterwards, the user can poll
     *   the SyncLoader object. sync.loaded() == if finished, sync.failed() == failed. sync.success() == convenience function (!sync.failed())
     *   failed will only function if returning false (included with built in functions, required if using a custom batch handler)
     *   Requires external tooling (ie, perhaps an interval handler) to poll sync object for completion
     
     */

    async run(loadList = [], load = null, fail = null,{ awaitAll = true,limit = 8 } = {}) {
	// Track required IDs from load list
	let required = loadList.map(({ id }) => id);
	const batchWrapper = this.batchHandler === false
	      ? this.batchNone
	      : this.batchHandler?? this.batchStatus;


	const sync = new SyncLoader({
	    require: required,
	    load: load,
	    fail: fail,
	    prepend : this.context
	});
	const limiter = concurrencyLimiter(limit);
	const validatedList = this._preflightCheck(loadList);
	const all = [];
	for (const item of validatedList) {
	    const { method = 'get', id, url, handler, opts = {}, data: postData = null } = item;
	    const mOpts = { ...{ format: 'full' }, ...this.fetchOpts, ...opts };

	    /*const request = method === 'post'
		  ? this.net.http.post(url, postData, mOpts)
		  : this.net.http.get(url, mOpts);
	    */
	    const run = () => (
		(method === 'post'
		 ? this.net.http.post(url, postData, mOpts)
		 : this.net.http.get(url, mOpts)
		)
		    .then(sync.wrapper(id, batchWrapper(this, id, handler, item, mOpts)))
		    .then(result => ({ id, result }))
	    );
	    all.push(limiter(run));
	    /*
	    all.push(
		request.then(sync.wrapper(id, batchWrapper(this, id, handler, item, mOpts)))
		.then(result => ({ id, result }))
	    );*/
	}


	let results = {};
	if (awaitAll) {
            const flatResults = await Promise.all(all);
            for (const { id, result } of flatResults) results[id] = result;
	}

	return { sync, results };
	
	
    }

    /**
     * Retrieve the stored result for a given ID from the batch context.
     *
     * @param {string} name - The ID of the resource to retrieve.
     * @returns {*} The stored result, or undefined if not present.
     *
     * Note:
     * - This only returns data that was explicitly stored by the batch handler.
     * - If using `batchNone`, this context may be empty unless your handler stores
     *   results manually (e.g., by writing to `obj.context` inside the handler).
     */
    get(name) {
	return this.context[name];
    }

    //helper function b/c get /post have differing parameters
    _getRequestMethod(method) {
	const defaultMethod = 'get';
	if (!method) return defaultMethod;
	const normalized = String(method).toLowerCase();
	
	if (normalized === "get" || normalized === "post") {
            return normalized;
	}

	return null;
    }

    _preflightCheck(loadList = []) {
	const seen = new Set();
	const valid = [];

	for (const item of loadList) {
	    const { id, url, method = 'get' } = item;

	    if (!id || !url) {
		throw new Error(`❌ Batch item missing required 'id' or 'url': ${JSON.stringify(item)}`);
	    }

	    if (seen.has(id)) {
		throw new Error(`❌ Duplicate batch ID detected: "${id}"`);
	    }
	    seen.add(id);

	    const requestMethod = this._getRequestMethod(method);
	    if (!requestMethod) {
		throw new Error(`❌ Unsupported HTTP method "${method}" for batch item "${id}"`);
	    }

	    valid.push({ ...item, method: requestMethod });
	}

	return valid;
    }
    
}

export default BatchLoader;


# --- end: src/batch/BatchLoader.js ---



# --- begin: src/batch/SyncLoader.js ---

/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
/**
 * SyncLoader
 *
 * A minimal dependency coordination system for tracking completion of named async tasks.
 * Designed to ensure a set of tasks (`require(id)`) are all resolved before executing a final callback.
 *
 * Tasks are tracked via unique string IDs. Each task can be marked as:
 * - `set(id)`: Successfully completed
 * - `fail(id)`: Completed but failed (non-blocking)
 *
 * Once all required IDs are marked (either via `set()` or `fail()`), the `load` or `fail` callback is invoked.
 * If no `fail` handler is provided, the `load` callback is triggered in either case.
 *
 * Common use cases:
 * - Coordinating DOM ready, config loading, and asset loading
 * - Tracking interdependent fetch calls
 * - Bootstrapping game engines or editors
 *
 * Usage:
 * 
 *   const sync = new SyncLoader({
 *     require: ['config', 'lang', 'dom'],
 *     load: (prepend, controller, triggerID, ...args) => {},
 *     fail: (prepend, controller, triggerID, ...args) => {}
 *   });
 *
 *   fetch('/config.json').then(sync.wrapper('config', res => res.ok ? res : false));
 *
 * Wrapper Signature:
 *   sync.wrapper(id, handler)
 *     - handler should return `false` to mark as failure
 *     - any other return value will mark the ID as successfully resolved
 *
 * Internal Controller State:
 *   {
 *     check: { id: true, ... },   // all required IDs
 *     run:   { id: true, ... },   // completed (success or fail)
 *     fail:  { id: true, ... },   // failed (if any)
 *     lock:  'id'                 // ID that triggered final callback
 *   }
 *
 * Notes:
 * - Only the first triggering ID is passed to the final callback.
 * - You can call `loaded(id)` to check the state of a specific ID or the whole set.
 *
 * Experimental:
 * - `.asPromise()` is an early-stage utility that resolves when all required tasks are complete.
 *   It overrides `onLoad` and may not behave correctly if other callbacks are also in use.
 *
 * @class
 */


export class SyncLoader {

    /**
     * Create a new SyncLoader instance.
     *
     * @param {Object} [options={}] - Optional configuration.
     * @param {Array<string>} [options.require=[]] - A list of required task IDs to track.
     * @param {Function} [options.load] - Callback to invoke when all required tasks are complete.
     *                                    Called even if some tasks fail (unless `fail` is provided).
     * @param {Function} [options.fail] - Optional callback for when a task explicitly fails
     *                                    (i.e., handler returns false). If omitted, `load` is used.
     * @param {*} [options.prepend] - Optional value prepended to all arguments passed to `load`/`fail`.
     *
     * Callback Signature:
     *   load(prepend, controller, triggerID, ...args)
     *   fail(prepend, controller, triggerID, ...args)
     *
     * Notes:
     * - The `controller` contains internal state: check, run, fail, and lock.
     * - The `triggerID` is the last task to complete and trigger resolution.
     * - You can override or supplement `require()` calls after construction.
     */

    
    constructor({ load, fail, require = [], prepend } = {}) {
	this.controller = {
	    check: {},
	    fail : {},
	    run: {},
	    lock: undefined
	};

	this.onLoad = typeof load === 'function' ? load : () => {};
	this.onFail = typeof fail === 'function' ? fail : load;
	this.prepend = prepend;
	this.require(require);
    }

    /**
     * Declare one or more task IDs that must complete before the loader triggers.
     *
     * You can call this at any time before or during execution to add more required tasks.
     * The same ID will not be added more than once.
     *
     * @param {string|string[]} ids - A space-separated string or array of task IDs to track.
     *                                Example: "config lang dom" or ["config", "lang"]
     * @returns {boolean} Always returns true.
     *
     * Example:
     *   sync.require("theme");               // Single ID
     *   sync.require(["theme", "profile"]);  // Multiple IDs
     */
    require(ids) {
	for (const id of Array.isArray(ids) ? ids : String(ids).split(/\s+/)) {
	    if (id) this.controller.check[id] = 1;
	}
	return true;
    }

    /**
     * Mark a task as completed successfully.
     *
     * This signals that a specific tracked task has finished. If all required
     * tasks are marked as complete (`set()` or `fail()`), the `load` or `fail` callback is triggered.
     *
     * @param {string} id - The ID of the task to mark as completed.
     * @param {...*} args - Optional additional arguments to forward to the final callback.
     *                      These will be passed after `prepend`, `controller`, and `id`.
     *
     * @returns {boolean} True if the task was accepted and completion triggered; false otherwise.
     *
     * Notes:
     * - Calling `set()` for an unknown or already completed ID has no effect.
     * - Only the first task to complete the full set triggers the callback (`lock`).
     * - `fail()` tasks still count toward completion and do not block `set()` from finishing.
     */
    set(id, ...args) {
	if (!(id in this.controller.check)) return false;

	this.controller.run[id] = 1;
	
	if (this.loaded() && !this.controller.lock) {
	    this.controller.lock = id;
	    const prepend = {prepend:this.prepend, controller:this.controller,trigger:id};
	    if (this.failed() ) {
		this.onFail?.(prepend, ...args);
	    }else {
		this.onLoad?.(prepend, ...args);
	    }
	    return true;
	}

	return false;
    }
    /**
     * Check if a specific task (or all tasks) have been completed.
     *
     * This method can be used to:
     * - Check whether an individual task ID has been marked as completed via `set()` or `fail()`
     * - Check whether all required tasks have completed (in aggregate)
     *
     * @param {string} [id] - Optional task ID to check individually.
     *                        If omitted, checks whether *all* required tasks are complete.
     *
     * @returns {boolean} `true` if the task (or all tasks) are complete; `false` otherwise.
     *
     * Examples:
     *   sync.loaded("config") → true if "config" is done
     *   sync.loaded() → true if all required tasks are done
     */

    loaded(id) {
	if (id !== undefined) {
	    return this.controller.check[id] && this.controller.run[id] === 1;
	}
	return Object.keys(this.controller.check).every(
	    k => this.controller.run[k] === 1
	);
    }

    /**
     * Check if a specific task (or any task) has failed.
     *
     * This method checks whether a task was explicitly marked as failed using `fail()`,
     * or if any failures exist across the tracked set.
     *
     * @param {string} [id] - Optional task ID to check.
     *                        If omitted, checks whether *any* task has failed.
     *
     * @returns {boolean} `true` if the given task (or any task) has failed; `false` otherwise.
     *
     * Examples:
     *   sync.failed("lang") → true if "lang" failed
     *   sync.failed() → true if any tracked task failed
     */

    failed(id) {
	if (id !== undefined) {
	    return !!this.controller.fail[id];
	}
	const rv = Object.values(this.controller.fail).some(v => v === 1);
	return rv;
    }

    /**
     * Indicates whether all tracked requests completed successfully.
     * Equivalent to `!this.failed()`.
     * does not accept arguments , although fail does. used for polling unresolved jobs.
     * @returns {boolean}
     */
    success() {
	return !this.failed();
    }
    /**
     * Mark a task as completed with failure.
     *
     * This signals that a specific tracked task has finished, but did not succeed.
     * It will still count toward overall completion, allowing the `load` or `fail` callback to be triggered.
     *
     * @param {string} id - The ID of the task to mark as failed.
     * @param {...*} args - Optional additional arguments to forward to the final callback.
     *
     * @returns {boolean} `true` if the task was accepted and marked as failed; `false` otherwise.
     *
     * Notes:
     * - This does not block completion; it simply flags the task as failed.
     * - The system will trigger the `fail` callback if defined, or fall back to `load`.
     * - The failed status can later be checked via `failed(id)` or `failed()`.
     */

    fail(id, ...args) {
	if (!(id in this.controller.check)) return false;
	this.controller.fail[id] = 1;
	return true;
    }

    /**
     * Wrap a handler function to track task completion automatically.
     *
     * This returns a function that:
     * - Executes the provided `handler` (if any)
     * - Interprets its return value
     * - Marks the task as complete via `set()` or failed via `fail()`
     *
     * This is the preferred way to wrap async resolution logic, such as in `.then()` handlers.
     *
     * @param {string} id - The ID of the task being tracked.
     * @param {Function} [handler] - Optional callback to process the task result.
     *                               If the handler returns `false`, the task is marked as failed.
     *
     * @returns {Function} A function to be passed into `.then()` or event callbacks.
     *
     * Handler Signature:
     *   function(...args) → any
     *     - Return `false` to mark the task as failed.
     *     - Return `true`, `undefined`, or any non-false value to mark it as successful.
     *
     * Example:
     *   fetch('/config.json').then(sync.wrapper('config', res => {
     *     if (!res.ok) return false;
     *     configStore = res.body;
     *   }));
     *
     * Notes:
     * - This allows you to write compact async logic without calling `set()` or `fail()` manually.
     * - Even if the handler throws, the task may remain unresolved — handle rejections or wrap safely.
     */

    wrapper(id, handler) {
	this.require(id);
	return (...args) => {
	    const result = typeof handler === 'function' ? handler(...args) : true;
	    if (result === false) {
		this.fail(id, ...args);
	    }
	    this.set(id, ...args);
	    return  args.length ? args[0] : result;
	};
    }

    /**
     * [Experimental] Return a Promise that resolves when all required tasks are completed.
     *
     * This allows `SyncLoader` to be used in `await`-style flows. It resolves once all
     * required task IDs have been marked via `set()` or `fail()`.
     *
     * ⚠️ This method overrides the `onLoad` callback internally and may interfere with
     * previously assigned `load` handlers. It is not designed to coexist with manual
     * `load`/`fail` logic in the same instance.
     *
     * @returns {Promise<{ triggeredBy: string, args: Array }>} Resolves with an object containing:
     *   - `triggeredBy`: the ID of the task that triggered resolution
     *   - `args`: all arguments passed to the internal `onLoad` handler
     *
     * Example:
     *   const sync = new SyncLoader({ require: ['config', 'lang'] });
     *   await sync.asPromise();
     *   console.log("All tasks finished!");
     *
     * Notes:
     * - Safe to call only if no `load` handler is in use.
     * - Calling after all tasks are already loaded resolves immediately.
     */
    asPromise() {
	return new Promise(resolve => {
	    if (this.loaded()) {
		resolve();
	    } else {
		this.onLoad = (...args) => resolve({ triggeredBy: args[1], args });
	    }
	});
    }
}

export default SyncLoader;


# --- end: src/batch/SyncLoader.js ---



# --- begin: src/concurrencyLimiter.js ---


export function concurrencyLimiter(maxConcurrent = 8) {
    let activeCount = 0;
    const queue = [];

    const next = () => {
        if (queue.length === 0 || activeCount >= maxConcurrent) {
            return;
        }
        activeCount++;
        const { fn, resolve, reject } = queue.shift();
        Promise.resolve()
            .then(fn)
            .then(result => {
                resolve(result);
            })
            .catch(err => {
                reject(err);
            })
            .finally(() => {
                activeCount--;
                next();
            });
    };

    return function limit(fn) {
        return new Promise((resolve, reject) => {
            queue.push({ fn, resolve, reject });
            next();
        });
    };
}


export default concurrencyLimiter;


# --- end: src/concurrencyLimiter.js ---



# --- begin: src/core/fetch_enum.js ---

/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
export const constants = {
    mode: [
	'cors',
	'no-cors',
	'same-origin'
    ],

    cache: [
	'default',
	'no-store',
	'reload',
	'no-cache',
	'force-cache',
	'only-if-cached'
    ],

    referrer: [
	//'no-referrer',
	//'client',
	// or a string URL, 
    ],

    priority: [
	'auto',
	'high',
	'low'
    ],

    keepalive: [
	true,
	false
    ],

    integrity: [
	 //  valid values are arbitrary SRI strings, so anything can pass
    ],

    referrerPolicy: [
	'no-referrer',
	'no-referrer-when-downgrade',
	'origin',
	'origin-when-cross-origin',
	'same-origin',
	'strict-origin',
	'strict-origin-when-cross-origin',
	'unsafe-url'
    ],

    credentials: [
	'omit',
	'same-origin',
	'include'
    ],

    redirect: [
	'follow',
	'error',
	'manual'
    ],

    duplex: ['half'],

    signal: [true,false],
    //method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH']
};
export default constants;


# --- end: src/core/fetch_enum.js ---



# --- begin: src/core/HTTP.js ---

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


# --- end: src/core/HTTP.js ---



# --- begin: src/core/Net.js ---

/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
import HTTP          from './HTTP.js';
import AutoLoader    from '../loader/AutoLoader.js';
import SpecManager   from '../spec/SpecManager.js';
import ModuleManager from '../modules/ModuleManager.js';
import BatchLoader   from '../batch/BatchLoader.js';

/**
 * Net
 * ---
 * Central interface for network operations including:
 * - HTTP requests
 * - dynamic spec (e.g. OpenAPI) loading
 * - modular API call management
 * - dynamic JS module importing
 * - batched request orchestration
 *
 * Intended as a one-stop hub for apps interacting with dynamic, declarative, or
 * service-driven APIs. Each subcomponent is accessible through its respective namespace.
 *
 * Usage:
 * ```js
 * const net = new Net();
 * await net.specs.load('/specs/openapi.json');
 * const res = await net.specs.call('mySpec', 'listItems');
 * ```
 */
export class Net {
    constructor(opts = {}) {
        /**
         * Generic HTTP request layer.
         * See HTTP.js for supported options.
         */
        this.http = new HTTP(opts);

        /**
         * Loads a spec document from a URL or object (e.g., OpenAPI).
         */
        this.loader = new AutoLoader(this.http);

        /**
         * Manages multiple spec documents and provides unified call access.
         */
        this.specs = new SpecManager({ http: this.http, loader: this.loader });

        /**
         * Dynamically loads and manages JavaScript modules by ID.
         */
        this.modules = new ModuleManager(this);

        /**
         * Coordinates multiple HTTP requests and triggers a callback when all complete.
         */
        this.batch = new BatchLoader(this);
    }
}

export default Net;


# --- end: src/core/Net.js ---



# --- begin: src/index.js ---

/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
// Public entry point for network module

import Net from './core/Net.js';
import HTTP from './core/HTTP.js';

export { Net, HTTP };
export * from './core/fetch_enum.js';

export default Net;


# --- end: src/index.js ---



# --- begin: src/loader/AutoLoader.js ---

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


# --- end: src/loader/AutoLoader.js ---



# --- begin: src/loader/index.js ---

/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
// Public loader registry for spec formats

import OpenAPILoader from './OpenAPILoader.js';
// import SimpleLoader from './Simple.js'; // Placeholder for future

export const loaders = {
  openapi: OpenAPILoader,
  // simple: SimpleLoader
};

export default loaders;


# --- end: src/loader/index.js ---



# --- begin: src/loader/OpenAPILoader.js ---

/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
import HTTP from '../core/HTTP.js';
import Spec from '../spec/OpenAPISpec.js';

class OpenAPILoader {
  constructor(net = null) {
    this.net = net ?? new HTTP();
  }

  async load(input) {
    if (typeof input === 'object' && input !== null) {
      return new Spec(input, this.net);
    }

    if (typeof input === 'string') {
      const spec = await this.net.get(input, { json: true });
      return new Spec(spec, this.net);
    }

    throw new Error('OpenAPI.load() requires a URL or spec object.');
  }
}

export default OpenAPILoader;


# --- end: src/loader/OpenAPILoader.js ---



# --- begin: src/modules/Module.js ---

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


# --- end: src/modules/Module.js ---



# --- begin: src/modules/ModuleManager.js ---

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


# --- end: src/modules/ModuleManager.js ---



# --- begin: src/spec/AbstractSpec.js ---

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


# --- end: src/spec/AbstractSpec.js ---



# --- begin: src/spec/OpenAPISpec.js ---

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


# --- end: src/spec/OpenAPISpec.js ---



# --- begin: src/spec/SpecManager.js ---

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


# --- end: src/spec/SpecManager.js ---



# --- begin: src/utils/concurrencyLimiter.js ---


export function concurrencyLimiter(maxConcurrent = 8) {
    let activeCount = 0;
    const queue = [];

    const next = () => {
        if (queue.length === 0 || activeCount >= maxConcurrent) {
            return;
        }
        activeCount++;
        const { fn, resolve, reject } = queue.shift();
        Promise.resolve()
            .then(fn)
            .then(result => {
                resolve(result);
            })
            .catch(err => {
                reject(err);
            })
            .finally(() => {
                activeCount--;
                next();
            });
    };

    return function limit(fn) {
        return new Promise((resolve, reject) => {
            queue.push({ fn, resolve, reject });
            next();
        });
    };
}


export default concurrencyLimiter;


# --- end: src/utils/concurrencyLimiter.js ---

