↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_NET

> The top‑level hub that composes **HTTP**, **SpecManager**, **ModuleManager**, and **BatchLoader**. Use `Net` when you want one object that can make raw HTTP calls, load/call API specs, dynamically import modules, and coordinate multiple requests.

---

## Synopsis

```js
import Net from "m7Fetch";

const net = new Net({
  // optional: see "Options & Defaults" for forwarding patterns
});

// 1) Raw HTTP
const res = await net.http.get("/api/ping", { format: "full" });

// 2) Specs: load & call by operationId
await net.specs.load("/specs/pets.json");
const pets = await net.specs.call("pets", "listPets", { query: { limit: 25 } });

// 3) Dynamic modules
const utils = await net.modules.load("utils", "/lib/utils.js");
utils.say("hello");

// 4) Batch/coordination
const { sync, results } = await net.batch.run([
  { id: "cfg",   url: "/cfg.json" },
  { id: "langs", url: "/i18n/en.json" }
], (prepend) => {
  console.log("all set", prepend.context);
});
```

---

## Constructor

### `new Net(opts?)`

Creates a new network hub and its composed subsystems.

* **Parameters**

  * `opts` *(object, optional)* — High‑level options. `Net` forwards relevant pieces into its subsystems. See **Options & Defaults** below.

* **Returns**

  * `Net` instance with properties `{ http, specs, modules, batch }`.

---

## Properties

* **`http`** — Instance of the HTTP client. Provides request helpers: `get`, `post`, `put`, `patch`, `delete`, `head`, `options`. See **HTTP Guide**.
* **`specs`** — SpecManager. Load specs from URL/objects and call operations by `operationId`. See **SpecManager**.
* **`modules`** — ModuleManager. Register & dynamically `import()` modules by ID. See **Modules**.
* **`batch`** — BatchLoader. Coordinate many HTTP requests with ID‑keyed results and concurrency control. See **Batching & Coordination**.

> Tip: You can use the subsystems independently (`net.http.get(...)`) or together (e.g., load a spec then call operations inside a batch job).

---

## Options & Defaults

`Net` acts as a conduit for defaults:

* **HTTP defaults** — Common fetch settings (e.g., credentials mode, cache policy) live in `HTTP.FETCH_DEFAULTS` and per‑instance `http` options. Prefer setting these once at construction time and override per‑request as needed.
* **Spec/Module/Batch options** — Each subsystem documents its own options. Pass them on the calls you make (e.g., `specs.load(source, opts)`, `modules.load(id, url)`, `batch.run(list, onLoad, onFail, { awaitAll, limit })`).

`Net` does not impose global magic; it forwards what you give it and lets subsystems validate.

---

## Usage Patterns

### 1) Raw HTTP with response shapes

```js
// body | full | raw
const bodyOnly = await net.http.get("/data.json", { format: "body" });
const full     = await net.http.get("/data.json", { format: "full" });
```

### 2) Calling an OpenAPI operation

```js
await net.specs.load("/openapi/pets.json");
const data = await net.specs.call("pets", "createPet", {
  body: { name: "Chippy" },
  headers: { "Content-Type": "application/json" },
  format: "full" // forward to HTTP layer
});
```

### 3) Dynamic modules

```js
const math = await net.modules.load("math", "/modules/math.js");
console.log(math.add(2, 3));
```

### 4) Batch with failure semantics

```js
const { sync, results } = await net.batch.run([
  { id: "cfg",   url: "/cfg.json",   opts: { format: "full" } },
  { id: "prefs", url: "/prefs.json", opts: { format: "full" } }
], (prepend) => {
  // called when all finished; even if some failed and no explicit onFail provided
  console.log(prepend.context);
}, (prepend) => {
  // optional: called if any handler returns false
  console.warn("one or more failed");
}, { awaitAll: true, limit: 8 });
```

---

## Error Handling

* Prefer `format: "full"` for visibility into `ok`, `status`, and headers.
* In **BatchLoader**, only a handler that returns **`false`** marks an item as failed. All other return values are considered success and stored in the batch context.

---

## Lifecycle Notes

* `Net` has no special start/stop lifecycle; construct it once and reuse.
* Subsystems are stateless wrappers around the network runtime except for caches/registries they manage (spec registry, module cache, batch context).

---

## Minimal Type Hints (informal)

```ts
class Net {
  http: HTTP;            // request helpers
  specs: SpecManager;    // load()/call()
  modules: ModuleManager;// load(id, url)
  batch: BatchLoader;    // run(list, onLoad?, onFail?, { awaitAll?, limit? })
}
```

---

## Examples

* **Quick GET/POST** — See `HTTP: Requests & Responses`.
* **Spec‑driven API calls** — See `SpecManager`.
* **Coordinated loads** — See `Batching & Coordination`.

---

## See Also

* **HTTP: Requests & Responses**
* **SpecManager (APIs via Specs)**
* **Modules (Dynamic JS Imports)**
* **Batching & Coordination**
