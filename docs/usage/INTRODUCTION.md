← Back to [Usage Guide Index](TOC.md)

# INTRODUCTION

Welcome to **m7Fetch** — a lightweight, modular network toolkit for modern JavaScript apps. It provides a unified hub for HTTP requests, OpenAPI/custom **spec** calls, dynamic **module** loading, and **batch** coordination with built‑in concurrency control. Use it on its own, or pair it with **[M7BootStrap](https://github.com/linearblade/m7bootstrap)** as the default network layer.

---

## What is m7Fetch?

**m7Fetch** centers on a `Net` class that composes four small subsystems:

* **HTTP** — ergonomic GET/POST helpers, flexible body/response formats, base‑URL handling, and timeouts.
* **Specs** — load OpenAPI (or custom) specs and call operations by `operationId`.
* **Modules** — dynamically `import()` JavaScript modules at runtime and access their exports.
* **Batch / Sync** — submit many HTTP jobs, coordinate completion, and apply per‑item handlers with concurrency limits.

Design goals: *fewer assumptions, more control*, minimal boilerplate, and clean composition.

---

## Key Features (at a glance)

* **Unified network hub**: `net.http`, `net.specs`, `net.modules`, `net.batch` under one instance.
* **Developer‑friendly HTTP**: `json`/`urlencoded` helpers; choose `format: "body" | "full" | "raw"` for responses.
* **Spec‑driven API calls**: load a spec, then call `operationId` without hand‑coding endpoints.
* **Dynamic module loader**: fetch and register modules by id/URL; access their exports directly.
* **Batch orchestration**: ID‑keyed jobs, per‑request handlers, and a concurrency limiter (`limit`).
* **Clear failure semantics**: in batch flows, returning `false` from a handler marks the item as failed.

---

## When should I use it?

Use **m7Fetch** when you need one or more of the following:

* A compact HTTP client with predictable request/response shaping.
* To call APIs described by OpenAPI (or similar) *without* scaffolding a full SDK.
* On‑the‑fly module loading (tools, scenes, plugins) in browser runtimes.
* Coordinating many parallel HTTP requests with per‑item validation and shared completion handling.

Pair with **[M7BootStrap](https://github.com/linearblade/m7bootstrap)** if your app also needs package/asset lifecycle management and DOM mounting.

---

## Supported Environments

* **ES module–capable runtimes** (browser or server).
* Works great in browser apps; for server runtimes, ensure a WHATWG‑compatible `fetch` is available.

---

## Core Building Blocks

* **`class Net`** — creates a hub with `http`, `specs`, `modules`, and `batch`.
* **`HTTP`** — request helpers (`get/post/put/patch/delete/head/options`), base URL resolution, headers, body parsers.
* **`SpecManager`** — `load()` specs and `call(apiId, operationId, params)`.
* **`ModuleManager`** — `load(id, url)` dynamic imports and registry access.
* **`BatchLoader` / `SyncLoader`** — run multiple jobs with `{ awaitAll, limit }`, coordinate completion, and inspect results.

---

## Hello, Net (two‑minute tour)

```js
import Net from "./vendor/m7Fetch/src/index.js"; // or your module path

const net = new Net();

// 1) Plain HTTP
const conf = await net.http.get("/config.json", { format: "full" });
console.log(conf.status, conf.body);

// 2) Load an OpenAPI spec & call an operation by operationId
await net.specs.load("/specs/pets.json");
const pets = await net.specs.call("petsAPI", "listPets", { query: { limit: 10 } });

// 3) Dynamically load a module
const math = await net.modules.load("mathTools", "/modules/math.js");
console.log(math.add(2, 3));

// 4) Batch multiple requests with a concurrency limit
const { sync, results } = await net.batch.run([
  { id: "cfg",  url: "/config.json",        opts: { format: "full" } },
  { id: "lang", url: "/i18n/en.json",       opts: { format: "full" } },
  { id: "ping", url: "/health",             opts: { format: "full" } },
],
  (prepend, last) => console.log("✅ all done", Object.keys(prepend.context)),
  (prepend, last) => console.warn("⚠️ one or more failed"),
  { awaitAll: true, limit: 8 }
);
```

---

## What m7Fetch is *not*

* A batteries‑included framework — it’s an **atomic toolkit** you compose.
* An SDK generator — it calls spec operations dynamically; it doesn’t emit client code.
* A global state manager — instances are explicit and local to your app.

---

## Project Notes

* **License:** Moderate Team License (MTL‑10). See the project’s license and use policy for details.
* **Security:** Treat remote modules and specs as untrusted input. Apply CSP/SRI and restrict origins as needed.
* **Philosophy:** keep surfaces small, avoid hidden magic, and make failure modes explicit.

---

## What’s next

* Start with **[QUICK\_START.md](./QUICK_START.md)** — install and run your first calls.
* Then read **[BASIC\_CONCEPTS.md](./BASIC_CONCEPTS.md)** — core ideas and building blocks.
* Finish with **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** — request/response formats and options.
