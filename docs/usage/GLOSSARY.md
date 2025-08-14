← Back to [Usage Guide Index](TOC.md)

# GLOSSARY

Short, practical definitions for terms used throughout **m7Fetch** docs.

---

## A–D

* **AbortController** — Web API to cancel a fetch. Pass `signal` to HTTP calls; call `abort()` to cancel.
* **absolute** — Request option that bypasses the instance base URL and uses the provided URL as‑is.
* **AutoLoader** — Logic behind `specs.load(...)` that detects spec type (e.g., OpenAPI), fetches it (GET/POST), and hands off to **SpecManager**. See **[AUTOLOADER.md](./AUTOLOADER.md)**.
* **BatchLoader** — Runs multiple HTTP jobs with per‑item handlers and a concurrency cap. Returns a `results` map (when `awaitAll:true`) and coordinates completion via **SyncLoader**. See **[BATCHING\_AND\_COORDINATION.md](./BATCHING_AND_COORDINATION.md)**.
* **batch handlers** — Strategies controlling storage/failure behavior per item:

  * `batchStatus` *(default)*: store response; fail if `!res.ok`.
  * `batchStore`: store always; only fail when handler returns `false`.
  * `batchNone`: no auto‑storage; your handler must store/return; `false` marks failure.
* **body | full | raw** — Response shapes returned by HTTP/spec calls:

  * `body`: parsed body only,
  * `full`: `{ ok, status, headers, body }`,
  * `raw`: native `Response`.
* **CORS** — Browser security policy for cross‑origin requests; governed by server `Access-Control-*` headers.
* **CSP** — Content‑Security‑Policy header that constrains resource loads (e.g., `connect-src`, `script-src`).

## E–L

* **ESM (ES Modules)** — Module system using `import`/`export`. Required for dynamic module loading.
* **FETCH\_DEFAULTS** — Class‑level defaults on `HTTP` for fetch options (e.g., `credentials`, `mode`). Extend via subclassing. See **[CONFIGURATION\_AND\_DEFAULTS.md](./CONFIGURATION_AND_DEFAULTS.md)**.
* **format** — Per‑request option choosing the response shape (`body` | `full` | `raw`).
* **handler (batch)** — Function `(res) => any` run per item; returning **`false`** marks that item as failed.
* **headers** — HTTP headers; can be set instance‑wide (`new Net({ headers })`) or per request.
* **HTTP** — m7Fetch client that wraps `fetch` with base URL handling, bodies, and response shaping. See **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)**.
* **id (batch/spec)** — Unique key for a batch item or a loaded spec.
* **limit** — Concurrency cap (max simultaneous requests) for a batch. See **[CONCURRENCY\_LIMITING.md](./CONCURRENCY_LIMITING.md)**.

## M–R

* **ModuleManager** — Dynamically `import()` ES modules and return their namespace. See **[MODULES.md](./MODULES.md)**.
* **Net** — The top‑level hub exposing `http`, `specs`, `modules`, and `batch`.
* **operationId** — OpenAPI operation identifier used by **SpecManager** to look up method/path.
* **OpenAPI** — Popular API description format consumed by **SpecManager**.
* **path / query / headers / body** — Parameter groups for **SpecManager** calls:

  * `path`: values injected into URL templates (`/pets/{id}` → `{ id: "42" }`).
  * `query`: `?k=v` pairs appended to the URL.
  * `headers`: merged with instance/request headers.
  * `body`: payload for methods with a request body.
* **raw** — Response format returning the native `Response`. Use for manual parsing (blob/arrayBuffer/stream).
* **results map** — Object returned by `batch.run(..., { awaitAll:true })` keyed by item `id` with each handler’s return value.

## S–Z

* **SRI** — Subresource Integrity; protects static assets/modules from tampering via hashes.
* **SpecManager** — Loads API specs and calls operations by `operationId`. See **[SPEC\_MANAGER.md](./SPEC_MANAGER.md)**.
* **SyncLoader** — Minimal coordinator used by **BatchLoader**; tracks `require`d IDs, success/failure, and triggers final callbacks.
* **timeout** — Per‑request ms value; aborts the request via `AbortController` when available.
* **urlencoded** — Request option for form posts (`application/x-www-form-urlencoded`).
* **x-type** — Optional hint used by **AutoLoader** to identify spec types (e.g., `openapi`).
* **awaitAll** — Batch option: `true` waits for all items and returns a `results` map; `false` streams handler execution and uses SyncLoader for completion.
* **absolute** — (duplicate index reference) See **A–D**; bypass instance base URL.
* **credentials** — Fetch option controlling cookie send/receive behavior (`omit`, `same-origin`, `include`).
* **context (batch)** — Shared object where per‑item results are stored under their IDs.

---

## Cross‑references

* **HTTP** → **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)**
* **Batch** → **[BATCHING\_AND\_COORDINATION.md](./BATCHING_AND_COORDINATION.md)**
* **Specs** → **[SPEC\_MANAGER.md](./SPEC_MANAGER.md)** and **[AUTOLOADER.md](./AUTOLOADER.md)**
* **Config** → **[CONFIGURATION\_AND\_DEFAULTS.md](./CONFIGURATION_AND_DEFAULTS.md)**
* **Errors** → **[ERROR\_HANDLING\_AND\_DEBUGGING.md](./ERROR_HANDLING_AND_DEBUGGING.md)**
* **Concurrency** → **[CONCURRENCY\_LIMITING.md](./CONCURRENCY_LIMITING.md)**
