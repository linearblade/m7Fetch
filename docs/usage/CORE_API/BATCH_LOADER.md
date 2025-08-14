↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_BATCH\_LOADER

> Coordinate multiple HTTP requests with IDs, optional per‑item handlers, shared context, and simple success/failure semantics.
>
> BatchLoader powers patterns like “load config + locale + feature flags, then start the app,” and is exposed at `net.batch`.

---

## Overview

**BatchLoader** accepts a list of jobs (`{ id, method, url, handler, opts }`), executes them with concurrency control, stores results in an internal **context** map, and signals completion through a lightweight **SyncLoader** controller. Only a handler that returns **`false`** marks a request as failed; everything else is treated as success.

---

## Constructor

### `new BatchLoader(net, { fetch?, batch? } = {})`

Binds to the provided `net` instance and prepares defaults.

* **Parameters**

  * `net` *(Net)* — The parent network hub; must expose `http.get/post`.
  * `fetch` *(object, optional)* — Default HTTP options merged into each request (e.g., `{ format: 'full' }`).
  * `batch` *(function | false, optional)* — Custom batch handler. `false` selects the no‑op behavior; otherwise omitted ⇒ built‑in `batchStatus` (see below).

* **Properties**

  * `context: Record<string, any>` — Stores per‑ID results (unless suppressed by a custom handler).
  * `fetchOpts: object` — Default fetch options.
  * `batchHandler: function` — Function factory used to wrap per‑item handlers.

---

## Built‑in Batch Modes

Batch behavior is defined by a **handler factory** that wraps your per‑item `handler(res)`:

* **`batchStatus(obj, id, handler)`** *(default)* — Stores the result at `context[id]`. If `!res.ok`, returns `false` to signal failure. If a per‑item `handler` is provided, its return value is used.
* **`batchStore(obj, id, handler)`** — Always stores the result and treats it as success unless your `handler` returns `false`.
* **`batchNone(obj, id, handler)`** — Does not store anything automatically; you are responsible for storing and for returning `false` to signal failure.

> Note: In all modes, **only a returned `false`** marks the item failed. If your endpoint legitimately returns a boolean `false` body, wrap it (e.g., use `{ format: 'full' }` and inspect `res.body`).

---

## Method

### `async run(loadList, onLoad?, onFail?, { awaitAll = true, limit = 8 } = {})`

Submits the batch and returns a `SyncLoader` plus either a results map or an array of Promises (if not awaiting all).

* **`loadList`** *(Array)* — Each item:

  ```js
  {
    id: "config",                 // required unique ID
    method: "get" | "post",       // optional; defaults to "get" and validated
    url: "/config.json",          // required
    handler: (res) => any,          // optional per-item handler
    opts: { format: "full" },      // optional http opts merged with ctor defaults
    // post only
    data: any                       // body passed when method === 'post'
  }
  ```

* **`onLoad`** *(Function | Array | null)* — Called after all required IDs resolve successfully (or when `fail` is not provided). Signature: `(prepend, data)` where `prepend` includes `{ context, trigger, controller }`.

* **`onFail`** *(Function | Array | null)* — Called if **any** item handler returns `false`.

* **`awaitAll`** *(boolean)* —

  * `true` (default): resolves to `{ sync, results }` where `results` is a map `{ id → last handler result }`.
  * `false`: resolves to `{ sync, results }` where `results` is an array of live Promises submitted in order; poll `sync` for completion.

* **`limit`** *(number)* — Concurrency cap for in‑flight HTTP requests.

* **Returns**

  * `Promise<{ sync: SyncLoader, results: Record<string, any> | Promise<any>[] }>`

* **Behavior**

  1. Validates items (`id`, `url`, supported `method`, no duplicate IDs).
  2. Builds merged opts: `{ format: 'full', ...fetchOpts, ...item.opts }`.
  3. Schedules requests via a concurrency limiter (`limit`).
  4. Wraps each response with `SyncLoader.wrapper(id, batchWrapper(...))`.
  5. Invokes `onLoad` or `onFail` once all required IDs are set/failed.

---

## Context & Retrieval

* `context[id]` stores per‑item results by default (mode‑dependent).
* `get(id)` returns the stored value for that `id` (when using a storing batch mode).

---

## Error Handling

* **Validation** — Missing `id`/`url`, duplicate IDs, or unsupported methods throw immediately.
* **Per‑item failure** — Only a handler that returns `false` marks failure.
* **Network/HTTP errors** — Surface from the HTTP layer; with `format: 'full'`, you can inspect `res.ok`, `status`, and `body` inside your handler.

---

## Examples

### 1) Basic status‑checked batch (default behavior)

```js
const list = [
  { id: 'cfg',   url: '/cfg.json' },
  { id: 'langs', url: '/i18n/en.json' }
];

const { sync, results } = await net.batch.run(list, (prepend) => {
  console.log('ready', prepend.context);
});
```

### 2) Custom per‑item handler

```js
await net.batch.run([
  { id: 'cfg', url: '/cfg.json', opts: { format: 'full' }, handler: (res) => {
      if (!res.ok) return false;        // marks failure
      return res.body?.config;          // store derived value
  }}
]);
```

### 3) Non‑blocking mode with polling

```js
const { sync, results: promises } = await net.batch.run(
  [{ id: 'slow', url: '/big.json' }],
  null,
  null,
  { awaitAll: false }
);

// Later — check completion
if (sync.loaded()) {
  console.log('done, ok?', sync.success());
}
```

### 4) Switch to `batchStore` (always store)

```js
net.batch.setBatchHandler(net.batch.batchStore);
await net.batch.run([{ id: 'html', url: '/page.html', opts: { format: 'full' } }]);
const page = net.batch.get('html');
```

### 5) Use POST with body

```js
await net.batch.run([
  { id: 'token', method: 'post', url: '/oauth/token', data: { grant_type: 'client_credentials' },
    opts: { urlencoded: true, format: 'full' } }
]);
```

---

## Types (informal)

```ts
class BatchLoader {
  constructor(net: Net, opts?: { fetch?: object; batch?: Function | false });
  setFetchOpts(opts: object): void;
  setBatchHandler(fn: Function | false): void;
  get(id: string): any;
  run(
    loadList: Array<{ id: string; method?: 'get'|'post'; url: string; handler?: (res:any)=>any; opts?: object; data?: any }>,
    onLoad?: Function | null,
    onFail?: Function | null,
    options?: { awaitAll?: boolean; limit?: number }
  ): Promise<{ sync: SyncLoader, results: Record<string, any> | Promise<any>[] }>;
}
```

---

## See Also

* **CORE\_API\_HTTP.md** — request/response formats used inside item handlers.
* **CORE\_API\_SYNC\_LOADER.md** — controller semantics (`loaded()`, `failed()`, `success()`, `wrapper()`).
* **src/batch/customBatchHandlers.md** — writing your own batch handler.
