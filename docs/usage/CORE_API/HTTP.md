↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_HTTP

The low-level HTTP client used by `Net`. It wraps `fetch()` with:

* ergonomic **method helpers** (`get`, `post`, `put`, `patch`, `delete`, `head`, `options`)
* normalized **request options** (base URL, headers, `json`/`urlencoded`, timeouts, `signal`)
* predictable **response formats** (`body` | `full` | `raw`)
* a small set of **validated fetch enums** and extendable `FETCH_DEFAULTS`

> Use `HTTP` standalone or via `new Net().http`. See also **HTTP\_GUIDE.md** for narrative walkthroughs.

---

## Constructor

### `new HTTP(opts?)`

Creates a new HTTP client with per-instance defaults.

* **Parameters**

  * `opts` *(object, optional)* — Per-instance defaults merged with `HTTP.FETCH_DEFAULTS` and overridden by per-request options.

* **Returns**

  * `HTTP` instance exposing method helpers.

---

## Methods

All helpers share a common signature and option parsing. Unknown options are forwarded to `fetch` if valid.

```ts
// canonical shape (TypeScript-ish, informal)
interface RequestOpts {
  baseURL?: string;                 // "https://api.example.com"
  url?: string;                     // optional when calling via spec layer
  headers?: Record<string, string>; // merged (lowercased keys on send)
  query?: Record<string, any>;      // appended to URL as ?key=value

  // body helpers (mutually exclusive - first truthy wins)
  json?: any;                       // JSON.stringify + Content-Type: application/json
  urlencoded?: Record<string, any>; // application/x-www-form-urlencoded
  body?: BodyInit | null;           // pass-through (FormData/Blob/ArrayBuffer/etc.)

  // control
  format?: 'body' | 'full' | 'raw'; // default: 'body'
  timeout?: number;                 // ms; implemented via AbortController
  signal?: AbortSignal;             // external AbortSignal; merged with timeout

  // fetch() options (validated against FETCH_CONSTANTS)
  method?: string;                  // validated on helpers
  mode?: RequestMode;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  redirect?: RequestRedirect;
  referrerPolicy?: ReferrerPolicy;
}
```

### Helper signatures

```ts
get(url: string, opts?: RequestOpts)
post(url: string, opts?: RequestOpts)
put(url: string, opts?: RequestOpts)
patch(url: string, opts?: RequestOpts)
delete(url: string, opts?: RequestOpts)
head(url: string, opts?: RequestOpts)
options(url: string, opts?: RequestOpts)
```

> **Validation**: Method helpers guard against unsupported/typoed methods and normalize casing.

---

## Request Building

### URL Resolution

* If `url` is **absolute**, it is used as-is.
* If `url` is **relative** and `baseURL` is set (on instance or per-request), the final URL is `new URL(url, baseURL)`.
* `query` object is serialized using standard rules (`array` -> repeated keys, primitives -> strings) and appended to the final URL.

### Headers Merge Order

`{ ...FETCH_DEFAULTS.headers, ...instance.headers, ...perRequest.headers }`

* Keys are treated case-insensitively when merging.
* Helper flags (like `json`) may set/override `Content-Type` if absent.

### Bodies

* `json`: `JSON.stringify(json)` + `Content-Type: application/json`.
* `urlencoded`: `application/x-www-form-urlencoded` using `URLSearchParams`.
* `body`: pass-through; e.g., `FormData`, `Blob`, `ArrayBuffer`, `ReadableStream` (where supported).
* If both `json` and `body` are provided, **`json` wins**. If `urlencoded` and `json` provided, **first truthy wins** following the order `json` → `urlencoded` → `body`.

### Timeouts & Abort

* `timeout` creates an internal `AbortController` that races the request.
* If `signal` is provided, it is **composed** with the internal timeout signal (aborts if either fires).

---

## Response Handling

Select the shape you need via `format` (default `body`).

### `format: "body"`

Returns parsed body only:

* `application/json` → `await res.json()`
* `text/*` → `await res.text()`
* `*/*;charset=binary`/blob-like → `await res.blob()` when available

