← Back to [Usage Guide Index](TOC.md)

# TROUBLESHOOTING

Quick fixes for common issues when using **m7Fetch** (HTTP, Specs, Modules, Batch/Sync). Use this as a first‑response playbook.

---

## Index

* [HTTP Requests](#http-requests)
* [SpecManager](#specmanager)
* [Modules (Dynamic Imports)](#modules-dynamic-imports)
* [Batching & Coordination](#batching--coordination)
* [Auth, Cookies, and CORS](#auth-cookies-and-cors)
* [Node / Environment](#node--environment)
* [Diagnostics & Logging Recipes](#diagnostics--logging-recipes)

---

## HTTP Requests

### Symptom: **CORS error** in console

**Likely cause**: Server doesn’t allow your origin or headers.
**Fix**:

* Ensure server sends `Access-Control-Allow-Origin` with your app’s origin (or `*` without credentials).
* If using cookies: also send `Access-Control-Allow-Credentials: true`.
* Include required `Access-Control-Allow-Headers` and `-Methods` for preflights.

### Symptom: **Cookies not sent**

**Likely cause**: Missing `credentials: "include"` and/or cookie flags disallow cross‑site.
**Fix**:

```js
await net.http.get("/me", { format: "full", credentials: "include" });
```

* Server cookies must include `SameSite=None; Secure` for cross‑site.

### Symptom: **Unexpected base URL used**

**Likely cause**: You set `new Net({ url: "https://api.example.com" })` and called a relative path.
**Fix**:

* Use `absolute: true` for fully‑qualified URLs you don’t want prefixed:

```js
await net.http.get("https://other.example.com/ping", { absolute: true });
```

### Symptom: **Body parsing or 415 Unsupported Media Type**

**Likely cause**: Wrong encoding.
**Fix**:

* JSON: pass objects (default), or `json:true` explicitly.
* Form posts: `{ urlencoded: true }`.
* Files/binary: use `FormData`, `Blob`, or `ArrayBuffer`.

### Symptom: **Binary/text mix ups**

**Fix**: Use `format: "raw"` and parse manually (`blob()`, `arrayBuffer()`).

### Symptom: **Timeouts / hanging requests**

**Fix**:

```js
await net.http.get("/slow", { format: "full", timeout: 5000 });
```

Or provide/cancel your own `AbortSignal`.

### Symptom: **JSON parse error**

**Likely cause**: Server returned HTML/error instead of JSON while `json:true`.
**Fix**: Use `format:"full"` and inspect `status` and raw body; handle non‑JSON with `format:"raw"` as needed.

---

## SpecManager

### Symptom: **`operationId` not found**

**Fix**: Verify the `operationId` in the spec and your call. Confirm you loaded the right spec `id`.

### Symptom: **404/incorrect URL when calling**

**Likely cause**: Missing `path` params.
**Fix**:

```js
await net.specs.call("petsAPI", "getPet", { path: { petId: "p-42" } });
```

### Symptom: **Wrong encoding on operation**

**Fix**: Add `{ urlencoded:true }` or pass `FormData/Blob` explicitly according to the spec’s content type.

### Symptom: **Spec fails to load (CORS/401/403)**

**Fix**: Load with appropriate headers/credentials:

```js
await net.specs.load("/specs/resolve", { id:"api", headers:{ Authorization:`Bearer ${t}` }, credentials:"include", format:"full" });
```

---

## Modules (Dynamic Imports)

### Symptom: **"Cannot use import statement outside a module"**

**Likely cause**: Served as non‑ESM / wrong MIME.
**Fix**: Ensure the file is ESM and served with a JS MIME type.

### Symptom: **CORS or 404 on module**

**Fix**: Serve on same origin or enable CORS; verify path and dev‑server static roots.

### Symptom: **Module updates don’t reflect**

**Likely cause**: Browser import cache.
**Fix**: Version the URL (`/module.js?v=2`) or change filename (hash).

---

## Batching & Coordination

### Symptom: **Batch throws before starting**

**Likely cause**: Duplicate `id` or invalid `method` in `loadList`.
**Fix**: Ensure unique `id`s and `method` ∈ {`get`,`post`}.

### Symptom: **Batch marks unexpected failure**

**Likely cause**: Handler returned literal `false` (or default handler saw `!res.ok`).
**Fix**: Only return `false` for *actual* failure; wrap boolean bodies:

```js
handler: (res) => (res.body === false ? { ok:true, body:false } : res)
```

### Symptom: **No results stored**

**Likely cause**: Using `batchNone` without storing.
**Fix**: Write to `obj.context[id]` inside your custom handler, or use `batchStore/batchStatus`.

### Symptom: **UI needs progress updates**

**Fix**: Use `awaitAll:false` and poll `sync.loaded()` / `sync.controller.run`.

---

## Auth, Cookies, and CORS

### Symptom: **401/403**

**Fix**: Add/refresh `Authorization` header or enable cookies via `credentials:"include"`. Check token audience/scope.

### Symptom: **Preflight (OPTIONS) fails**

**Fix**: Server must allow your method/headers and respond with appropriate `Access-Control-*` headers.

### Symptom: **Cookies not persisted**

**Fix**: Ensure `SameSite=None; Secure` for cross‑site. Avoid third‑party cookie blocks in browsers by serving API on the same site when possible.

---

## Node / Environment

### Symptom: **`fetch` is not defined** (older Node)

**Fix**: Install a WHATWG fetch polyfill (e.g., `undici`) and set globals:

```js
import { fetch, Headers, Request, Response } from "undici";
Object.assign(globalThis, { fetch, Headers, Request, Response });
```

### Symptom: **ESM import errors**

**Fix**: Use ESM (`"type":"module"` in package.json or `.mjs` files). Ensure import paths point to ESM sources.

### Symptom: **Mixed content blocked**

**Fix**: Use HTTPS for API endpoints when your app is served over HTTPS.

---

## Diagnostics & Logging Recipes

### 1) Inspect full responses

```js
const r = await net.http.get("/route", { format: "full" });
console.log(r.status, r.headers, r.body);
```

### 2) Standardize error logs

```js
async function call(route, fn) {
  try {
    const res = await fn();
    if (res?.ok === false) console.warn({ route, status: res.status, msg: res.body?.message });
    return res;
  } catch (e) {
    console.error({ route, err: String(e) });
    throw e;
  }
}
```

### 3) Batch failure IDs

```js
(prepend) => {
  const failed = Object.keys(prepend.controller.fail);
  console.warn("batch failed", failed);
}
```

### 4) Progress polling (streaming)

```js
const { sync } = await net.batch.run(loadList, null, null, { awaitAll:false, limit:5 });
const total = loadList.length;
const t = setInterval(() => {
  const done = Object.keys(sync.controller.run).length;
  console.log(`${done}/${total}`);
  if (sync.loaded()) clearInterval(t);
}, 100);
```

---

## Quick Checklist

* [ ] Use `format:"full"` to debug status/headers/body.
* [ ] Verify base URL vs `absolute:true`.
* [ ] Confirm CORS headers and cookie flags.
* [ ] Ensure batch `id`s are unique and methods valid.
* [ ] Wrap boolean `false` bodies in batch handlers.
* [ ] For modules, serve ESM with correct MIME and version URLs to bust cache.
* [ ] On Node <18, polyfill `fetch`.
