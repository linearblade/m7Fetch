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
