← Back to [Usage Guide Index](TOC.md)

# BASIC\_CONCEPTS

This page introduces the core building blocks of **m7Fetch** and how they fit together. Skim it once before diving into API details.

---

## 1) The `Net` Hub

`Net` composes four small subsystems you’ll use every day:

* **`net.http`** — Low‑friction HTTP client with base URL handling, flexible bodies, and selectable response formats.
* **`net.specs`** — Load API specs (e.g., OpenAPI) and call operations by `operationId`.
* **`net.modules`** — Dynamically import JS modules and access their exports.
* **`net.batch`** — Run multiple HTTP requests concurrently with per‑item handlers.

**Create it:**

```js
import Net from "./vendor/m7Fetch/src/index.js";
const net = new Net({
  // url: "https://api.example.com",  // optional base URL
  // headers: { Authorization: "Bearer <token>" },
});
```

---

## 2) HTTP in a Nutshell

**Goal:** make requests predictable and ergonomic without hiding fetch semantics.

* **Methods:** `get`, `post`, `put`, `patch`, `delete`, `head`, `options`.
* **Bodies:**

  * Objects → JSON by default (`Content-Type: application/json`).
  * `urlencoded: true` → form encoding.
  * Also supports `FormData`, `URLSearchParams`, `Blob`, `ArrayBuffer`, or plain strings.
* **Response Formats:** choose what you want back:

  * `format: "body"` → parsed body only (default)
  * `format: "full"` → `{ ok, status, headers, body }`
  * `format: "raw"` → native `Response`
* **Base URL & absolute paths:**

  * Configure `new Net({ url: "https://..." })` to prefix relative paths.
  * Use `absolute: true` per request to bypass the base URL.
* **Timeout & Abort:**

  * `timeout: ms` to abort via `AbortController` (if available in your runtime).
  * Or pass your own `signal` directly.

**Examples:**

```js
await net.http.get("/config", { format: "full" });
await net.http.post("/save", { a: 1 }, { format: "full" });
await net.http.post("/login", { user: "u", pass: "p" }, { urlencoded: true, format: "full" });
```

---

## 3) Specs: Call APIs by `operationId`

**Load once, then call.** Useful when you have an OpenAPI (or similar) description.

* **Load:** `await net.specs.load(urlOrObject, { id?: "apiId" })`
* **Call:** `await net.specs.call(apiId, operationId, { path, query, headers, body, format })`
* **Parameters:** pass only the groups needed by the operation (e.g., `query` and `path`).
* **Return shape:** controlled with `format` just like HTTP.

**Example:**

```js
await net.specs.load("/specs/pets.json", { id: "petsAPI" });
const res = await net.specs.call("petsAPI", "listPets", { query: { limit: 10 }, format: "full" });
```

---

## 4) AutoLoader (Spec Type Detection)

When you call `specs.load(...)`, **AutoLoader** can infer how to fetch/parse based on type hints (e.g., `x-type`) or payload form.

* Supports GET or POST retrieval of specs.
* For custom formats, supply options that the loader forwards to HTTP.

---

## 5) Modules: Dynamic Imports

Fetch a JS module at runtime, register it by ID, and get its exports.

* **Load:** `const mod = await net.modules.load("id", "/modules/tool.js");`
* **Access:** `mod.fn(...)` directly from the returned namespace.
* **Caching:** modules are cached by ID; define your own invalidation policy at call‑sites if needed.

**Example:**

```js
const math = await net.modules.load("mathTools", "/modules/math.js");
console.log(math.add(2, 3));
```

---

## 6) Batch & Coordination

**Run many requests** at once and coordinate completion.

* **Signature:**

  ```js
  const { sync, results } = await net.batch.run(loadList, onLoad, onFail, { awaitAll: true, limit: 8 });
  ```
* **`loadList` items:**

  ```js
  {
    id: "cfg",                 // unique ID (required)
    method: "get" | "post",    // default: "get"
    url: "/api/config",        // required
    opts: { format: "full" },   // per-request HTTP options
    data: { ... },               // POST/PUT/PATCH body (optional)
    handler: (res) => any,       // optional transform/validation
  }
  ```
* **Failure semantics:** only a handler returning **`false`** marks that item as failed.
* **Storage:** handler outputs are stored in an internal `context[id]`; when `awaitAll: true`, you also get a `results` map.
* **Concurrency:** use `{ limit }` to cap concurrent fetches.

**Example:**

```js
await net.batch.run(
  [
    { id: "cfg",  url: "/config",   opts: { format: "full" } },
    { id: "lang", url: "/i18n/en",  opts: { format: "full" } },
  ],
  (prepend) => console.log("done:", Object.keys(prepend.context)),
  (prepend) => console.warn("had failures"),
  { awaitAll: true, limit: 8 }
);
```

---

## 7) SyncLoader (Under the Hood)

`BatchLoader` uses a small coordinator:

* **`require(ids)`** — declare IDs to wait on.
* **`wrapper(id, handler)`** — wraps a promise callback; if `handler` returns `false`, that ID is marked failed.
* **`loaded()` / `failed()` / `success()`** — check states; `success() === !failed()`.
* **Callbacks:** when all required IDs complete, `onLoad` fires; if any failed and an `onFail` was provided, it fires instead.

---

## 8) Configuration & Defaults

* **Per‑instance defaults:** set on `new Net({ ... })` and inherited by requests.
* **Per‑request overrides:** pass options directly in each call (`format`, `headers`, `timeout`, `absolute`, etc.).
* **Fetch enums:** allowed values for `mode`, `cache`, `credentials`, `redirect`, `referrerPolicy`, etc., follow the WHATWG fetch spec.
* **Global defaults:** extendable via `HTTP.FETCH_DEFAULTS` (advanced).

---

## 9) Error Handling & Debugging

* Prefer `format: "full"` during development to inspect `{ ok, status, headers, body }`.
* Batch preflight checks will throw on **duplicate IDs** or **unsupported methods**.
* Add your own logging wrapper or hook around calls; keep responses structured for observability.

---

## 10) Security Notes

* **CORS / cookies:** match origins or configure appropriate CORS headers; for cookies use `credentials: "include"` and proper server `SameSite` settings.
* **Remote modules/specs:** treat as untrusted; apply CSP/SRI and scope allowed origins.

---

## 11) Glossary (quick)

* **`Net`** — the root object combining HTTP, Specs, Modules, and Batch.
* **`HTTP`** — request helper with base URL logic and response shaping.
* **`SpecManager`** — loads specs and calls operations by `operationId`.
* **`AutoLoader`** — dispatches spec loading logic by type/conventions.
* **`ModuleManager`** — dynamic JS import registry by ID.
* **`BatchLoader`** — runs multiple HTTP jobs, stores results by ID.
* **`SyncLoader`** — minimal coordinator used by BatchLoader.

---

## Next Steps

* Explore **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** for detailed request/response options.
* See **[SPEC\_MANAGER.md](./SPEC_MANAGER.md)** and **[AUTOLOADER.md](./AUTOLOADER.md)** to go deeper into spec‑driven calls.
* Check **[BATCHING\_AND\_COORDINATION.md](./BATCHING_AND_COORDINATION.md)** for advanced batching patterns.
