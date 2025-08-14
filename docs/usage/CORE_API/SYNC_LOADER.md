↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_SYNC\_LOADER

> A minimal coordinator that tracks completion of **named async tasks** and triggers a final callback when the required set is done. Only tasks whose handler returns **`false`** are marked as failed; all others count as success.

---

## Overview

`SyncLoader` is a small controller used by **BatchLoader** and other systems to:

* Declare a set of **required IDs** to complete
* Mark each ID as **set** (success) or **fail** (non‑blocking)
* Trigger a final **onLoad** (or **onFail**) once all required IDs are resolved
* Provide a **wrapper(id, handler)** utility to integrate easily with Promises/events

**Internal state (`controller`)**

```ts
{
  check: Record<string, 1>,  // required ids
  run:   Record<string, 1>,  // completed (success or fail)
  fail:  Record<string, 1>,  // those explicitly failed
  lock?: string              // id that triggered final callback
}
```

When the last required ID resolves, SyncLoader calls either `onFail` (if any failed) or `onLoad` with a small prepend object.

---

## Constructor

### `new SyncLoader({ load, fail, require = [], prepend } = {})`

* **`load(prepend, ...args)`** — called when all required tasks are finished (and none failed, or `fail` not provided).
* **`fail(prepend, ...args)`** — called if any task was marked failed; if omitted, `load` is used instead.
* **`require`** — initial list of IDs to track.
* **`prepend`** — arbitrary value passed as `{ prepend, controller, trigger }` to the final callback.

**Prepend object**

```ts
{ prepend: any, controller: ControllerState, trigger: string }
```

---

## Core API

### `require(ids)`

Declare one or more required IDs. May be called multiple times; duplicates are ignored.

### `set(id, ...args)`

Mark an ID as completed (success). If all required IDs are completed and `lock` is unset, triggers the final callback.

### `fail(id, ...args)`

Mark an ID as failed (still counts toward completion). Final callback will route to `fail` if provided.

### `loaded(id?) => boolean`

* With an `id`: whether that specific task has completed (success or fail).
* Without an `id`: whether **all** required tasks are complete.

### `failed(id?) => boolean`

* With an `id`: whether that task was marked failed.
* Without an `id`: whether **any** task failed.

### `success() => boolean`

Convenience: `!failed()`.

### `wrapper(id, handler?) => (...args) => any`

Returns a function suitable for `.then()`/callbacks. Execution rules:

1. Runs `handler(...args)` if provided; otherwise treats as success.
2. If the handler returns **`false`**, calls `fail(id, ...args)`.
3. Always calls `set(id, ...args)` afterward.
4. Returns the first arg (`args[0]`) if present, otherwise the handler’s return.

### `asPromise() => Promise`

Experimental helper that resolves when all required tasks are complete. It overrides `onLoad` internally; avoid mixing with custom `load` handlers.

---

## Usage Examples

### 1) Wrap fetch calls

```js
const sync = new SyncLoader({ require: ["cfg", "lang"], load: ({ controller }) => {
  console.log("all done", controller);
}});

fetch('/cfg.json').then(sync.wrapper('cfg', res => res.ok ? res : false));
fetch('/i18n/en.json').then(sync.wrapper('lang', res => res.ok ? res : false));
```

### 2) Manual set/fail

```js
const sync = new SyncLoader({ require: ['db', 'fs'], fail: ({ controller }) => console.warn('some failed', controller) });

try { await openDB(); sync.set('db'); } catch (e) { sync.fail('db', e); sync.set('db'); }
try { await mountFS(); sync.set('fs'); } catch (e) { sync.fail('fs', e); sync.set('fs'); }
```

### 3) Promise style

```js
const sync = new SyncLoader({ require: ['a','b'] });
const done = sync.asPromise();

someAsync().then(sync.wrapper('a'));
otherAsync().then(sync.wrapper('b'));
await done; // all required tasks reached set()/fail()
```

---

## Notes & Gotchas

* **Failure semantics:** only a handler **returning `false`** marks failure. If an endpoint legitimately returns boolean `false`, wrap it (e.g., check a `Response.ok` field) before returning.
* **Final callback routing:** if any task failed, `fail` is invoked; otherwise `load`. If `fail` is not supplied, `load` is used for both paths.
* **Locking:** only the **first** ID that completes the set triggers the final callback; subsequent completions are ignored for triggering.
* **Prepend ergonomics:** the `prepend` value you pass to the constructor is always surfaced back in the final callback via `{ prepend, controller, trigger }`.

---

## Types (informal)

```ts
class SyncLoader {
  constructor(opts?: { load?: Function; fail?: Function; require?: string[]; prepend?: any });
  require(ids: string|string[]): boolean;
  set(id: string, ...args: any[]): boolean;
  fail(id: string, ...args: any[]): boolean;
  loaded(id?: string): boolean;
  failed(id?: string): boolean;
  success(): boolean;
  wrapper(id: string, handler?: (...a:any[])=>any): (...a:any[])=>any;
  asPromise(): Promise<any>;
}
```

---

## See Also

* **CORE\_API\_BATCH\_LOADER.md** — how `SyncLoader` coordinates batch completion.
* **CORE\_API\_HTTP.md** — shaping responses for handlers (e.g., use `format:'full'`).
