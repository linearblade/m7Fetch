← Back to [Usage Guide Index](TOC.md)

# EXAMPLES\_LIBRARY

Copy‑paste recipes for common **m7Fetch** tasks. Adjust import paths to match your project.

---

## Index

* [Basic GET (full response)](#basic-get-full-response)
* [POST JSON](#post-json)
* [POST urlencoded (login)](#post-urlencoded-login)
* [Spec: load + call by `operationId`](#spec-load--call-by-operationid)
* [Batch: config/lang/health](#batch-configlanghealth)
* [Batch: custom handler (normalize)](#batch-custom-handler-normalize)
* [Dynamic module load](#dynamic-module-load)
* [File upload (FormData)](#file-upload-formdata)
* [Binary download](#binary-download)
* [Abort & timeout](#abort--timeout)
* [Retry with backoff](#retry-with-backoff)
* [Auth header defaults](#auth-header-defaults)
* [Absolute URL override](#absolute-url-override)
* [Cookies / credentials include](#cookies--credentials-include)
* [Global fetch defaults (subclass)](#global-fetch-defaults-subclass)
* [Progress UI with streaming batch](#progress-ui-with-streaming-batch)
* [Multiple specs side‑by‑side](#multiple-specs-side-by-side)
* [Centralized error/log helper](#centralized-errorlog-helper)

---

## Basic GET (full response)

```js
import Net from "./vendor/m7Fetch/src/index.js";
const net = new Net();

const res = await net.http.get("/config.json", { format: "full" });
if (!res.ok) console.error("config failed", res.status, res.body);
console.log(res.body);
```

## POST JSON

```js
const save = await net.http.post("/api/save", { a: 1, b: 2 }, { format: "full" });
console.log(save.status, save.body);
```

## POST urlencoded (login)

```js
const login = await net.http.post("/api/login", { user: "u", pass: "p" }, {
  urlencoded: true,
  format: "full",
});
console.log(login.ok, login.status);
```

## Spec: load + call by `operationId`

```js
await net.specs.load("/specs/pets.json", { id: "petsAPI" });
const pets = await net.specs.call("petsAPI", "listPets", { query: { limit: 10 }, format: "full" });
console.log(pets.status, pets.body);
```

## Batch: config/lang/health

```js
const { results } = await net.batch.run([
  { id: "cfg",  url: "/config.json", opts: { format: "full" } },
  { id: "lang", url: "/i18n/en.json", opts: { format: "full" } },
  { id: "ping", url: "/health",      opts: { format: "full" } },
],
  (prepend) => console.log("done", Object.keys(prepend.context)),
  (prepend) => console.warn("had failures"),
  { awaitAll: true, limit: 8 }
);
console.log(results.cfg.body);
```

## Batch: custom handler (normalize)

```js
function normalize(obj, id, handler) {
  return (res) => {
    if (res?.ok === false) return false; // mark fail
    const body = res.body ?? res;
    const out = { data: body?.data ?? body, t: Date.now() };
    obj.context[id] = out;
    return out;
  };
}

net.batch.setBatchHandler(normalize);
const { results } = await net.batch.run([
  { id: "a", url: "/a.json", opts: { format: "full" } },
  { id: "b", url: "/b.json", opts: { format: "full" } },
]);
console.log(results.a, results.b);
```

## Dynamic module load

```js
const math = await net.modules.load("mathTools", "/modules/math.js");
console.log("2+3=", math.add(2, 3));
```

## File upload (FormData)

```js
const fd = new FormData();
fd.append("file", fileInput.files[0]);
const up = await net.http.post("/upload", fd, { format: "full" });
console.log(up.status);
```

## Binary download

```js
const resp = await net.http.get("/file.bin", { format: "raw" });
const buf = await resp.arrayBuffer();
```

## Abort & timeout

```js
// Timeout
const slow = await net.http.get("/slow", { format: "full", timeout: 5000 });

// Abort
const ctrl = new AbortController();
const p = net.http.get("/stream", { format: "raw", signal: ctrl.signal });
ctrl.abort();
try { await p; } catch (e) { console.warn("aborted", e.name); }
```

## Retry with backoff

```js
async function retry(fn, tries = 3, base = 200) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { last = e; }
    await new Promise(r => setTimeout(r, base * 2 ** i));
  }
  throw last;
}
const res = await retry(() => net.http.get("/ping", { format: "full" }));
```

## Auth header defaults

```js
const net = new Net({ headers: { Authorization: `Bearer ${token}` } });
const me = await net.http.get("/me", { format: "full" });
```

## Absolute URL override

```js
await net.http.get("https://other.example.com/health", { absolute: true, format: "full" });
```

## Cookies / credentials include

```js
// Per request
await net.http.get("/profile", { format: "full", credentials: "include" });
```

## Global fetch defaults (subclass)

```js
import HTTP from "./vendor/m7Fetch/src/core/HTTP.js";
class MyHTTP extends HTTP {
  static FETCH_DEFAULTS = { credentials: "include", mode: "cors", cache: "no-cache" };
}
```

## Progress UI with streaming batch

```js
const loadList = [ /* items */ ];
const { sync } = await net.batch.run(loadList, null, null, { awaitAll: false, limit: 5 });
const total = loadList.length;
const timer = setInterval(() => {
  const done = Object.keys(sync.controller.run).length;
  console.log(`${done}/${total}`);
  if (sync.loaded()) clearInterval(timer);
}, 100);
```

## Multiple specs side‑by‑side

```js
await net.specs.load("/specs/pets.json",  { id: "petsAPI" });
await net.specs.load("/specs/store.json", { id: "storeAPI" });
const pets  = await net.specs.call("petsAPI",  "listPets");
const order = await net.specs.call("storeAPI", "createOrder", { body: { sku: "X" } });
```

## Centralized error/log helper

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

## See also

* **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** — request/response formats
* **[BATCHING\_AND\_COORDINATION.md](./BATCHING_AND_COORDINATION.md)** — handlers & limits
* **[SPEC\_MANAGER.md](./SPEC_MANAGER.md)** — spec‑driven calls
* **[AUTHENTICATION\_AND\_SECURITY.md](./AUTHENTICATION_AND_SECURITY.md)** — tokens, cookies, CORS
