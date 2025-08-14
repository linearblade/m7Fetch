← Back to [Usage Guide Index](TOC.md)

# HTTP: Requests & Responses

This guide covers the **HTTP** client built into **m7Fetch**. It provides small, predictable helpers around `fetch` with sane defaults, flexible bodies, and selectable response formats.

---

## Quick Reference

* **Methods:** `get`, `post`, `put`, `patch`, `delete`, `head`, `options`
* **Response formats:**

  * `format: "body"` → *parsed body only* (default)
  * `format: "full"` → `{ ok, status, headers, body }`
  * `format: "raw"`  → native `Response`
* **Bodies:** `Object` (JSON), `URLSearchParams` / `urlencoded: true`, `FormData`, `Blob`, `ArrayBuffer`, `string`
* **Base URL:** set at `new Net({ url })`; override per call with `absolute: true`
* **Timeout & Abort:** `timeout: ms` (AbortController) and/or `signal`

---

## Creating an HTTP context

```js
import Net from "./vendor/m7Fetch/src/index.js";

// Instance-level defaults (propagate to requests)
const net = new Net({
  url: "https://api.example.com",        // base URL (optional)
  headers: { "x-app": "demo" },        // default headers
  // You can also provide protocol/host/port instead of url
});
```

---

## Making requests

### GET

```js
const conf = await net.http.get("/config", { format: "full" });
if (conf.ok) console.log(conf.body);
```

### POST (JSON)

```js
const res = await net.http.post("/save", { a: 1, b: 2 }, { format: "full" });
console.log(res.status, res.body);
```

### POST (URL-encoded)

```js
const login = await net.http.post("/login", { user: "u", pass: "p" }, {
  urlencoded: true,            // encodes body as application/x-www-form-urlencoded
  format: "full",
});
```

### PUT / PATCH / DELETE

```js
await net.http.put("/items/42", { name: "New" });
await net.http.patch("/items/42", { name: "Partial" });
await net.http.delete("/items/42");
```

### HEAD / OPTIONS

```js
const head = await net.http.head("/resource", { format: "full" });
console.log(head.status, [...head.headers.entries()]);

const opt = await net.http.options("/resource", { format: "full" });
```

---

## Request options (per call)

| Option       | Type          | Default | Purpose                                                            |          |                           |
| ------------ | ------------- | ------- | ------------------------------------------------------------------ | -------- | ------------------------- |
| `format`     | \`"body"      | "full"  | "raw"\`                                                            | `"body"` | Shape of the return value |
| `headers`    | `object`      | `{}`    | Extra headers to merge for this call                               |          |                           |
| `absolute`   | `boolean`     | `false` | If `true`, bypass instance base URL and use the path as-is         |          |                           |
| `timeout`    | `number` (ms) | `null`  | Aborts request after the given time (if AbortController available) |          |                           |
| `signal`     | `AbortSignal` | —       | Pass your own signal to cancel                                     |          |                           |
| `json`       | `boolean`     | `true`  | For body methods: auto-JSON encode objects & parse JSON responses  |          |                           |
| `urlencoded` | `boolean`     | `false` | For body methods: send as `application/x-www-form-urlencoded`      |          |                           |

> **Tip:** You can still pass `FormData`, `URLSearchParams`, `Blob`, `ArrayBuffer`, or a raw `string` as the body — set `json:false` or let the client infer.

---

## Instance defaults (constructor)

When you create `Net`, you can supply defaults used by all HTTP calls:

```js
const net = new Net({
  // URL building
  url: "https://api.example.com",   // or { protocol, host, port }

  // Default headers
  headers: { Authorization: "Bearer <token>" },

  // You can also set fetch-related defaults via subclassing (see below)
});
```

### Extending fetch defaults (advanced)

If you need to set global fetch options (e.g., `credentials`, `mode`) project-wide, you can subclass HTTP to override `FETCH_DEFAULTS`, then plug that into a custom `Net` (or modify the provided class if your setup allows it):

```js
import HTTP from "./vendor/m7Fetch/src/core/HTTP.js";

