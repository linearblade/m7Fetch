← Back to [README](../../README.md)

# m7Fetch — Usage Guide (Table of Contents)

## 1) [Introduction & Requirements](./INTRODUCTION.md)

* What m7Fetch is, supported runtimes (browser/ESM/Node), and when to use `Net` vs. bare `HTTP`.
* Key features at a glance: HTTP client, OpenAPI/custom specs, dynamic modules, batch/coordination.

## 2) [Installation](./INSTALLATION.md)

* Getting the source into your project; recommended folder layout (alongside M7BootStrap).
* Minimal sanity check: instantiate `Net` and perform a simple GET.

## 3) [Quick Start](./QUICK_START.md)

* Create a `Net` instance.
* Make a GET and POST request.
* Load an OpenAPI spec and call an operation by `operationId`.
* Dynamically import a JS module via `Net.modules`.

## 4) [Core Concepts](./BASIC_CONCEPTS.md)

* **Net hub:** composition of `http`, `specs`, `modules`, and `batch`.
* **HTTP client:** base URL resolution, JSON/urlencoded bodies, response formats.
* **Specs:** load OpenAPI/custom specs; dispatch by `operationId`.
* **Modules:** dynamic imports with simple registry.
* **Batch/Sync loaders:** coordinate many requests with concurrency control.

## 5) [Core API Overview](./CORE_API/OVERVIEW.md)

* `class Net(opts)` — constructor, subsystems, and lifecycle.
* `class HTTP` — methods, option parsing, and response formats.
* `specs.load(...)` / `specs.call(...)` — loading and invoking operations.
* `modules.load(id, url)` — registering & importing modules.
* `batch.run(loadList, onLoad, onFail, { awaitAll, limit })` — orchestration entrypoint.

## 6) [HTTP: Requests & Responses](./HTTP_GUIDE.md)

* Methods: `get`, `post`, `put`, `patch`, `delete`, `head`, `options`.
* Building URLs (base vs. absolute), headers, query params.
* Bodies: JSON, URL-encoded, FormData, text, blobs.
* Response formats: `body` | `full` | `raw`; parsing JSON/text/blob.
* Timeouts and AbortController notes.

## 7) [Configuration & Defaults](./CONFIGURATION_AND_DEFAULTS.md)

* Per-instance vs. per-request options; merge behavior.
* `HTTP.FETCH_DEFAULTS` — extending global defaults (e.g., credentials, mode).
* Allowed fetch enums: `mode`, `cache`, `credentials`, `redirect`, `referrerPolicy`, etc.

## 8) [SpecManager (APIs via Specs)](./SPEC_MANAGER.md)

* Loading specs from URL, inline objects, or typed loaders.
* Calling operations by `operationId`; method/path resolution.
* Inferring request/response options from spec metadata.

## 9) [AutoLoader (Detect & Load Spec Types)](./AUTOLOADER.md)

* Dispatch by spec type (`x-type`/conventions); GET vs. POST with payload.
* How options propagate to HTTP layer.

## 10) [Modules (Dynamic JS Imports)](./MODULES.md)

* Registering modules by ID and URL; accessing exports.
* Caching/invalidations; error handling patterns.

## 11) [Batching & Coordination](./BATCHING_AND_COORDINATION.md)

* `BatchLoader.run(...)`: ID-keyed jobs, concurrency limit, `{ awaitAll, limit }` behavior.
* Failure semantics: only `false` marks a request as failed.
* `context[id]` result storage; when to use custom handlers.
* `SyncLoader`: `require()`, `wrapper()`, `loaded()/failed()/success()` states.
* Writing custom batch handlers (store/validate/transform).

## 12) [Authentication, Headers & Security](./AUTHENTICATION_AND_SECURITY.md)

* Passing headers (e.g., `Authorization`) and credential modes.
* CORS considerations; origin and cookie handling.

## 13) [Error Handling & Debugging](./ERROR_HANDLING_AND_DEBUGGING.md)

* Choosing `format: "full"` for status/headers/body.
* Preflight validation: duplicate IDs, unsupported methods.
* Using a debug logger/hook during development.

## 14) [Concurrency Limiting](./CONCURRENCY_LIMITING.md)

* Built-in limiter used by BatchLoader.
* Tuning `limit` and tradeoffs (throughput vs. back-pressure).

## 15) [Examples Library](./EXAMPLES_LIBRARY.md)

* Plain HTTP usage: GET/POST with `full` responses.
* OpenAPI spec load + `operationId` call.
* Custom batch handler (validate/store/transform).
* Dynamic module load and invocation.

## 16) [Troubleshooting](./TROUBLESHOOTING.md)

* Common pitfalls and fixes:

  * Duplicate batch IDs
  * Invalid/unsupported HTTP methods
  * Missing or mismatched spec type
  * Non-object spec payloads
  * Interpreting `false` correctly in handlers

## 17) [Glossary](./GLOSSARY.md)

* `Net`, `HTTP`, `SpecManager`, `AutoLoader`, `ModuleManager`, `BatchLoader`, `SyncLoader`, `FETCH_DEFAULTS`, `format`.

## 18) [License & Use Policy](../USE_POLICY.md)

* MTL-10 summary: permitted vs. restricted use.

## 19) [AI Disclosure](../AI_DISCLOSURE.md)

* Scope of AI assistance for docs/code and review process.

## 20) [Changelog](../CHANGELOG.md)

* Versioned changes (API additions, behavior tweaks, deprecations).
