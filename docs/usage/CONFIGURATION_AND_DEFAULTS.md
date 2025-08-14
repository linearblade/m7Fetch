← Back to [Usage Guide Index](TOC.md)

# CONFIGURATION & DEFAULTS

This page explains **where configuration lives**, how defaults are applied, and how request‑level overrides work in **m7Fetch**.

---

## Configuration Layers (precedence)

From lowest → highest precedence:

1. **Runtime defaults** (browser/Node fetch behavior)
2. **`HTTP.FETCH_DEFAULTS`** (class‑level fetch defaults; optional)
3. **`new Net(opts)` instance options** (base URL, headers, etc.)
4. **Per‑request options** (passed to `http.get/post/...` or spec/module/batch helpers)

> The **closest** setting wins. Per‑request options always override instance defaults and class defaults.

---

## Instance Options (`new Net(opts)`)

Set once; inherited by all HTTP requests unless overridden per call.

| Option     | Type     | Purpose                                                              |                                                    |
| ---------- | -------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| `url`      | `string` | Base URL prefix for relative paths (e.g., `https://api.example.com`) |                                                    |
| `protocol` | \`"http" | "https"\`                                                            | Alternative to `url` (combined with `host`/`port`) |
| `host`     | `string` | Hostname if building from parts                                      |                                                    |
| `port`     | `number` | Port if building from parts                                          |                                                    |
| `headers`  | `object` | Default headers merged into every request                            |                                                    |

```js
import Net from "./vendor/m7Fetch/src/index.js";

const net = new Net({
  url: "https://api.example.com",
  headers: { "x-app": "demo" },
});
```

---

## Per‑Request Options (HTTP)

Pass these directly to each call; they override instance settings for that call only.

| Option       | Type          | Default | Notes                                                      |          |                                                            |
| ------------ | ------------- | ------- | ---------------------------------------------------------- | -------- | ---------------------------------------------------------- |
| `format`     | \`"body"      | "full"  | "raw"\`                                                    | `"body"` | Output shape: body only, rich object, or native `Response` |
| `headers`    | `object`      | `{}`    | Merged with instance headers                               |          |                                                            |
| `absolute`   | `boolean`     | `false` | Use path as‑is (ignore instance base `url`)                |          |                                                            |
| `timeout`    | `number(ms)`  | `null`  | Aborts via `AbortController` (if available)                |          |                                                            |
| `signal`     | `AbortSignal` | —       | Custom cancellation signal                                 |          |                                                            |
| `json`       | `boolean`     | `true`  | JSON‑encode objects for body methods; parse JSON responses |          |                                                            |
| `urlencoded` | `boolean`     | `false` | Encode body as `application/x-www-form-urlencoded`         |          |                                                            |

```js
// Per call overrides
await net.http.get("/profile", { format: "full", headers: { Authorization: "Bearer ..." } });

// Bypass base URL for this call only
await net.http.get("https://other.example.com/ping", { absolute: true });
```

---

## Body Encoding Rules (summary)

* Objects are **JSON‑encoded** by default for body methods (`POST/PUT/PATCH`).
* Set `{ urlencoded: true }` for form posts.
* You may pass `FormData`, `URLSearchParams`, `Blob`, `ArrayBuffer`, or raw `string` bodies — these are sent as‑is.

---

## Class Defaults: `HTTP.FETCH_DEFAULTS` (advanced)

Use when you want **global fetch options** (e.g., credentials, mode) applied across the app.

```js
// Example: extend defaults in a subclass
import HTTP from "./vendor/m7Fetch/src/core/HTTP.js";
class MyHTTP extends HTTP {
  static FETCH_DEFAULTS = {
    credentials: "include",
    mode: "cors",
    cache: "no-cache",
  };
}
```

**Allowed keys** follow the WHATWG fetch option sets (examples):

* `mode` (cors, no-cors, same-origin)
* `credentials` (omit, same-origin, include)
* `cache` (default, no-store, reload, no-cache, force-cache, only-if-cached)
* `redirect` (follow, error, manual)
* `referrerPolicy` (no-referrer, origin, strict-origin-when-cross-origin, ...)
* `priority` (auto, high, low)
* `keepalive` (boolean)
* `integrity` (SRI string)
* `duplex` (e.g., `"half"` for streaming where supported)
* `signal` (boolean placeholder / `AbortSignal` passed per request)

> Unknown/unsupported keys are ignored; only recognized values are merged into requests.

---

## Merging & Validation Behavior

* **Per‑request** options override **instance** and **class** defaults.
* Fetch option merging only accepts **recognized** keys/values; invalid entries are dropped.
* Headers merge **shallowly**: per‑request headers win on key conflicts.

```js
// Example: build fetch defaults, invalid keys ignored
// (Based on the library’s default builder behavior)
const res = await net.http.get("/config", {
  format: "full",
  mode: "same-origin",   // valid → applied
  timeout: 5000,          // handled by HTTP layer, not native fetch
  credentials: "omit",    // valid → applied
});
```

---

## Cookies, Credentials & CORS

* To send cookies across sites, use `credentials: "include"` **and** configure your server cookies with `SameSite=None; Secure`.
* CORS errors are **server policy** issues; ensure origins, methods, and headers are allowed.
* For token auth, prefer `Authorization: Bearer <token>` in **headers** rather than query params.

```js
const net = new Net({ headers: { Authorization: "Bearer <token>" } });
```

---

## Timeouts & Abort

* Set `timeout: ms` on a per‑request basis to auto‑abort (where supported).
* Or pass your own `AbortSignal` via `signal`.

```js
const ctrl = new AbortController();
const p = net.http.get("/stream", { format: "raw", signal: ctrl.signal });
ctrl.abort();
try { await p; } catch (e) { console.warn("aborted", e); }
```

---

## Recommended Default Profiles

**Browser SPA**

```js
class SPAHTTP extends HTTP {
  static FETCH_DEFAULTS = { mode: "cors", credentials: "include", cache: "no-cache" };
}
```

**Server‑side fetcher (no cookies)**

```js
class ServerHTTP extends HTTP {
  static FETCH_DEFAULTS = { mode: "cors", credentials: "omit", cache: "no-store" };
}
```

---

## Troubleshooting

* **Unexpected base URL** → You likely set `url` on `Net`. Use `absolute: true` for external calls.
* **Missing cookies** → Add `credentials: "include"` and verify server cookie flags.
* **Form encoding issues** → Add `{ urlencoded: true }` when the server expects `application/x-www-form-urlencoded`.
* **OPTIONS/HEAD parsing** → Use `format: "full"` to inspect status/headers without consuming a body.

---

## See Also

* **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** — request/response patterns and examples.
* **[CORE\_API\_HTTP.md](./CORE_API_HTTP.md)** — method signatures & types.
* **[AUTHENTICATION\_AND\_SECURITY.md](./AUTHENTICATION_AND_SECURITY.md)** — deeper security notes.
