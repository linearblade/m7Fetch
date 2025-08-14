← Back to [Usage Guide Index](../TOC.md)

# CORE\_API\_OVERVIEW

> Sub‑TOC for the core public APIs of **m7Fetch**. Each entry links to a dedicated page with full method signatures, options, return shapes, and examples.

---

## 1) [NET](./NET.md)

* The top‑level hub that composes the subsystems: **HTTP**, **Specs**, **Modules**, and **Batch**.
* Covers constructor options, lifecycle, and how to pass defaults down to subsystems.

## 2) [HTTP](./HTTP.md)

* Request helpers: `get`, `post`, `put`, `patch`, `delete`, `head`, `options`.
* Request options (base URL, headers, `json`/`urlencoded`, `timeout`, `signal`).
* Response formats: `body` | `full` | `raw`.
* Roadmap slots: **HTTP/2**, streaming, retries/backoff.

## 3) [SPEC\_MANAGER](./SPEC_MANAGER.md)

* `specs.load(source, opts)` and `specs.call(apiId, operationId, args)`.
* Parameter groups (`path`, `query`, `headers`, `body`) and format passthrough.
* Multiple specs, IDs/namespacing, and operation resolution.

## 4) [AUTOLOADER](./AUTOLOADER.md)

* Type inference and dispatch for spec loading (e.g., `x-type`).
* GET/POST retrieval and option forwarding to HTTP.
* Extending with custom loaders.

## 5) [MODULES](./MODULES.md)

* `modules.load(id, url)` returns the module namespace (dynamic `import()`).
* Registry semantics, caching, and invalidation patterns.

## 6) [BATCH\_LOADER](./BATCH_LOADER.md)

* `batch.run(loadList, onLoad, onFail, { awaitAll, limit })`.
* Item schema, handler contract (only **`false`** marks failure).
* Context storage (`context[id]`), concurrency limits, and result maps.

## 7) [SYNC\_LOADER](./SYNC_LOADER.md)

* Minimal coordinator used by BatchLoader.
* `require(ids)`, `wrapper(id, handler)`, `loaded/failed/success`.
* Callback rules and polling patterns.

## 8) [FETCH\_CONSTANTS](./FETCH_CONSTANTS.md)

* Enumerated/validated fetch option sets (e.g., `mode`, `cache`, `credentials`, `referrerPolicy`).
* How validation interacts with `HTTP.FETCH_DEFAULTS`.

## 9) [TYPES\_AND\_REPORTS](./TYPES.md)

* Shapes for HTTP responses (by `format`) and batch results.
* Recommended typings/JSDoc for public methods.
* Future: `.d.ts` bundles.

## 10) [ERRORS](./ERRORS.md)

* Error taxonomy and codes (e.g., `E_BATCH_DUP_ID`, `E_HTTP_UNSUPPORTED_METHOD`).
* Guidance for structured logs and observability.

## 11) [EXTENSIBILITY](./EXTENSIBILITY.md)

* Custom batch handlers, HTTP debug hooks, and spec loader extensions.
* Integration points for metrics/telemetry.

## 12) [VERSIONING\_AND\_COMPAT](./VERSIONING.md)

* API stability policy, deprecation paths, and migration notes.

---

### See also

* **[BASIC\_CONCEPTS.md](./BASIC_CONCEPTS.md)** — narrative overview of how pieces fit together.
* **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** — deeper guidance on requests/responses.
* **[BATCHING\_AND\_COORDINATION.md](./BATCHING_AND_COORDINATION.md)** — patterns & recipes.