class MyHTTP extends HTTP {
  static FETCH_DEFAULTS = {
    credentials: "include",
    mode: "cors",
  };
}
```

---

## Query strings & URLs

The HTTP layer does not invent a separate `query` option — build query strings with standard tools:

```js
// Simple
await net.http.get("/search?q=" + encodeURIComponent("dogs"));

// Using URLSearchParams
const qs = new URLSearchParams({ q: "dogs", limit: 20 }).toString();
await net.http.get(`/search?${qs}`);
```

> **Absolute paths:** set `absolute: true` to bypass the base URL entirely.

---

## Handling responses

### 1) `format: "body"` (default)

```js
const data = await net.http.get("/config"); // returns parsed body only
```

### 2) `format: "full"`

```js
const res = await net.http.get("/config", { format: "full" });
// res = { ok, status, headers, body }
if (!res.ok) {
  console.error("Request failed:", res.status, res.body);
}
```

### 3) `format: "raw"`

```js
const resp = await net.http.get("/image", { format: "raw" });
const blob = await resp.blob();
```

---

## Files & binary data

### Upload via `FormData`

```js
const fd = new FormData();
fd.append("file", fileInput.files[0]);
const up = await net.http.post("/upload", fd, { format: "full" });
```

### Download as Blob / ArrayBuffer

```js
const raw = await net.http.get("/file.bin", { format: "raw" });
const buf = await raw.arrayBuffer();
```

---

## Timeouts & Abort

```js
// Timeout (ms)
const slow = await net.http.get("/slow", { format: "full", timeout: 5000 });

// Manual abort
const ctrl = new AbortController();
const p = net.http.get("/stream", { format: "raw", signal: ctrl.signal });
ctrl.abort();
try { await p; } catch (e) { console.warn("aborted", e); }
```

---

## Headers & auth

```js
// Per request
await net.http.get("/me", { headers: { Authorization: "Bearer <token>" } });

// Instance-wide defaults (constructor)
const net = new Net({ headers: { Authorization: "Bearer <token>" } });
```

> **Cookies:** For cross-site cookies, ensure server `Set-Cookie` uses `SameSite=None; Secure`, and send requests with `credentials: "include"` (see advanced fetch defaults).

---

## Error handling patterns

* Prefer `format: "full"` during development to inspect `status` and `body` on errors.
* Treat non-2xx as errors in your app logic; the client won’t throw just because `status >= 400`.
* Log structured info (endpoint, status, body excerpt) for observability.

```js
const res = await net.http.get("/thing", { format: "full" });
if (!res.ok) {
  console.error({ route: "/thing", status: res.status, msg: res.body?.message });
}
```

---

## Security notes

* **CORS:** Align origins or configure server CORS headers appropriately.
* **Credentials:** If you rely on cookies, use `credentials: "include"` and secure cookie settings.
* **Remote input:** Treat responses as untrusted; validate before using.

---

## Gotchas & tips

* **Base URL vs absolute:** Relative paths are prefixed by the instance `url`. Use `absolute: true` to bypass.
* **URL-encoded bodies:** Set `{ urlencoded: true }` when the server expects form encoding.
* **Binary/text mix:** Use `format: "raw"` to decide how to parse (e.g., `blob()`, `arrayBuffer()`).
* **Observability:** Consider wrapping calls to standardize logs and error shapes.

---

## Roadmap hooks (where this will grow)

* HTTP/2 hints (when supported by environment)
* Streaming helpers (ReadableStream pipelines)
* Retry/backoff utilities

---

## See also

* **[BASIC\_CONCEPTS.md](./BASIC_CONCEPTS.md)** — how HTTP fits into the `Net` hub.
* **[CORE\_API\_HTTP.md](./CORE_API_HTTP.md)** — full method signatures and option types.
* **[BATCHING\_AND\_COORDINATION.md](./BATCHING_AND_COORDINATION.md)** — orchestrating many requests.
