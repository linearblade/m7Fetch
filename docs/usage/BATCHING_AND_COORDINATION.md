# BATCHING & COORDINATION

Use **BatchLoader** (with **SyncLoader** under the hood) to run many HTTP requests, cap concurrency, and coordinate a single completion or failure path. Handlers let you validate/transform each item, and a shared `context` makes results accessible by `id`.

---

## Why batch?

* **Throughput**: parallelize requests with a safe concurrency cap.
* **Determinism**: each item is tracked by a unique `id`.
* **Coordination**: a single `onLoad` or `onFail` when the batch completes.
* **Flexibility**: per-item handlers for parsing, storage, and validation.

---

## Quick start

Returns: 
* `awaitAll:true` → `results: { [id]: value }`
* `awaitAll:false` → `results: Promise<any>[]`


```js
const { sync, results } = await net.batch.run(
  [
    { id: "cfg",  url: "/config.json",   opts: { format: "full" } },
    { id: "lang", url: "/i18n/en.json",  opts: { format: "full" } },
    { id: "ping", url: "/health",        opts: { format: "full" } },
  ],
  // onLoad: fires when ALL items have completed (success or fail). If any failed and an onFail exists, onFail will run instead.
  (prepend, last) => {
    // prepend = { context, trigger, controller }
    console.log("✅ done:", Object.keys(prepend.context));
  },
  // onFail: fires if ANY handler returned false (see failure semantics below)
  (prepend, last) => {
    console.warn("⚠️ one or more failed", { trigger: prepend.trigger });
  },
  { awaitAll: true, limit: 8 }
);

// When awaitAll: true, `results` is a map of { id → handler result }.
// You can also read the shared context at any time:
const cfg = net.batch.get("cfg");
```

**Item schema**

```js
{
  id: "unique-id",               // required
  method: "get" | "post",       // defaults to "get"
  url: "/path" | "https://…",    // required
  data: {…},                      // request body for POST (optional)
  opts: { format: "full" },       // per-request HTTP options
  handler: (res) => any           // optional transform/validation
}
```

---

## Failure semantics (important)

* Only a handler that **returns `false`** marks that item as **failed**.
* The **default batch handler** (`batchStatus`) will store the response **and** automatically treat `!res.ok` as failure.
* For raw success values, return anything other than `false` (including `undefined`).

> **Edge case:** if your API legitimately returns the literal JSON value `false`, don’t propagate it directly as the handler’s return value. Wrap it:

```js
handler: (res) => (res.body === false ? { ok: true, body: false } : res)
```

---

## Concurrency control

Cap parallelism with the `limit` option:

```js
await net.batch.run(loadList, onLoad, onFail, { awaitAll: true, limit: 4 });
```

Requests are queued and executed using a lightweight limiter; set a sensible value (e.g., 4–16) to avoid server or browser saturation.

---

## Results & shared context

* **Shared context:** all stored outputs live under `prepend.context[id]` during callbacks, and are accessible later via `net.batch.get(id)`.
* **`results` map:** when `awaitAll: true`, the return value includes `results[id]` for each item.
* **Custom storage:** if you use a custom batch handler that doesn’t store automatically, write to `obj.context[id]` inside your handler.

```js
const { results } = await net.batch.run([
  { id: "a", url: "/a.json", opts:{ format: "full" } },
  { id: "b", url: "/b.json", opts:{ format: "full" } },
]);
console.log(results.a, results.b);
console.log(net.batch.get("a")); // same value if using default storage
```

---

## Streaming mode (awaitAll: false)

Fire handlers as responses arrive, and coordinate completion with **SyncLoader**:

```js
const { sync } = await net.batch.run(loadList, onLoad, onFail, { awaitAll: false, limit: 8 });

// Option A: callbacks (onLoad/onFail) will run when all required items have finished.

// Option B: poll the sync state (e.g., in a UI loop)
const tick = setInterval(() => {
  if (sync.loaded()) {           // all done
    clearInterval(tick);
    console.log("success?", sync.success()); // true if no failures
  }
}, 100);
```

> In streaming mode, prefer reading from the shared `context[id]` as items complete.

---

## Custom batch handlers

Batch behavior can be tuned globally per batch instance.

### Built-ins

* **`batchStatus(obj, id, handler)`** *(default)* — stores the response, and marks failure if `!res.ok`.
* **`batchStore(obj, id, handler)`** — stores the response regardless of status; never fails unless your `handler` returns `false`.
* **`batchNone(obj, id, handler)`** — no automatic storage; your `handler` controls everything. Return `false` to fail.

### Choosing a default handler

```js
// Apply to the current BatchLoader instance (affects subsequent runs)
net.batch.setBatchHandler(net.batch.batchStore);    // always store
// or
net.batch.setBatchHandler(false);                   // use batchNone

// Provide default fetch options for all items in this batch context
net.batch.setFetchOpts({ format: "full" });
```

### Custom transform example

```js
// Normalize API responses into a common shape
function normalize(obj, id, handler) {
  return (res) => {
    const body = res.body ?? res; // handle format: 'body' or 'full'
    if (body?.error) return false; // fail this item
    const out = { data: body?.data ?? body, at: Date.now() };
    obj.context[id] = out;         // store yourself if using batchNone
    return out;                    // returned value becomes results[id]
  };
}

net.batch.setBatchHandler(normalize);
await net.batch.run([
  { id: "one", url: "/api/one",  opts:{ format: "full" } },
  { id: "two", url: "/api/two",  opts:{ format: "full" } },
]);
```

---

## Supported methods & preflight checks

* Allowed `method` values: **`get`** and **`post`** (invalid values throw).
* Each item **must** include a unique `id` and a `url`.
* Duplicate IDs or missing fields throw clear errors.

```js
await net.batch.run([
  { id: "dup", url: "/a" },
  { id: "dup", url: "/b" }, // ❌ throws: duplicate ID
]);
```

---

## Patterns & recipes

* **Config+lang bootstrap:** load `/config.json` and `/i18n/en.json` together, render UI when both arrive.
* **Health fan‑out:** ping several microservices and mark the panel red if any fail.
* **Asset manifests:** fetch multiple manifests, merge into a single registry before continuing.
* **Progress UI:** use `awaitAll:false` and a polling loop to update a progress bar as each ID completes.

---

## Error handling & observability

* Prefer `format: "full"` while developing to inspect `{ ok, status, body }` in handlers.
* Surface endpoint, status, and a small body excerpt in logs.
* In `onFail`, the `prepend.controller.fail` map contains the IDs that failed.

```js
(prepend) => {
  const failed = Object.keys(prepend.controller.fail);
  console.warn("batch failed: ", failed);
}
```

---

## Troubleshooting

* **Batch never completes** → Ensure every handler returns **something** (not a never‑resolving promise). Use `awaitAll:true` to collect results deterministically.
* **False‑as‑failure** → Wrap legitimate boolean `false` results to avoid being treated as failure.
* **Unexpected body parsing** → Set `opts.format: "raw"` and parse yourself when downloading binary.
* **Too many open requests** → Lower `limit` to apply back‑pressure.

---

## See also

* **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** — request/response options used inside each item.
* **[CORE\_API\_BATCH\_LOADER.md](./CORE_API_BATCH_LOADER.md)** — deep API surface and return shapes.
* **[CORE\_API\_SYNC\_LOADER.md](./CORE_API_SYNC_LOADER.md)** — coordinator semantics.
