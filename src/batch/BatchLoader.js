/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
// vendor/network/BatchLoader.js

import SyncLoader from './SyncLoader.js';

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
     * @param {Function|null} load - Callback fired when all items have successfully loaded
     * @param {Function|null} fail - Callback fired if any item fails
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
     */

    async run(loadList = [], load = null, fail = null) {
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
	
	const validatedList = this._preflightCheck(loadList);
	const all = [];
	for (const item of validatedList) {
	    const { method = 'get', id, url, handler, opts = {}, data: postData = null } = item;
	    const mOpts = { ...{ format: 'full' }, ...this.fetchOpts, ...opts };

	    const request = method === 'post'
		  ? this.net.http.post(url, postData, mOpts)
		  : this.net.http.get(url, mOpts);

	    all.push(
		request.then(sync.wrapper(id, batchWrapper(this, id, handler, item, mOpts)))
		.then(result => ({ id, result }))
	    );
	}

	const flatResults = await Promise.all(all);

	const results = {};
	for (const { id, result } of flatResults) {
	    results[id] = result;
	}

	return { sync, results };
	
	/*
	for (const item of validatedList) {
	    const {method='get', id, url, handler,opts={},data: postData = null } = item;
	    const  mOpts = {...{format:'full'}, ...this.fetchOpts, ...opts} ;
	    let resp = null;
	    if (method =='post'){
		 resp = this.net.http.post(url,postData,mOpts).then(
		    sync.wrapper(id,  batchWrapper(this,id,handler,item,mOpts) )
		);
	    }else{
		 resp = this.net.http.get(url,mOpts).then(
		    sync.wrapper(id,  batchWrapper(this,id,handler,item,mOpts) )
		);
	    }
	    all.push(resp);
	    }
	*/

	//const results = await Promise.all(all); 
	//return {sync,results};
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
