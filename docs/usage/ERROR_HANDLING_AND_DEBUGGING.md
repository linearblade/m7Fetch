← Back to [Usage Guide Index](TOC.md)

# ERROR\_HANDLING & DEBUGGING

Practical patterns for surfacing failures, inspecting responses, and adding observability to **m7Fetch** (HTTP, Specs, Modules, Batch/Sync).

---

## Overview

* Prefer **structured responses** with `format: "full"` while developing.
* Distinguish **transport errors** (network, CORS) from **application errors** (HTTP 4xx/5xx with JSON body).
* In batches, only a **handler returning `false`** marks an item failed.

---

## Use `format: "full"` during development

Get `{ ok, status, headers, body }` for decisions and logs.

```js
const res = await net.http.get("/thing", { format: "full" });
if (!res.ok) {
  console.error("HTTP error", { route: "/thing", status: res.status, body: res.body });
}
```

### Inspect headers and status

```js
const res = await net.http.head("/file", { format: "full" });
console.log(res.status, Object.fromEntries(res.headers));
```

---

## Common failure modes (HTTP)

* **CORS blocked** → Server must allow your origin/method/headers.
* **Cookies not sent** → Missing `credentials: "include"` or cookie flags.
* **Wrong body encoding** → Add `{ urlencoded: true }` or send `FormData/Blob`.
* **Binary mishandled** → Use `format: "raw"` and decode manually.
* **Timeout** → Provide `timeout` (ms) or pass your own `AbortSignal`.

```js
try {
  const res = await net.http.post("/login", { u: "a", p: "b" }, { urlencoded: true, format: "full", timeout: 5000 });
  if (!res.ok) throw new Error(res.body?.message || `status ${res.status}`);
} catch (err) {
  console.error("login failed", err);
}
```

---

## Batch/Sync errors (coordination layer)

* **Only `false` fails**: if a handler returns `false`, that ID is marked failed.
* **Default behavior**: the default batch handler stores the response and treats `!res.ok` as failure.
* **Duplicate IDs**: batch preflight throws on duplicate `id` or missing `url`.

```js
await net.batch.run([
  { id: "cfg", url: "/config", opts:{ format: "full" } },
  { id: "lang", url: "/i18n/en.json", opts:{ format: "full" } },
],
(prepend) => {
  // success path when none failed (or fail handler omitted)
  console.log("done", Object.keys(prepend.context));
},
(prepend) => {
  // at least one failed
  const failed = Object.keys(prepend.controller.fail);
  console.warn("batch failed", { failed, trigger: prepend.trigger });
},
{ awaitAll: true, limit: 8 });
```

### Edge case: JSON `false`

If your API returns literal `false`, do not return it directly from the handler:

```js
handler: (res) => (res.body === false ? { ok: true, body: false } : res)
```

---

## SpecManager errors

* **`operationId` not found** → check the spec and the ID you used.
* **Missing path params** → provide all `/{param}` values in `args.path`.
* **Spec load failure** → network/CORS errors when fetching the spec; inspect status/body with `format: "full"` on `specs.load`.

```js
try {
  await net.specs.load("/specs/pets.json", { id: "petsAPI" });
  const res = await net.specs.call("petsAPI", "getPet", { path: { petId: "p-42" }, format: "full" });
  if (!res.ok) console.warn("API error", res.status, res.body);
} catch (e) {
  console.error("spec failure", e);
}
```

---

## Module load errors

Typical causes: 404, non‑ESM sources, MIME type, or CORS.

```js
try {
  const charts = await net.modules.load("charts", "/modules/charts.js");
  charts.render("#root");
} catch (e) {
  console.error("module failed", { id: "charts", err: e });
}
```

---

## Centralized logging pattern

Wrap calls with a tiny helper so logs are consistent.

```js
async function call(route, fn) {
  try {
    const res = await fn();
    if (res?.ok === false) console.warn("HTTP", { route, status: res.status, msg: res.body?.message });
    return res;
  } catch (e) {
    console.error("FATAL", { route, err: String(e) });
    throw e;
  }
}

await call("/config", () => net.http.get("/config", { format: "full" }));
```

---

## Timeouts & Abort (defensive)

```js
// Timeout
const conf = await net.http.get("/slow", { format: "full", timeout: 4000 });

// Abort flow
const ctrl = new AbortController();
const p = net.http.get("/stream", { format: "raw", signal: ctrl.signal });
ctrl.abort();
try { await p; } catch (e) { console.warn("aborted", e.name); }
```

---

## Retries (guidance)

m7Fetch does not force a retry policy. Consider a small wrapper with **exponential backoff** for idempotent GETs.

```js
async function retry(fn, { tries = 3, base = 200 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { last = e; }
    await new Promise(r => setTimeout(r, base * 2 ** i));
  }
  throw last;
}

const res = await retry(() => net.http.get("/ping", { format: "full" }));
```

---

## Observability checklist

* [ ] Use `format: "full"` in dev paths.
* [ ] Log **endpoint, status, small body excerpt**, not full payloads.
* [ ] Capture **latency** at call sites (Date.now before/after) if needed.
* [ ] For batches, log `prepend.controller.fail` and the `trigger` id.
* [ ] Include a **correlation id** header in requests where possible.

---

## Troubleshooting quick list

* **CORS** → server must allow origin/method/headers; check preflights.
* **Cookies** → add `credentials:"include"` and correct cookie flags.
* **Duplicate batch IDs** → fix `id` collisions in `loadList`.
* **Unsupported method** → only `get`/`post` allowed in batches.
* **Spec call 404** → wrong `operationId` or missing `path` params.
* **Binary parsing** → use `format: "raw"` and decode yourself.

---

## See also

* **HTTP\_GUIDE.md** — response formats and options.
* **BATCHING\_AND\_COORDINATION.md** — batch semantics and handlers.
* **SPEC\_MANAGER.md** — spec load/call flows.
* **AUTHENTICATION\_AND\_SECURITY.md** — headers, credentials, and CORS.
