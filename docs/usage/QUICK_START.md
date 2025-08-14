← Back to [Usage Guide Index](TOC.md)

# QUICK\_START

This Quick Start gets you from **zero → first requests** using **m7Fetch**. You’ll:

* Create a `Net` instance
* Make basic HTTP calls
* Load an OpenAPI spec and call by `operationId`
* Dynamically import a JS module
* Batch multiple requests with a concurrency limit

> Works in any ESM environment (browser or Node 18+). For older Node, add a `fetch` polyfill (see **INSTALLATION.md**).

---

## 1) Create a Net instance

```js
import Net from "./vendor/m7Fetch/src/index.js"; // adjust path as needed

const net = new Net({
  // optional base settings for HTTP
  // headers: { Authorization: "Bearer <token>" },
  // url: "https://api.example.com", // base URL
});
```

---

## 2) First HTTP calls

### GET (JSON)

```js
const res = await net.http.get("/api/config", { format: "full" });
if (res.ok) {
  console.log("config:", res.body);
} else {
  console.error("failed:", res.status, res.body);
}
```

### POST (JSON)

```js
const save = await net.http.post("/api/save", { a: 1, b: 2 }, { format: "full" });
console.log(save.status, save.body);
```

### POST (URL-encoded)

```js
const login = await net.http.post("/api/login", { user: "u", pass: "p" }, {
  urlencoded: true,
  format: "full",
});
console.log(login.ok, login.status);
```

> **Tip:** `format` controls the return shape:
>
> * `"body"` → parsed body only (default)
> * `"full"` → `{ ok, status, headers, body }`
> * `"raw"` → native `Response`

---

## 3) Load a spec and call by `operationId`

Load once, then call by `apiId` + `operationId` with parameters.

```js
// Load an OpenAPI (or compatible) spec
await net.specs.load("/specs/pets.json", { id: "petsAPI" });

// Call by operationId
const pets = await net.specs.call("petsAPI", "listPets", {
  // Optional parameter groups (use what your spec expects)
  path:   { ownerId: "123" },
  query:  { limit: 10 },
  headers:{ "x-trace": "abc" },
  body:   { include: ["name", "type"] },
  format: "full",
});

console.log(pets.status, pets.body);
```

---

## 4) Dynamically load a JS module

Register and import modules by id → get a live namespace back.

```js
const math = await net.modules.load("mathTools", "/modules/math.js");
console.log("2 + 3 =", math.add(2, 3));
```

---

## 5) Batch multiple requests (with concurrency limit)

Run a batch of HTTP jobs, each with an `id`. Only a handler returning **`false`** marks an item as failed.

```js
const { sync, results } = await net.batch.run(
  [
    { id: "cfg",  url: "/api/config",     opts: { format: "full" } },
    { id: "lang", url: "/i18n/en.json",   opts: { format: "full" } },
    { id: "ping", url: "/health",         opts: { format: "full" } },
  ],
  // onLoad (fires when all required items completed)
  (prepend, lastResult) => {
    console.log("✅ batch complete:", Object.keys(prepend.context));
  },
  // onFail (fires if any handler returned false)
  (prepend, lastResult) => {
    console.warn("⚠️ batch had failures");
  },
  { awaitAll: true, limit: 8 }
);

// If you need each result by id later:
// results.cfg, results.lang, results.ping
```

**Add per-item handlers** (transform/validate/store):

```js
await net.batch.run(
  [
    {
      id: "profile",
      url: "/api/me",
      opts: { format: "full" },
      handler: (res) => {
        if (!res.ok) return false; // mark this item failed
        // (optional) transform before storage
        return { user: res.body.user, roles: res.body.roles };
      },
    },
  ],
  () => console.log("done"),
  () => console.warn("some failed")
);
```

> **Note:** Batch stores handler outputs under `context[id]` and returns a `results` map when `awaitAll: true`.

---

## 6) Timeouts & Abort (optional)

Use `timeout` and/or pass an `AbortSignal` if your runtime supports it.

```js
// Timeout example (creates an abort signal for you and intalls it)
const slow = await net.http.get("/slow", { format: "full", timeout: 5000 });

// Abort example - inject your own
const ctrl = new AbortController();
const p = net.http.get("/stream", { format: "raw", signal: ctrl.signal });
ctrl.abort();
try {
  await p;
} catch (e) {
  console.warn("aborted", e);
}
```

---

## 7) Troubleshooting (quick)

* **CORS / cookies** → match origins or set proper CORS headers; for cookies use `credentials: "include"`.
* **Batch duplicate id** → each item’s `id` must be unique.
* **Unexpected failure in batch** → ensure your handler doesn’t return `false` for valid bodies (e.g., literal `false`). Wrap as an object if needed.
* **Old Node** → add a WHATWG `fetch` polyfill (see **INSTALLATION.md**).

---

## 8) Next steps

* Read **[BASIC\_CONCEPTS.md](./BASIC_CONCEPTS.md)** for the building blocks.
* Explore **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** for request/response options.
* See **[EXAMPLES\_LIBRARY.md](./EXAMPLES_LIBRARY.md)** for copy‑paste recipes.
* Pair with **M7BootStrap** (optional): [https://github.com/linearblade/m7bootstrap](https://github.com/linearblade/m7bootstrap)