### `format: "full"`

Returns an object `{ ok, status, statusText, url, headers, body }`, where `body` is parsed as above.

### `format: "raw"`

Returns the native `Response` instance, unparsed.

> For debugging and error flows, prefer `format: "full"` to inspect `ok`/`status` and headers.

---

## Defaults & Validation

### `HTTP.FETCH_DEFAULTS`

A mutable baseline extended at the module level. Typical fields: `mode`, `cache`, `credentials`, `redirect`, `referrerPolicy`, and default `headers`.

**Merge precedence**: `FETCH_DEFAULTS` ← instance `opts` ← per-request `opts`.

### Allowed Enums

Values for `mode`, `cache`, `credentials`, `redirect`, `referrerPolicy` are validated against a known-safe set (see `FETCH_CONSTANTS`). Unknown values are rejected early with a descriptive error.

---

## Examples

### 1) Base URL + JSON

```js
import Net from 'm7Fetch';
const net = new Net({ http: { baseURL: 'https://api.example.com' } });

const user = await net.http.get('/v1/users/me', { format: 'body' });
const create = await net.http.post('/v1/users', {
  json: { email: 'a@b.co', name: 'Ada' },
  headers: { 'X-Trace': 'demo-1' },
  format: 'full'
});
console.log(create.status, create.body.id);
```

### 2) Query params + urlencoded body

```js
const search = await net.http.get('/v1/search', {
  query: { q: 'kitties', limit: 25, tags: ['cute', 'fluffy'] }
});

const token = await net.http.post('/oauth/token', {
  urlencoded: { grant_type: 'client_credentials', scope: 'public' }
});
```

### 3) Timeout + AbortSignal

```js
const ac = new AbortController();
setTimeout(() => ac.abort(), 250);

try {
  await net.http.get('/slow', { timeout: 5000, signal: ac.signal, format: 'full' });
} catch (e) {
  // e.name === 'AbortError' on timeout or external abort
}
```

### 4) Raw streaming/Blob (browser)

```js
const res = await net.http.get('/report.csv', { format: 'raw' });
const text = await res.text(); // or res.blob()
```

---

## Error Handling

* **Unsupported method** → `E_HTTP_UNSUPPORTED_METHOD` (thrown before `fetch`).
* **Invalid enum value** → `E_HTTP_INVALID_FETCH_OPTION`.
* **Abort/Timeout** → native `AbortError` (wrap or inspect as needed).
* When `format: 'body'`, exceptions bubble from the chosen parser (`json()`/`text()`/`blob()`). Prefer `format: 'full'` when diagnosing.

---

## Notes & Tradeoffs

* The client is intentionally light; retries/backoff, streaming helpers, and HTTP/2 are in the roadmap and can be layered externally.
* Use instance-level defaults for cross-cutting concerns (credentials mode, cache policy) and override per request.
* For uploads, pass `FormData` via `body` and let the browser set `Content-Type` boundaries.

---

## Minimal Types (informal)

```ts
class HTTP {
  static FETCH_DEFAULTS: RequestInit & { headers?: Record<string, string> };
  constructor(opts?: RequestOpts);
  get(url: string, opts?: RequestOpts): Promise<any>;
  post(url: string, opts?: RequestOpts): Promise<any>;
  put(url: string, opts?: RequestOpts): Promise<any>;
  patch(url: string, opts?: RequestOpts): Promise<any>;
  delete(url: string, opts?: RequestOpts): Promise<any>;
  head(url: string, opts?: RequestOpts): Promise<any>;
  options(url: string, opts?: RequestOpts): Promise<any>;
}
```

---

## See Also

* **HTTP\_GUIDE.md** — step‑by‑step patterns and troubleshooting.
* **CORE\_API\_FETCH\_CONSTANTS.md** — allowed enums and validation rules.
* **CONFIGURATION\_AND\_DEFAULTS.md** — deep dive on `FETCH_DEFAULTS` and merge precedence.
