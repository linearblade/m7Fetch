

# --- begin: docs/AI_DISCLOSURE.md ---

# ⚙️ AI Disclosure Statement

This project incorporates the assistance of artificial intelligence tools in a supporting role to accelerate development and reduce repetitive labor.

Specifically, AI was used to:

* 🛠️ **Accelerate the creation of repetitive or boilerplate files**, such as configuration definitions and lookup logic.
* ✍️ **Improve documentation clarity**, formatting, and flow for both technical and general audiences.
* 🧠 **Act as a second set of eyes** for small but crucial errors — such as pointer handling, memory safety, and edge-case checks.
* 🌈 **Suggest enhancements** like emoji-infused logging to improve readability and human-friendly debug output.

---

## 🧑‍💻 Emoji Philosophy

I **like emoji**. They're easy for me to scan and read while debugging. Emoji make logs more human-friendly and give structure to otherwise noisy output.

Future versions may include a **configurable emoji-less mode** for those who prefer minimalism or need plaintext compatibility.

And hey — if you don't like them, the wonders of open source mean you're free to **delete them all**. 😄

---

## 🔧 Human-Directed Engineering

All core architecture, flow design, function strategy, and overall system engineering are **authored and owned by the developer**. AI was not used to generate the software's original design, security model, or protocol logic.

Every AI-assisted suggestion was critically reviewed, tested, and integrated under human judgment.

---

## 🤝 Philosophy

AI tools were used in the same spirit as modern compilers, linters, or search engines — as **assistants, not authors**. All decisions, final code, and system behavior remain the responsibility and intellectual output of the developer.


# --- end: docs/AI_DISCLOSURE.md ---



# --- begin: docs/CHANGELOG.md ---

# CHANGELOG

> Format for tracking **m7Fetch** changes over time. Based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and **Semantic Versioning (SemVer)**.

Use the sections below for each release. Keep entries terse and user‑facing. Technical details (PR numbers, internal notes) belong in commit messages.

---

## \[Unreleased]

### Added

*

### Changed

*

### Deprecated

*

### Removed

*

### Fixed

*

### Security

*

### Docs

*

---

## \[x.y.z] - YYYY-MM-DD

> Short, human summary for the release. Mention notable modules (HTTP, Specs, Modules, Batch/Sync) and any **breaking changes**.

### Added

*

### Changed

*

### Deprecated

*

### Removed

*

### Fixed

*

### Security

*

### Docs

*

#### Migration Notes

* **Breaking:**
*

---

## Release Checklist (maintainers)

* [ ] Update version in `package.json` (or build metadata).
* [ ] Fill **Unreleased** → new `[x.y.z]` section; set date.
* [ ] Ensure **Migration Notes** for any breaking changes.
* [ ] Update docs pages impacted by changes (HTTP\_GUIDE, SPEC\_MANAGER, MODULES, BATCHING\_AND\_COORDINATION, etc.).
* [ ] Run tests and linters; attach CI badge if applicable.
* [ ] Tag and push: `git tag vx.y.z && git push --tags`.
* [ ] Update compare links at the bottom of this file.

---

## Conventions & Tips

* **SemVer:**

  * **MAJOR** x.0.0 → breaking changes (removals, API signature changes).
  * **MINOR** 0.y.0 → backwards‑compatible features.
  * **PATCH** 0.0.z → bug fixes and docs-only changes.
* Use the **same headings** in every section: Added / Changed / Deprecated / Removed / Fixed / Security / Docs.
* Prefix breaking items with **Breaking:** and provide a migration snippet.
* Group related changes (HTTP vs Batch vs Specs) under bullet sub‑headers if helpful.

---

## Example Entry (delete when you publish real releases)

## \[0.1.0] - 2025-08-14

> Initial public documentation set and baseline runtime APIs.

### Added

* HTTP helpers with `format: body|full|raw` and `timeout`.
* SpecManager `load()` + `call()` by `operationId`.
* ModuleManager dynamic `import()` registry by `id`.
* BatchLoader with `awaitAll` and `limit`, default `batchStatus` handler.

### Docs

* Usage Guide TOC + INTRODUCTION/INSTALLATION/QUICK\_START.
* BASIC\_CONCEPTS, HTTP\_GUIDE, CONFIGURATION\_AND\_DEFAULTS.
* SPEC\_MANAGER, AUTOLOADER, MODULES, BATCHING\_AND\_COORDINATION.
* AUTHENTICATION\_AND\_SECURITY, ERROR\_HANDLING\_AND\_DEBUGGING, CONCURRENCY\_LIMITING, EXAMPLES\_LIBRARY, TROUBLESHOOTING, GLOSSARY, CHANGELOG template.

#### Migration Notes

* N/A (first release).

---

## Link References (update for your repo)

<!-- Replace <REPO_URL> with your repository URL (e.g., https://github.com/yourorg/m7fetch) -->

\[Unreleased]: \<REPO\_URL>/compare/v0.1.0...HEAD
\[0.1.0]: \<REPO\_URL>/releases/tag/v0.1.0


# --- end: docs/CHANGELOG.md ---



# --- begin: docs/EXAMPLE.md ---

import HTTP from './HTTP.js';

// Extend the HTTP class to provide custom defaults
class MyHTTP extends HTTP {
    static FETCH_DEFAULTS = {
        mode: 'cors',
        credentials: 'include',
        cache: 'no-cache'
    };
}

const http = new MyHTTP();

// This will override mode and add a timeout, but ignore invalid entries
const fetchOpts = http.buildDefaultFetchOpts({
    mode: 'same-origin',   // Valid override
    timeout: 5000,         // Not part of FETCH_CONSTANTS — will be ignored
    credentials: 'omit'    // Valid override
});

console.log(fetchOpts);
// Output (if all values are valid):
// {
//   mode: 'same-origin',
//   credentials: 'omit',
//   cache: 'no-cache'
// }

# --- end: docs/EXAMPLE.md ---



# --- begin: docs/TODO.md ---


🛠️ TODO - possible ideas
The following are items I will do or possibly may do. more of my own internal checklist.

Error Handling
- Consider exposing a global onError or onFail callback for central error tracking/logging.
- eh, possibly, but feels like I'm digging.

Streaming Support
- support ReadableStream (e.g., for SSE, downloads)
- planning to do this.

Retry / Retry-After
- Advanced retry support (backoff, Retry-After header parsing) could be wrapped into a higher-level helper or integrated into fetchOpts.
- will potentially do this. this is sort of implicitly supported via batchLoader and catching failures. requires manual tooling however.
Request Cancellation
- Consider exposing the AbortController in returned results for manual cancellation use cases.
- going to do this

Response Hooking
- A “middleware”-style hook between fetch and parse could allow metrics or mutation before parsing.
- Not a fan of doing this, I want the class to be as atomic as possible


# --- end: docs/TODO.md ---



# --- begin: docs/usage/AUTHENTICATION_AND_SECURITY.md ---

← Back to [Usage Guide Index](TOC.md)

# AUTHENTICATION & SECURITY

Guidance for sending credentials, securing requests, and hardening your app when using **m7Fetch**.

---

## Overview

* **Where to put auth:** headers (e.g., `Authorization`), or cookies (with `credentials` enabled).
* **What m7Fetch does:** forwards your options to `fetch` (headers, credentials). It doesn’t implement an auth protocol itself.
* **Your responsibility:** server policy (CORS), token lifecycles, cookie flags, and content security controls.

---

## Headers (tokens & API keys)

Use headers for bearer/JWT tokens, API keys, or custom schemes.

```js
// Instance‑wide default header
const net = new Net({ headers: { Authorization: "Bearer <token>" } });

// Per‑request override/merge
await net.http.get("/me", { headers: { Authorization: "Bearer <token2>" }, format: "full" });

// Spec call
await net.specs.call("petsAPI", "getPet", {
  headers: { Authorization: "Bearer <token>" },
  path: { petId: "p-42" },
  format: "full",
});
```

**Best practices**

* Prefer short‑lived access tokens + refresh flow.
* Avoid storing long‑lived tokens in `localStorage` (XSS risk). Prefer **httpOnly cookies** or in‑memory.
* Namescape custom headers (`x-…`) to avoid collisions.

---

## Cookies & `credentials`

To include cookies, instruct fetch to send them and configure server cookie flags.

```js
// Option A: subclass HTTP defaults (global)
class CookieHTTP extends HTTP { static FETCH_DEFAULTS = { credentials: "include" }; }

// Option B: per request
await net.http.get("/me", { format: "full", credentials: "include" });
```

**Server cookie flags**

* `SameSite=None; Secure` for cross‑site usage.
* `HttpOnly` to block JS access where possible.
* Reasonable expiry and rotation.

**Notes**

* Browsers will **not** send cookies cross‑site unless `credentials:"include"` **and** cookie flags allow it.
* For same‑site apps, `SameSite=Lax` may suffice.

---

## CORS (Cross‑Origin Resource Sharing)

CORS is enforced by the **browser**, configured by the **server**.

**Server must send:**

* `Access-Control-Allow-Origin: <your-app-origin>` *(or `*` without credentials)*
* If using cookies: `Access-Control-Allow-Credentials: true`
* If sending custom headers/methods: `Access-Control-Allow-Headers`, `Access-Control-Allow-Methods`

**Preflight (OPTIONS) requests** occur when using non‑simple methods/headers. Ensure server responds 200/204 with the right `Access-Control-*` headers.

**Common fixes**

* Align origins (prefer same‑origin during development via proxy).
* Reflect `Origin` safely on the server or allow a specific list.
* Include `Vary: Origin` when dynamically allowing origins.

---

## CSRF (Cross‑Site Request Forgery)

If you rely on cookies for authentication, implement **CSRF** protections:

* **SameSite** cookies (Lax/Strict) reduce exposure but may break flows.
* **Token patterns**: double‑submit cookie, synchronizer token, or header‑based tokens (e.g., `x-csrf-token`).
* Validate **origin**/`Referer` headers for state‑changing requests.

---

## TLS, CSP, and SRI

* **TLS:** Always prefer HTTPS; mixed content will be blocked by modern browsers.
* **CSP:** Configure `Content-Security-Policy` to restrict `script-src`, `connect-src` (your API endpoints), etc.
* **SRI:** When serving static JS modules, add **Subresource Integrity** hashes to detect tampering.

```html
<!-- Example CSP (simplified) -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' https://api.example.com; script-src 'self'; object-src 'none'">
```

---

## SpecManager integration

You can pass headers/credentials while **loading** a spec and while **calling** operations:

```js
// Load with credentials and headers
await net.specs.load("/specs/resolve", {
  id: "remoteAPI",
  method: "post",
  headers: { Authorization: "Bearer <token>" },
  credentials: "include",
  format: "full",
});

// Call operation with per‑call headers
await net.specs.call("remoteAPI", "getSecret", {
  headers: { Authorization: "Bearer <token>" },
  format: "full",
});
```

---

## Node considerations

* Node 18+ has global `fetch`; earlier versions need a polyfill (e.g., `undici`).
* Environment variables are common for tokens/keys; do not log them.
* For server‑to‑server auth, prefer **mTLS** or OAuth client credentials where applicable.

---

## Examples

**Bearer token across calls**

```js
const net = new Net({ headers: { Authorization: `Bearer ${accessToken}` } });
const me = await net.http.get("/me", { format: "full" });
```

**Cookie session**

```js
class CookieHTTP extends HTTP { static FETCH_DEFAULTS = { credentials: "include" }; }
const net = new Net();
const res = await net.http.get("/profile", { format: "full", credentials: "include" });
```

**Custom header + CORS preflight**

```js
await net.http.post("/mutate", { a: 1 }, {
  headers: { "x-csrf-token": token },
  format: "full",
});
```

---

## Troubleshooting

* **401/403** → expired token, missing cookie, or wrong audience/scope. Refresh/reauth and verify claims.
* **Preflight fails** → server must allow method/headers and reply to `OPTIONS` with the right CORS headers.
* **Cookies not sent** → you didn’t set `credentials:"include"`, or cookie flags disallow cross‑site.
* **Mixed content** → API must be HTTPS when the app is served over HTTPS.
* **Clock skew** (JWT) → `iat/exp` validity issues on server/client; sync clocks.

---

## Checklist

* [ ] Decide on **headers vs cookies** for auth.
* [ ] Configure **CORS** on the server; set `connect-src` in **CSP** accordingly.
* [ ] Use **short‑lived tokens**, refresh flows, and avoid persistent storage for secrets.
* [ ] If using cookies: set `SameSite=None; Secure; HttpOnly` and enable `credentials` in requests.
* [ ] Log **status + endpoint + small body excerpt**, not full tokens.

---

## See also

* **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** — per‑request options (`headers`, `credentials`, `format`).
* **[CONFIGURATION\_AND\_DEFAULTS.md](./CONFIGURATION_AND_DEFAULTS.md)** — layering and merges.
* **[SPEC\_MANAGER.md](./SPEC_MANAGER.md)** — headers/credentials during spec load and calls.


# --- end: docs/usage/AUTHENTICATION_AND_SECURITY.md ---



# --- begin: docs/usage/AUTOLOADER.md ---

← Back to [Usage Guide Index](TOC.md)

# AUTOLOADER

**AutoLoader** powers `specs.load(...)` by detecting how to fetch and parse a spec based on type hints or input shape. It centralizes the logic for GET/POST retrieval, option forwarding, and extensibility via custom loaders.

---

## What it does

* Detects **spec type** from hints (e.g., `x-type`) or the input form (URL vs. object).
* Fetches the source (GET or POST), then parses/caches the spec under an `id`.
* Forwards relevant options to the **HTTP** layer (headers, `format`, credentials, etc.).
* Allows **custom loaders** for non‑OpenAPI formats or special fetch flows.

> Use AutoLoader whenever you want a single `specs.load(...)` entrypoint that “does the right thing” regardless of where the spec lives or how it must be retrieved.

---

## Supported Inputs

* **URL string** (e.g., `"/specs/pets.json"`)
* **Inline object** (already parsed JSON)
* **Loader options** (e.g., `{ method: 'post', data: {...}, headers: {...} }`)

```js
await net.specs.load("/specs/pets.json", { id: "petsAPI" });
await net.specs.load({ openapi: "3.0.3", paths: {} }, { id: "inlineAPI" });
```

---

## Type Detection

AutoLoader inspects a combination of:

* **Explicit hint**: `x-type` (e.g., `"openapi"`, `"custom"`)
* **MIME/extension**: `application/json`, `.json`, etc.
* **Shape checks**: keys like `openapi`, `paths`, or custom markers

> If no type is recognized, AutoLoader falls back to a **generic JSON** strategy (treat as JSON and store under the provided `id`).

---

## Fetch Modes

### GET

Default for plain URLs:

```js
await net.specs.load("/specs/pets.json", { id: "petsAPI" });
```

### POST

Pass a body to retrieve a spec from a POST endpoint (e.g., gated access or server‑side resolution):

```js
await net.specs.load("/specs/resolve", {
  id: "secureAPI",
  method: "post",
  data: { token: "..." },
  headers: { "x-client": "demo" },
});
```

**Notes**

* `headers`, `format`, and other HTTP options are forwarded.
* Use `urlencoded: true` when the endpoint expects form encoding.

---

## Options Forwarding

Any HTTP‑relevant options passed to `specs.load` are forwarded to the **HTTP** layer:

* `headers`, `format`, `timeout`, `signal`
* `json`, `urlencoded`
* `absolute` (bypass base URL)

```js
await net.specs.load("https://api.example.com/spec", {
  id: "extAPI",
  headers: { Authorization: "Bearer <token>" },
  absolute: true,
  format: "full",
});
```

---

## Custom Loaders (Extensibility)

You can register a custom loader for a new spec type (e.g., GraphQL SDL, proprietary schema). A loader should:

* **Decide** whether it can handle the input (by hint or heuristic)
* **Fetch/parse** the source into a canonical object
* **Return** `{ id, spec, meta? }` for storage

**Sketch**

```js
// pseudo-code — adapt to your AutoLoader extension surface
AutoLoader.register("mytype", async (src, opts, { http }) => {
  const id = opts.id || "mytypeAPI";
  let obj;
  if (typeof src === "string") {
    const res = await http.get(src, { format: "full", ...opts });
    obj = res.body; // parse as needed
  } else {
    obj = src;
  }
  // Transform to your canonical shape if necessary
  return { id, spec: obj, meta: { type: "mytype" } };
});
```

> Keep loaders **pure** and explicit: no global state, no hidden side‑effects. Forward only the options you truly need.

---

## Examples

### Load by URL, then call

```js
await net.specs.load("/specs/pets.json", { id: "petsAPI" });
const res = await net.specs.call("petsAPI", "listPets", { query: { limit: 10 } });
```

### POST‑retrieved spec, credentials forwarded

```js
await net.specs.load("/specs/resolve", {
  id: "remoteAPI",
  method: "post",
  headers: { Authorization: "Bearer <token>" },
  data: { scope: "public" },
  format: "full",
});
```

### Inline object with `x-type` hint

```js
await net.specs.load({ "x-type": "openapi", openapi: "3.1.0", paths: {} }, { id: "inlineAPI" });
```

---

## Troubleshooting

* **Unrecognized type** → ensure your input includes a recognizable hint (`x-type`) or a shape AutoLoader can infer.
* **POST body rejected** → use `urlencoded: true` or adjust body type; verify endpoint expects POST for spec delivery.
* **CORS/credentials** → if fetching cross‑site, configure CORS, and pass headers/`credentials` via HTTP defaults when needed.
* **Spec missing `operationId`** → you can still call by path/method where supported, but prefer `operationId` for maintainability.

---

## See also

* **[SPEC\_MANAGER.md](./SPEC_MANAGER.md)** — calling operations by `operationId`.
* **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** — request/response formats and HTTP options.
* **[AUTHENTICATION\_AND\_SECURITY.md](./AUTHENTICATION_AND_SECURITY.md)** — headers, credentials, CORS.


# --- end: docs/usage/AUTOLOADER.md ---



# --- begin: docs/usage/BASIC_CONCEPTS.md ---

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


# --- end: docs/usage/BASIC_CONCEPTS.md ---



# --- begin: docs/usage/BATCHING_AND_COORDINATION.md ---

# BATCHING & COORDINATION

Use **BatchLoader** (with **SyncLoader** under the hood) to run many HTTP requests, cap concurrency, and coordinate a single completion or failure path. Handlers let you validate/transform each item, and a shared `context` makes results accessible by `id`.

---

## Why batch?

* **Throughput**: parallelize requests with a safe concurrency cap.
* **Determinism**: each item is tracked by a unique `id`.
* **Coordination**: a single `onLoad` or `onFail` when the batch completes.
* **Flexibility**: per-item handlers for parsing, storage, and validation.

---

## Quick start

```js
const { sync, results } = await net.batch.run(
  [
    { id: "cfg",  url: "/config.json",   opts: { format: "full" } },
    { id: "lang", url: "/i18n/en.json",  opts: { format: "full" } },
    { id: "ping", url: "/health",        opts: { format: "full" } },
  ],
  // onLoad: fires when ALL items have completed (success or fail). If any failed and an onFail exists, onFail will run instead.
  (prepend, last) => {
    // prepend = { context, trigger, controller }
    console.log("✅ done:", Object.keys(prepend.context));
  },
  // onFail: fires if ANY handler returned false (see failure semantics below)
  (prepend, last) => {
    console.warn("⚠️ one or more failed", { trigger: prepend.trigger });
  },
  { awaitAll: true, limit: 8 }
);

// When awaitAll: true, `results` is a map of { id → handler result }.
// You can also read the shared context at any time:
const cfg = net.batch.get("cfg");
```

**Item schema**

```js
{
  id: "unique-id",               // required
  method: "get" | "post",       // defaults to "get"
  url: "/path" | "https://…",    // required
  data: {…},                      // request body for POST (optional)
  opts: { format: "full" },       // per-request HTTP options
  handler: (res) => any           // optional transform/validation
}
```

---

## Failure semantics (important)

* Only a handler that **returns `false`** marks that item as **failed**.
* The **default batch handler** (`batchStatus`) will store the response **and** automatically treat `!res.ok` as failure.
* For raw success values, return anything other than `false` (including `undefined`).

> **Edge case:** if your API legitimately returns the literal JSON value `false`, don’t propagate it directly as the handler’s return value. Wrap it:

```js
handler: (res) => (res.body === false ? { ok: true, body: false } : res)
```

---

## Concurrency control

Cap parallelism with the `limit` option:

```js
await net.batch.run(loadList, onLoad, onFail, { awaitAll: true, limit: 4 });
```

Requests are queued and executed using a lightweight limiter; set a sensible value (e.g., 4–16) to avoid server or browser saturation.

---

## Results & shared context

* **Shared context:** all stored outputs live under `prepend.context[id]` during callbacks, and are accessible later via `net.batch.get(id)`.
* **`results` map:** when `awaitAll: true`, the return value includes `results[id]` for each item.
* **Custom storage:** if you use a custom batch handler that doesn’t store automatically, write to `obj.context[id]` inside your handler.

```js
const { results } = await net.batch.run([
  { id: "a", url: "/a.json", opts:{ format: "full" } },
  { id: "b", url: "/b.json", opts:{ format: "full" } },
]);
console.log(results.a, results.b);
console.log(net.batch.get("a")); // same value if using default storage
```

---

## Streaming mode (awaitAll: false)

Fire handlers as responses arrive, and coordinate completion with **SyncLoader**:

```js
const { sync } = await net.batch.run(loadList, onLoad, onFail, { awaitAll: false, limit: 8 });

// Option A: callbacks (onLoad/onFail) will run when all required items have finished.

// Option B: poll the sync state (e.g., in a UI loop)
const tick = setInterval(() => {
  if (sync.loaded()) {           // all done
    clearInterval(tick);
    console.log("success?", sync.success()); // true if no failures
  }
}, 100);
```

> In streaming mode, prefer reading from the shared `context[id]` as items complete.

---

## Custom batch handlers

Batch behavior can be tuned globally per batch instance.

### Built-ins

* **`batchStatus(obj, id, handler)`** *(default)* — stores the response, and marks failure if `!res.ok`.
* **`batchStore(obj, id, handler)`** — stores the response regardless of status; never fails unless your `handler` returns `false`.
* **`batchNone(obj, id, handler)`** — no automatic storage; your `handler` controls everything. Return `false` to fail.

### Choosing a default handler

```js
// Apply to the current BatchLoader instance (affects subsequent runs)
net.batch.setBatchHandler(net.batch.batchStore);    // always store
// or
net.batch.setBatchHandler(false);                   // use batchNone

// Provide default fetch options for all items in this batch context
net.batch.setFetchOpts({ format: "full" });
```

### Custom transform example

```js
// Normalize API responses into a common shape
function normalize(obj, id, handler) {
  return (res) => {
    const body = res.body ?? res; // handle format: 'body' or 'full'
    if (body?.error) return false; // fail this item
    const out = { data: body?.data ?? body, at: Date.now() };
    obj.context[id] = out;         // store yourself if using batchNone
    return out;                    // returned value becomes results[id]
  };
}

net.batch.setBatchHandler(normalize);
await net.batch.run([
  { id: "one", url: "/api/one",  opts:{ format: "full" } },
  { id: "two", url: "/api/two",  opts:{ format: "full" } },
]);
```

---

## Supported methods & preflight checks

* Allowed `method` values: **`get`** and **`post`** (invalid values throw).
* Each item **must** include a unique `id` and a `url`.
* Duplicate IDs or missing fields throw clear errors.

```js
await net.batch.run([
  { id: "dup", url: "/a" },
  { id: "dup", url: "/b" }, // ❌ throws: duplicate ID
]);
```

---

## Patterns & recipes

* **Config+lang bootstrap:** load `/config.json` and `/i18n/en.json` together, render UI when both arrive.
* **Health fan‑out:** ping several microservices and mark the panel red if any fail.
* **Asset manifests:** fetch multiple manifests, merge into a single registry before continuing.
* **Progress UI:** use `awaitAll:false` and a polling loop to update a progress bar as each ID completes.

---

## Error handling & observability

* Prefer `format: "full"` while developing to inspect `{ ok, status, body }` in handlers.
* Surface endpoint, status, and a small body excerpt in logs.
* In `onFail`, the `prepend.controller.fail` map contains the IDs that failed.

```js
(prepend) => {
  const failed = Object.keys(prepend.controller.fail);
  console.warn("batch failed: ", failed);
}
```

---

## Troubleshooting

* **Batch never completes** → Ensure every handler returns **something** (not a never‑resolving promise). Use `awaitAll:true` to collect results deterministically.
* **False‑as‑failure** → Wrap legitimate boolean `false` results to avoid being treated as failure.
* **Unexpected body parsing** → Set `opts.format: "raw"` and parse yourself when downloading binary.
* **Too many open requests** → Lower `limit` to apply back‑pressure.

---

## See also

* **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** — request/response options used inside each item.
* **[CORE\_API\_BATCH\_LOADER.md](./CORE_API_BATCH_LOADER.md)** — deep API surface and return shapes.
* **[CORE\_API\_SYNC\_LOADER.md](./CORE_API_SYNC_LOADER.md)** — coordinator semantics.


# --- end: docs/usage/BATCHING_AND_COORDINATION.md ---



# --- begin: docs/usage/CONCURRENCY_LIMITING.md ---

← Back to [Usage Guide Index](TOC.md)

# CONCURRENCY LIMITING

How **m7Fetch** caps parallel work to protect servers, browsers, and your app’s UX. The limit applies at the **BatchLoader** level via a small queueing helper.

---

## Why limit concurrency?

* **Stability** — avoid request stampedes and resource exhaustion.
* **Fairness** — ensure slow endpoints don’t starve others.
* **UX** — predictable completion times and progress updates.

---

## Where limits apply

* **`BatchLoader.run(..., { limit })`** — caps *concurrent* HTTP requests for that batch.
* **`concurrencyLimiter(max)`** — internal helper that queues functions and runs up to `max` at once. Useful for any async job, not just HTTP.

> There’s **no global cross‑batch limit** by default. Each `run()` manages its own queue. If you start multiple batches at once, coordinate at the app layer (see patterns below).

---

## Defaults & behavior

* **Default `limit`: 8** if not specified.
* **Disable** by setting a very high value (not recommended; prefer a sensible cap).
* Jobs are pushed in submission order and executed FIFO as slots free up.
* Works with `awaitAll: true` (collects results after all complete) and `awaitAll: false` (handlers fire as each finishes).

```js
await net.batch.run(loadList, onLoad, onFail, { awaitAll: true, limit: 4 });
```

---

## Choosing a limit

Pick a starting point and tune with measurements:

* **4–8** for most browser apps hitting typical REST endpoints.
* Increase if endpoints are fast/lightweight or multiplexed; decrease for heavy compute or strict rate limits.
* Measure **latency**, **error/429 rates**, and **server load**; adjust accordingly.

> When working with rate‑limited APIs, combine a lower `limit` with application‑level **backoff** when you see `429` or `Retry‑After`.

---

## Patterns

### 1) Per‑batch cap

Each feature area can choose a limit appropriate to its workload.

```js
await net.batch.run(loadA, onLoadA, onFailA, { limit: 6 });
await net.batch.run(loadB, onLoadB, onFailB, { limit: 3 });
```

### 2) Global semaphore (cross‑batch)

If you need a **single cap across all batches**, wrap HTTP calls with your own limiter and use `batchNone` so you control storage.

```js
const limit = concurrencyLimiter(6);

function limitedGet(url, opts) {
  return limit(() => net.http.get(url, opts));
}

net.batch.setBatchHandler(false); // use batchNone
await net.batch.run(
  [ { id: "a", url: "/a" }, { id: "b", url: "/b" } ],
  (prepend) => console.log("done"),
  (prepend) => console.warn("fail"),
  { awaitAll: false, limit: 1000 } // effectively disabled; we enforce our own above
);
```

### 3) Priorities (lightweight)

Implement simple priority by scheduling **high‑priority** tasks earlier, or maintain two batches (HP first, then LP). For more control, build a small wrapper queue that sorts by `item.priority` before submission.

### 4) Host‑aware caps

Group URLs by origin and run separate batches/queues with different limits (e.g., internal services vs. third‑party APIs).

---

## Progress & streaming

Use `awaitAll:false` to stream results and update progress UI.

```js
const { sync } = await net.batch.run(loadList, onLoad, onFail, { awaitAll: false, limit: 5 });
const total = loadList.length;
const timer = setInterval(() => {
  const done = Object.keys(sync.controller.run).length;
  console.log(`${done}/${total}`);
  if (sync.loaded()) { clearInterval(timer); }
}, 100);
```

---

## Backoff & retries (recommended)

m7Fetch doesn’t impose retries; add a wrapper for **idempotent** requests.

```js
async function backoff(fn, tries = 3, base = 200) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { last = e; }
    await new Promise(r => setTimeout(r, base * 2 ** i));
  }
  throw last;
}

const res = await backoff(() => net.http.get("/ping", { format: "full" }));
```

Combine backoff with a conservative `limit` when facing transient errors or `429` responses.

---

## Pitfalls & how to avoid them

* **Thundering herd** — launching many big batches at once. *Stagger* starts or use a global semaphore.
* **Hidden blocking in handlers** — long CPU work inside item handlers blocks completion. *Offload* heavy parsing or keep handlers small.
* **Assuming global limits** — each `run()` has its own cap. If you require a global cap, implement it explicitly.
* **Binary downloads** — large responses tie up the network; use a **lower limit** and `format: "raw"` when you need manual streaming.

---

## Diagnostics

* Log per‑item **start/finish time** to spot stragglers.
* In `onFail`, inspect `prepend.controller.fail` to see which IDs failed.
* Consider adding an **X‑Correlation‑Id** header to requests for end‑to‑end tracing.

```js
(prepend) => {
  const failedIds = Object.keys(prepend.controller.fail);
  console.warn("failed:", failedIds);
}
```

---

## FAQ

**Q: Can I change the limit mid‑batch?**
A: No; set the desired value in the `run` call. Start a new batch to change it.

**Q: Does the limit control retries?**
A: No; retries are user‑implemented. The limit only caps *current* in‑flight jobs.

**Q: Does it guarantee order?**
A: Submission is FIFO, but completion order depends on network response times.

---

## See also

* **[BATCHING\_AND\_COORDINATION.md](./BATCHING_AND_COORDINATION.md)** — batch anatomy and handlers.
* **[CORE\_API\_BATCH\_LOADER.md](./CORE_API_BATCH_LOADER.md)** — API details.
* **[ERROR\_HANDLING\_AND\_DEBUGGING.md](./ERROR_HANDLING_AND_DEBUGGING.md)** — logging & failure modes.
* **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** — request options that affect performance.


# --- end: docs/usage/CONCURRENCY_LIMITING.md ---



# --- begin: docs/usage/CONFIGURATION_AND_DEFAULTS.md ---

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


# --- end: docs/usage/CONFIGURATION_AND_DEFAULTS.md ---



# --- begin: docs/usage/CORE_API/AUTOLOADER.md ---

↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)


# CORE\_API\_AUTOLOADER

> Detects a spec’s **type** and routes it to the right loader. Think of AutoLoader as the “front door” for `SpecManager`: you can hand it a URL or object and it will choose OpenAPI (or another supported type), fetch if necessary, and return a normalized spec record.

---

## What it does

* **Type inference**: Inspect an object or fetched JSON for markers (e.g., `openapi: "3.x"`) or an explicit `x-type` field.
* **HTTP retrieval**: If `source` is a string, perform `GET` by default, or `POST` with a payload when requested.
* **Option forwarding**: Pass through HTTP options (headers, timeout, `format`, etc.) to the underlying `net.http` calls.
* **Normalization**: Return `{ id, type, spec }` suitable for registration in `SpecManager`.
* **Extensibility**: Register custom detectors/handlers for additional spec families.

AutoLoader doesn’t call operations; it only **loads & classifies** specs so `SpecManager` can register them.

---

## Constructor

### `new AutoLoader(net)`

Creates an AutoLoader bound to a `Net` instance.

* **Parameters**

  * `net` *(Net)* — Provides the `http` client used to fetch remote specs.

---

## Methods

### `async load(source, opts?)`

Load a spec and infer its type.

* **Parameters**

  * `source` *(string | object)* — URL string or already-parsed spec object.
  * `opts` *(object, optional)*

    * `id` *(string)* — Registry key suggestion. If omitted and `source` is a URL, uses the filename stem.
    * `type` *(string)* — Force a specific type (e.g., `openapi`). Skips inference.
    * `method` *("get" | "post")* — HTTP method when `source` is a string. Default `"get"`.
    * `payload` *(any)* — Body to send when `method: "post"`.
    * `http` *(object)* — Options forwarded to `net.http` (headers, `timeout`, `format`, etc.).

* **Returns**

  * `Promise<{ id: string, type: string, spec: object }>`

* **Behavior**

  1. If `source` is a **string**, fetch it via `net.http.get(source, { format: 'body', ...opts.http })` or `post` when requested.
  2. Determine `type` (see **Type Detection**). Respect `opts.type` if provided.
  3. Produce `{ id, type, spec }` where `id` defaults to `opts.id` → URL filename → `'spec'`.

---

### `register(type, detector, handler)`

Extend AutoLoader with a new spec type.

* **Parameters**

  * `type` *(string)* — Canonical type name.
  * `detector` *(function)* — `(input) => boolean` returns true if input matches this type.
  * `handler` *(function)* — `(input) => object` returns a normalized `spec` object.

* **Returns**

  * `void`

* **Notes**

  * Built-in detectors cover common OpenAPI shapes.
  * Handlers may coerce or validate the input before returning.

---

## Type Detection

AutoLoader checks, in order:

1. **Forced type**: `opts.type`.
2. **Explicit field**: `input["x-type"]` if present.
3. **Signature heuristics**:

   * OpenAPI: string `input.openapi` beginning with `"3."` or `"2."`.
   * Custom: your registered `detector` functions.

If no detector matches, AutoLoader throws `E_SPEC_UNKNOWN_TYPE`.

---

## Usage Examples

### 1) Simple GET of OpenAPI JSON

```js
const a = new AutoLoader(net);
const { id, type, spec } = await a.load('/specs/pets.json', { id: 'pets' });
// type === 'openapi', spec is the parsed document
```

### 2) POST to retrieve a spec

```js
await a.load('https://api.example.com/spec', {
  method: 'post',
  payload: { tenant: 'acme' },
  http: { headers: { Authorization: 'Bearer …' } }
});
```

### 3) Force a type and forward HTTP options

```js
await a.load('/specs/internal.json', {
  type: 'openapi',
  http: { timeout: 4000, format: 'body' }
});
```

### 4) Register a custom type

```js
a.register('myproto',
  input => typeof input === 'object' && input?.myproto === '1.0',
  input => input // already normalized
);

const rec = await a.load('/specs/custom.json');
// rec.type may be 'myproto' if detector matched
```

---

## Integration with SpecManager

AutoLoader is usually **consumed** by `SpecManager.load()`:

```js
// inside SpecManager
const { id, type, spec } = await autoloader.load(source, opts);
registry.set(id, { type, spec });
```

This keeps `SpecManager` focused on **operation dispatch**, while AutoLoader handles **format detection** and **fetch mechanics**.

---

## Errors

* `E_SPEC_UNKNOWN_TYPE` — Could not determine type.
* `E_SPEC_FETCH_FAILED` — Network error or non-2xx status when retrieving the spec.
* `E_SPEC_INVALID_SHAPE` — Detector/handler rejected the input.

---

## Minimal Types (informal)

```ts
class AutoLoader {
  constructor(net: Net);
  async load(source: string | object, opts?: {
    id?: string;
    type?: string;
    method?: 'get' | 'post';
    payload?: any;
    http?: object;
  }): Promise<{ id: string; type: string; spec: object }>;
  register(type: string, detector: (input: any) => boolean, handler: (input: any) => object): void;
}
```

---

## See Also

* **CORE\_API\_SPEC\_MANAGER.md** — consumes AutoLoader results.
* **HTTP: Requests & Responses** — request options forwarded during fetch.


# --- end: docs/usage/CORE_API/AUTOLOADER.md ---



# --- begin: docs/usage/CORE_API/BATCH_LOADER.md ---

↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_BATCH\_LOADER

> Coordinate multiple HTTP requests with IDs, optional per‑item handlers, shared context, and simple success/failure semantics.
>
> BatchLoader powers patterns like “load config + locale + feature flags, then start the app,” and is exposed at `net.batch`.

---

## Overview

**BatchLoader** accepts a list of jobs (`{ id, method, url, handler, opts }`), executes them with concurrency control, stores results in an internal **context** map, and signals completion through a lightweight **SyncLoader** controller. Only a handler that returns **`false`** marks a request as failed; everything else is treated as success.

---

## Constructor

### `new BatchLoader(net, { fetch?, batch? } = {})`

Binds to the provided `net` instance and prepares defaults.

* **Parameters**

  * `net` *(Net)* — The parent network hub; must expose `http.get/post`.
  * `fetch` *(object, optional)* — Default HTTP options merged into each request (e.g., `{ format: 'full' }`).
  * `batch` *(function | false, optional)* — Custom batch handler. `false` selects the no‑op behavior; otherwise omitted ⇒ built‑in `batchStatus` (see below).

* **Properties**

  * `context: Record<string, any>` — Stores per‑ID results (unless suppressed by a custom handler).
  * `fetchOpts: object` — Default fetch options.
  * `batchHandler: function` — Function factory used to wrap per‑item handlers.

---

## Built‑in Batch Modes

Batch behavior is defined by a **handler factory** that wraps your per‑item `handler(res)`:

* **`batchStatus(obj, id, handler)`** *(default)* — Stores the result at `context[id]`. If `!res.ok`, returns `false` to signal failure. If a per‑item `handler` is provided, its return value is used.
* **`batchStore(obj, id, handler)`** — Always stores the result and treats it as success unless your `handler` returns `false`.
* **`batchNone(obj, id, handler)`** — Does not store anything automatically; you are responsible for storing and for returning `false` to signal failure.

> Note: In all modes, **only a returned `false`** marks the item failed. If your endpoint legitimately returns a boolean `false` body, wrap it (e.g., use `{ format: 'full' }` and inspect `res.body`).

---

## Method

### `async run(loadList, onLoad?, onFail?, { awaitAll = true, limit = 8 } = {})`

Submits the batch and returns a `SyncLoader` plus either a results map or an array of Promises (if not awaiting all).

* **`loadList`** *(Array)* — Each item:

  ```js
  {
    id: "config",                 // required unique ID
    method: "get" | "post",       // optional; defaults to "get" and validated
    url: "/config.json",          // required
    handler: (res) => any,          // optional per-item handler
    opts: { format: "full" },      // optional http opts merged with ctor defaults
    // post only
    data: any                       // body passed when method === 'post'
  }
  ```

* **`onLoad`** *(Function | Array | null)* — Called after all required IDs resolve successfully (or when `fail` is not provided). Signature: `(prepend, data)` where `prepend` includes `{ context, trigger, controller }`.

* **`onFail`** *(Function | Array | null)* — Called if **any** item handler returns `false`.

* **`awaitAll`** *(boolean)* —

  * `true` (default): resolves to `{ sync, results }` where `results` is a map `{ id → last handler result }`.
  * `false`: resolves to `{ sync, results }` where `results` is an array of live Promises submitted in order; poll `sync` for completion.

* **`limit`** *(number)* — Concurrency cap for in‑flight HTTP requests.

* **Returns**

  * `Promise<{ sync: SyncLoader, results: Record<string, any> | Promise<any>[] }>`

* **Behavior**

  1. Validates items (`id`, `url`, supported `method`, no duplicate IDs).
  2. Builds merged opts: `{ format: 'full', ...fetchOpts, ...item.opts }`.
  3. Schedules requests via a concurrency limiter (`limit`).
  4. Wraps each response with `SyncLoader.wrapper(id, batchWrapper(...))`.
  5. Invokes `onLoad` or `onFail` once all required IDs are set/failed.

---

## Context & Retrieval

* `context[id]` stores per‑item results by default (mode‑dependent).
* `get(id)` returns the stored value for that `id` (when using a storing batch mode).

---

## Error Handling

* **Validation** — Missing `id`/`url`, duplicate IDs, or unsupported methods throw immediately.
* **Per‑item failure** — Only a handler that returns `false` marks failure.
* **Network/HTTP errors** — Surface from the HTTP layer; with `format: 'full'`, you can inspect `res.ok`, `status`, and `body` inside your handler.

---

## Examples

### 1) Basic status‑checked batch (default behavior)

```js
const list = [
  { id: 'cfg',   url: '/cfg.json' },
  { id: 'langs', url: '/i18n/en.json' }
];

const { sync, results } = await net.batch.run(list, (prepend) => {
  console.log('ready', prepend.context);
});
```

### 2) Custom per‑item handler

```js
await net.batch.run([
  { id: 'cfg', url: '/cfg.json', opts: { format: 'full' }, handler: (res) => {
      if (!res.ok) return false;        // marks failure
      return res.body?.config;          // store derived value
  }}
]);
```

### 3) Non‑blocking mode with polling

```js
const { sync, results: promises } = await net.batch.run(
  [{ id: 'slow', url: '/big.json' }],
  null,
  null,
  { awaitAll: false }
);

// Later — check completion
if (sync.loaded()) {
  console.log('done, ok?', sync.success());
}
```

### 4) Switch to `batchStore` (always store)

```js
net.batch.setBatchHandler(net.batch.batchStore);
await net.batch.run([{ id: 'html', url: '/page.html', opts: { format: 'full' } }]);
const page = net.batch.get('html');
```

### 5) Use POST with body

```js
await net.batch.run([
  { id: 'token', method: 'post', url: '/oauth/token', data: { grant_type: 'client_credentials' },
    opts: { urlencoded: true, format: 'full' } }
]);
```

---

## Types (informal)

```ts
class BatchLoader {
  constructor(net: Net, opts?: { fetch?: object; batch?: Function | false });
  setFetchOpts(opts: object): void;
  setBatchHandler(fn: Function | false): void;
  get(id: string): any;
  run(
    loadList: Array<{ id: string; method?: 'get'|'post'; url: string; handler?: (res:any)=>any; opts?: object; data?: any }>,
    onLoad?: Function | null,
    onFail?: Function | null,
    options?: { awaitAll?: boolean; limit?: number }
  ): Promise<{ sync: SyncLoader, results: Record<string, any> | Promise<any>[] }>;
}
```

---

## See Also

* **CORE\_API\_HTTP.md** — request/response formats used inside item handlers.
* **CORE\_API\_SYNC\_LOADER.md** — controller semantics (`loaded()`, `failed()`, `success()`, `wrapper()`).
* **src/batch/customBatchHandlers.md** — writing your own batch handler.


# --- end: docs/usage/CORE_API/BATCH_LOADER.md ---



# --- begin: docs/usage/CORE_API/ERRORS.md ---

↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_ERRORS

> Error taxonomy and handling patterns across **HTTP**, **SpecManager**, **AutoLoader**, **Modules**, **BatchLoader**, and **SyncLoader**.
>
> Design principle: **do not throw on normal HTTP non‑2xx** — prefer returning structured results (`format: 'full'`) and let callers decide. Hard errors are reserved for programmer/config errors (e.g., invalid method, duplicate IDs).

---

## Quick Reference

| Area                    | When it happens                                        | Error surface / semantics                                         | Caller action                              |
| ----------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------ |
| HTTP (request build)    | Unsupported helper for method kind (e.g., body in GET) | Throws `Invalid HTTP method ... for _noBodyRequest/_bodyRequest`  | Fix call site; use correct helper          |
| HTTP (timeout/abort)    | Timeout elapsed or external `AbortSignal` fired        | Native `AbortError` rejection                                     | Catch and retry/cancel as needed           |
| HTTP (non‑2xx)          | Server responds `!ok`                                  | **No throw** by default; use `format:'full'` to inspect           | Check `ok/status/body` and branch          |
| HTTP (JSON parse)       | `content-type` JSON but invalid body                   | Parser throws                                                     | Catch; consider `format:'raw'`             |
| AutoLoader              | Unsupported or missing `x-type`                        | Throws `Error('unsupported or missing x-type: ...')`              | Verify loader availability or add a loader |
| SpecManager             | Spec not loaded / `operationId` missing                | Throws `Error('spec not found')` / `Error('operation not found')` | Load/refresh spec, fix ID                  |
| Modules                 | Dynamic import failed                                  | Rejected Promise from `import()`                                  | Catch; verify URL and CORS                 |
| BatchLoader (preflight) | Missing/duplicate IDs; unsupported method              | Throws with descriptive message                                   | Fix batch list                             |
| BatchLoader (per‑item)  | Handler returns `false`                                | Marks item failed; triggers `onFail` at end                       | Branch in `onFail`                         |
| SyncLoader              | N/A (controller)                                       | No throws; state tracked via `loaded/failed/success`              | Poll or use callbacks                      |

---

## Conventions

* **Do not throw on normal HTTP responses.** Use `format: 'full'` when you need `ok`, `status`, headers, and parsed `body` for routing error flows.
* **Throw early on programmer errors.** Incorrect method usage, invalid batch definitions, and missing spec/operation IDs throw with clear messages.
* **Failure ≠ exception in Batch/Sync.** In Batch flows, only a per‑item handler that **returns `false`** marks failure; otherwise the item is considered successful and stored in context.

---

## HTTP Errors & Diagnostics

### 1) Invalid helper usage

* `_noBodyRequest` only allows **GET/HEAD/OPTIONS/DELETE**; `_bodyRequest` only allows **POST/PUT/PATCH**. Passing the wrong method throws immediately with a descriptive message.

**Fix:** call an appropriate helper.

### 2) Abort / timeout

* If a `timeout` is set (or an external `AbortSignal` is provided), the request may reject with a native **`AbortError`**.

**Fix:** catch and decide whether to retry, surface, or cancel dependent work.

### 3) Non‑2xx responses

* The HTTP layer **does not throw** for `!res.ok`. Prefer `format: 'full'` and check `ok`/`status`.

```js
const res = await net.http.get('/v1/users/me', { format: 'full' });
if (!res.ok) {
  if (res.status === 401) return reauth();
  return showError(res.body?.message || 'Request failed');
}
return res.body;
```

### 4) Parse errors

* If `content-type` is JSON but the body is invalid, the JSON parser will throw. You can switch to `format:'raw'` to inspect the raw stream/text.

---

## AutoLoader Errors

* Loading from a URL/object requires a supported **`x-type`**. Missing or unsupported types result in a thrown `Error`.
* When `method:'post'` is provided, ensure `data` matches the server expectations; transport errors surface like HTTP errors above.

---

## SpecManager Errors

* **Spec not found**: calling `call(specId, ...)` before a successful `load()` throws.
* **Operation not found**: the provided `operationId` isn’t present in the spec; throws with a clear message.
* **Path param validation**: missing required `{path}` variables should throw before dispatch.

**Caller guidance:** verify IDs, re‑load/refresh specs after changes, and prefer `format:'full'` for inspectable responses.

---

## Module Loading Errors

* Dynamic `import(url)` rejects on network/CORS/parse errors. The manager logs a concise context line and re‑throws.

**Caller guidance:** wrap `await net.modules.load(...)` in `try/catch`; consider using `{ reload:true }` during hot‑reload flows.

---

## BatchLoader Errors & Failures

### Preflight validation (throws)

* Missing `id` or `url`
* Duplicate `id`
* Unsupported HTTP `method` (only `'get' | 'post'` are valid)

### Runtime failure (no throw)

* Only a per‑item handler that **returns `false`** marks the item failed. Failure triggers the batch’s `onFail` callback once **all required IDs** have resolved.
* By default, results are stored in `context[id]` for later retrieval; custom batch handlers may change this behavior.

**Tip:** use `opts: { format:'full' }` inside items to branch on `res.ok` without exceptions.

---

## SyncLoader Failure Semantics

* `set(id)` marks a task as completed.
* `fail(id)` flags a task as failed (still counts toward completion).
* Final callback routing: if **any** task failed, `fail` is used (when provided), otherwise `load`.
* `wrapper(id, handler)` interprets `handler(...args) === false` as failure, then calls `set(id)` automatically.

---

## Patterns & Recipes

### Pattern: Centralize HTTP error routing

```js
const http = net.http;

async function safeJSON(path, opts) {
  const res = await http.get(path, { format: 'full', ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.body;
}
```

### Pattern: Batch with explicit fail rules

```js
await net.batch.run([
  { id: 'cfg', url: '/cfg.json', opts: { format: 'full' }, handler: res => res.ok ? res.body : false },
  { id: 'i18n', url: '/i18n/en.json', opts: { format: 'full' }, handler: res => res.ok ? res.body : false }
], ({ context }) => bootstrap(context), ({ controller }) => showBanner(controller.fail));
```

### Pattern: Guard module imports

```js
try {
  const utils = await net.modules.load('utils', '/lib/utils.js');
  utils.ready();
} catch (e) {
  console.error('Module load failed', e);
}
```

---

## Suggested Error Codes (optional)

Use these in docs/UI; runtime throws are plain `Error` unless you layer your own classes.

* `E_HTTP_UNSUPPORTED_METHOD`
* `E_HTTP_INVALID_FETCH_OPTION`
* `E_HTTP_ABORTED`
* `E_SPEC_NOT_FOUND`
* `E_SPEC_OPERATION_NOT_FOUND`
* `E_SPEC_PATH_PARAM_MISSING`
* `E_AUTOLOADER_UNSUPPORTED_TYPE`
* `E_MODULE_LOAD_FAILED`
* `E_BATCH_DUPLICATE_ID`
* `E_BATCH_INVALID_METHOD`

---

## Troubleshooting Checklist

* Verify **method helper** matches the intended verb.
* Use `format:'full'` when debugging — surfaces `status`, `headers`, and `elapsedMs`.
* Watch for **CORS** in module/spec loads (imports and fetch share origin policy).
* In Batch flows, confirm your **handlers return `false`** on failure.
* Prefer **explicit path params** in spec calls and assert required fields in dev.


# --- end: docs/usage/CORE_API/ERRORS.md ---



# --- begin: docs/usage/CORE_API/EXTENSIBILITY.md ---

↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_EXTENSIBILITY

## Overview

m7Fetch is designed to be extended — both through subclassing core classes and by injecting or replacing modules at runtime. The architecture avoids locking behavior behind private symbols, so developers can adjust defaults, add methods, or override core logic as needed.

---

## Key Extension Points

### 1. **Subclassing Core Components**

* **HTTP**

  * Override `FETCH_DEFAULTS` to set organization-wide fetch options.
  * Override methods like `parseOpts`, `buildDefaultFetchOpts`, or `buildBase` for URL resolution rules.
* **SpecManager**

  * Extend to support new spec formats or alternate `call()` dispatch logic.
* **BatchLoader / SyncLoader**

  * Subclass to add instrumentation, telemetry hooks, or alternate handler policies.

Example:

```js
import HTTP from 'm7fetch/core/HTTP.js';

class MyHTTP extends HTTP {
  static FETCH_DEFAULTS = {
    mode: 'same-origin',
    credentials: 'include'
  };
}
```

---

### 2. **Custom Batch Handlers**

BatchLoader accepts `batch` in constructor opts:

* Pass your own `(obj, id, handler, ...extra)` to change success/failure marking or result storage.
* Built-in: `batchStatus`, `batchStore`, `batchNone`.

---

### 3. **Module Loader Injection**

* AutoLoader + Modules system allows new loader types — e.g., remote ES modules, WASM packages.
* Register your own loader or resolver via subclassed `Modules` manager.

---

### 4. **Composable Options Objects**

* All core calls accept `opts` objects merged with defaults.
* This makes it easy to add flags like `trace: true` or `retry: 3` and consume them in an overridden method.

---

## Extensibility Patterns

* **Decorator Pattern:** Wrap existing class instances to intercept calls without subclassing.
* **Adapter Pattern:** Provide alternate implementations of HTTP or SpecManager with the same method signatures.
* **Plugin Approach:** Supply loader functions, batch handlers, or spec parsers at runtime.

---

## Notes & Cautions

* Avoid mutating shared singletons in long-running apps — prefer instance-specific overrides.
* If overriding network behavior, validate against `FETCH_CONSTANTS` to maintain compatibility.
* Extending beyond documented APIs may require revisiting after major version updates.


# --- end: docs/usage/CORE_API/EXTENSIBILITY.md ---



# --- begin: docs/usage/CORE_API/FETCH_CONSTANTS.md ---

↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_FETCH\_CONSTANTS

`FETCH_CONSTANTS` is a static export providing **allowed values** for certain [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) request options.
It is consumed by `HTTP.buildDefaultFetchOpts()` to validate and merge user‐provided settings with defaults.

---

## Keys & Allowed Values

| Option           | Allowed Values                                                                                                                                                                     | Notes                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `mode`           | `"cors"`, `"no-cors"`, `"same-origin"`                                                                                                                                             |                                             |
| `cache`          | `"default"`, `"no-store"`, `"reload"`, `"no-cache"`, `"force-cache"`, `"only-if-cached"`                                                                                           |                                             |
| `referrer`       | *(commented out in default)* `"no-referrer"`, `"client"`, or a string URL                                                                                                          | Values not enforced; any string URL passes  |
| `priority`       | `"auto"`, `"high"`, `"low"`                                                                                                                                                        |                                             |
| `keepalive`      | `true`, `false`                                                                                                                                                                    |                                             |
| `integrity`      | *(no restrictions — valid SRI strings)*                                                                                                                                            |                                             |
| `referrerPolicy` | `"no-referrer"`, `"no-referrer-when-downgrade"`, `"origin"`, `"origin-when-cross-origin"`, `"same-origin"`, `"strict-origin"`, `"strict-origin-when-cross-origin"`, `"unsafe-url"` |                                             |
| `credentials`    | `"omit"`, `"same-origin"`, `"include"`                                                                                                                                             |                                             |
| `redirect`       | `"follow"`, `"error"`, `"manual"`                                                                                                                                                  |                                             |
| `duplex`         | `"half"`                                                                                                                                                                           |                                             |
| `signal`         | `true`, `false`                                                                                                                                                                    | Enables/disables AbortController signal use |

---

## Usage in `HTTP`

When you create an `HTTP` instance or call a request method, any of the above keys can be included in the options.
`HTTP.buildDefaultFetchOpts(opts)` will:

* Look up the allowed values in `FETCH_CONSTANTS`.
* Apply only those that are explicitly allowed for that key (empty array = any value allowed).
* Merge them with `HTTP.FETCH_DEFAULTS`.

Example:

```js
import { HTTP, constants as FETCH_CONSTANTS } from 'm7fetch';

const http = new HTTP({
  mode: 'cors',              // valid
  credentials: 'include',    // valid
  priority: 'high'           // valid
});

// Invalid values will be ignored
```

---

## See Also

* **CORE\_API\_HTTP.md** — consumer of these constants.
* [MDN: Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) — background on these options.


# --- end: docs/usage/CORE_API/FETCH_CONSTANTS.md ---



# --- begin: docs/usage/CORE_API/HTTP.md ---

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


# --- end: docs/usage/CORE_API/HTTP.md ---



# --- begin: docs/usage/CORE_API/MODULES.md ---

↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_MODULES

> Runtime **dynamic imports** with a tiny registry. Use `net.modules.load(id, url)` to import an ES module and retrieve its namespace. Subsequent calls return the cached module unless you opt to invalidate.

---

## Overview

The **ModuleManager** is a thin convenience wrapper around `import()` that:

* Keeps a **registry** of loaded modules keyed by `id`.
* Normalizes **absolute vs relative** URLs via the HTTP base rules when helpful.
* Provides simple **cache control** (re‑load / invalidate patterns).
* Plays nicely with **BootStrap** or other systems that want to look up modules by ID later.

---

## Constructor

### `new ModuleManager(net)`

Creates a module manager bound to a `Net` instance (used for URL resolution and shared defaults).

* **Parameters**

  * `net` *(Net)* — A `Net` with configured HTTP/base URL semantics.

* **Returns**

  * `ModuleManager` instance with `load`, `get`, `has`, `unload` helpers.

---

## Methods

### `async load(id, url, opts?)`

Dynamically import a module and register it under `id`.

* **Parameters**

  * `id` *(string)* — Registry key to store the module namespace under.
  * `url` *(string)* — URL to the module (relative or absolute). Relative paths resolve against the HTTP base when set.
  * `opts` *(object, optional)*

    * `force` *(boolean)* — If `true`, bypass cache and re‑import (adds a cache‑busting query param by default).
    * `resolve` *(function)* — Optional `(url, net) => string` to customize resolution.

* **Returns**

  * `Promise<any>` — The module namespace (what `import(url)` returns).

* **Behavior**

  * If `id` already exists and `force !== true`, returns the cached module.
  * If `force === true`, re‑imports the URL (e.g., `?t=TIMESTAMP`) and replaces the cache.

### `get(id)`

Return the cached module namespace for `id`, or `undefined` if missing.

### `has(id)`

Boolean — `true` if a module with `id` exists in the registry.

### `unload(id)`

Remove the entry from the registry (does **not** purge the browser/module loader cache). Useful to opt a name out of lookups; a subsequent `load(id, url, { force:true })` will re‑import.

---

## URL Resolution

* **Absolute URLs** (`https://…`) import as‑is.
* **Relative URLs** are resolved against `net.http` base URL when configured; otherwise, they are resolved relative to the current document/module.
* Provide a custom `opts.resolve(url, net)` to inject repo/CDN rewriting.

---

## Examples

### 1) Basic load and call

```js
import Net from 'm7Fetch';
const net = new Net();

const math = await net.modules.load('math', '/modules/math.js');
console.log(math.add(2, 3));
```

### 2) Cache busting / hot reload during dev

```js
await net.modules.load('plugin', '/plugins/logger.js', { force: true });
```

### 3) Custom resolver (CDN rewrite)

```js
await net.modules.load(
  'ui.toast',
  'ui/toast.js',
  { resolve: (url, net) => new URL(url, 'https://cdn.example.com/app/').href }
);
```

### 4) Lookup from elsewhere

```js
const toast = net.modules.get('ui.toast');
toast.show('Hello');
```

---

## Error Handling

* **Duplicate IDs**: calling `load(id, url)` twice returns the cached module unless `force:true` is passed.
* **Failed import**: errors from dynamic `import()` propagate; wrap with `try/catch` or prefer `format:'full'` on related HTTP probes.
* **URL typos**: path resolution follows the same rules as HTTP; verify base URL if relative imports fail.

---

## Interaction with Other Systems

* **Specs/HTTP**: independent. Only uses Net’s base rules for URL resolution.
* **Batch**: not used directly; module import is a single async operation.
* **BootStrap**: modules loaded here can be referenced by ID in your bootstrap/mount flows.

---

## Minimal Types (informal)

```ts
class ModuleManager {
  constructor(net: Net)
  load(id: string, url: string, opts?: { force?: boolean; resolve?: (url: string, net: Net) => string }): Promise<any>
  get(id: string): any | undefined
  has(id: string): boolean
  unload(id: string): boolean
}
```

---

## See Also

* **CORE\_API\_NET.md** — where `modules` is exposed.
* **EXAMPLES\_LIBRARY.md** — dynamic module load and invocation recipes.


# --- end: docs/usage/CORE_API/MODULES.md ---



# --- begin: docs/usage/CORE_API/NET.md ---

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


# --- end: docs/usage/CORE_API/NET.md ---



# --- begin: docs/usage/CORE_API/OVERVIEW.md ---

← Back to [Usage Guide Index](../TOC.md)

# CORE\_API\_OVERVIEW

> Sub‑TOC for the core public APIs of **m7Fetch**. Each entry links to a dedicated page with full method signatures, options, return shapes, and examples.

---

## 1) [NET](./NET.md)

* The top‑level hub that composes the subsystems: **HTTP**, **Specs**, **Modules**, and **Batch**.
* Covers constructor options, lifecycle, and how to pass defaults down to subsystems.

## 2) [HTTP](./HTTP.md)

* Request helpers: `get`, `post`, `put`, `patch`, `delete`, `head`, `options`.
* Request options (base URL, headers, `json`/`urlencoded`, `timeout`, `signal`).
* Response formats: `body` | `full` | `raw`.
* Roadmap slots: **HTTP/2**, streaming, retries/backoff.

## 3) [SPEC\_MANAGER](./SPEC_MANAGER.md)

* `specs.load(source, opts)` and `specs.call(apiId, operationId, args)`.
* Parameter groups (`path`, `query`, `headers`, `body`) and format passthrough.
* Multiple specs, IDs/namespacing, and operation resolution.

## 4) [AUTOLOADER](./AUTOLOADER.md)

* Type inference and dispatch for spec loading (e.g., `x-type`).
* GET/POST retrieval and option forwarding to HTTP.
* Extending with custom loaders.

## 5) [MODULES](./MODULES.md)

* `modules.load(id, url)` returns the module namespace (dynamic `import()`).
* Registry semantics, caching, and invalidation patterns.

## 6) [BATCH\_LOADER](./BATCH_LOADER.md)

* `batch.run(loadList, onLoad, onFail, { awaitAll, limit })`.
* Item schema, handler contract (only **`false`** marks failure).
* Context storage (`context[id]`), concurrency limits, and result maps.

## 7) [SYNC\_LOADER](./SYNC_LOADER.md)

* Minimal coordinator used by BatchLoader.
* `require(ids)`, `wrapper(id, handler)`, `loaded/failed/success`.
* Callback rules and polling patterns.

## 8) [FETCH\_CONSTANTS](./FETCH_CONSTANTS.md)

* Enumerated/validated fetch option sets (e.g., `mode`, `cache`, `credentials`, `referrerPolicy`).
* How validation interacts with `HTTP.FETCH_DEFAULTS`.

## 9) [TYPES\_AND\_REPORTS](./TYPES.md)

* Shapes for HTTP responses (by `format`) and batch results.
* Recommended typings/JSDoc for public methods.
* Future: `.d.ts` bundles.

## 10) [ERRORS](./ERRORS.md)

* Error taxonomy and codes (e.g., `E_BATCH_DUP_ID`, `E_HTTP_UNSUPPORTED_METHOD`).
* Guidance for structured logs and observability.

## 11) [EXTENSIBILITY](./EXTENSIBILITY.md)

* Custom batch handlers, HTTP debug hooks, and spec loader extensions.
* Integration points for metrics/telemetry.

## 12) [VERSIONING\_AND\_COMPAT](./VERSIONING.md)

* API stability policy, deprecation paths, and migration notes.

---

### See also

* **[BASIC\_CONCEPTS.md](./BASIC_CONCEPTS.md)** — narrative overview of how pieces fit together.
* **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** — deeper guidance on requests/responses.
* **[BATCHING\_AND\_COORDINATION.md](./BATCHING_AND_COORDINATION.md)** — patterns & recipes.


# --- end: docs/usage/CORE_API/OVERVIEW.md ---



# --- begin: docs/usage/CORE_API/SPEC_MANAGER.md ---

↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_SPEC\_MANAGER

> Handles loading API specifications (OpenAPI, custom JSON) and calling operations by `operationId`. Used by `Net` as `net.specs`.

---

## Overview

`SpecManager` provides:

* **Spec loading** — from URL, object, or inline JSON.
* **Operation calls** — build and send HTTP requests by spec `operationId`.
* **Multiple spec support** — register and address specs by a short name.
* **Parameter mapping** — route `path`, `query`, `header`, and `body` params from call options.

---

## Constructor

### `new SpecManager(net)`

Creates a new spec manager bound to a `Net` instance.

* **Parameters**

  * `net` *(Net)* — A `Net` instance with a configured `.http` client.

* **Returns**

  * `SpecManager` instance with `.load()` and `.call()` methods.

---

## Methods

### `async load(source, opts?)`

Load a spec into the registry.

* **Parameters**

  * `source` *(string | object)* — URL to fetch JSON spec from, or an object with the spec already loaded.
  * `opts` *(object, optional)*

    * `id` *(string)* — Registry key to store the spec under. Defaults to filename (URL) or `opts.id`.
    * `type` *(string)* — Explicit spec type (e.g., `openapi`).
    * `http` *(object)* — Options to pass through to `net.http.get()`.

* **Returns**

  * `Promise<{ id: string, spec: object }>` — The stored ID and parsed spec.

* **Notes**

  * If `source` is a string, it is fetched via `net.http.get(source, { format: 'body', ...opts.http })`.
  * Specs are stored in an internal registry keyed by `id`.
  * Reloading an existing `id` replaces the spec.

---

### `async call(specId, operationId, params?, opts?)`

Invoke an operation from a loaded spec.

* **Parameters**

  * `specId` *(string)* — The ID of the spec to use.
  * `operationId` *(string)* — The `operationId` in the spec’s `paths`.
  * `params` *(object, optional)* —

    * `path` *(object)* — Values to replace in `{path}` variables.
    * `query` *(object)* — Query string parameters.
    * `headers` *(object)* — Extra headers.
    * `body` *(any)* — Request body (JSON by default).
  * `opts` *(object, optional)* — Extra options for `net.http` (e.g., `format`, `timeout`).

* **Returns**

  * Resolves to whatever `.http` returns (body, full, or raw depending on `opts.format`).

* **Process**

  1. Look up the spec by `specId`.
  2. Find the path + method with matching `operationId`.
  3. Replace `{path}` params.
  4. Append `query` params.
  5. Build headers and body.
  6. Call `net.http[method](url, builtOpts)`.

* **Errors**

  * Throws if spec or operation not found.
  * Throws if required path params are missing.

---

## Usage Examples

### 1) Load and call OpenAPI spec

```js
await net.specs.load('/specs/pets.json', { id: 'pets' });
const pets = await net.specs.call('pets', 'listPets', {
  query: { limit: 10 }
}, { format: 'full' });
console.log(pets.status, pets.body);
```

### 2) Inline spec object

```js
await net.specs.load({
  openapi: '3.0.0',
  info: { title: 'Mini API', version: '1.0.0' },
  paths: { '/ping': { get: { operationId: 'ping', responses: { 200: {} } } } }
}, { id: 'mini' });

const pong = await net.specs.call('mini', 'ping');
```

### 3) Path parameters

```js
await net.specs.load('/specs/orders.json', { id: 'orders' });
await net.specs.call('orders', 'getOrder', {
  path: { orderId: 42 }
});
```

---

## Parameter Handling Rules

* **Path** — Required params must be provided; `{var}` tokens are replaced directly.
* **Query** — Serialized and appended; arrays repeat keys.
* **Headers** — Merged with spec defaults and HTTP defaults.
* **Body** — Passed as `json` unless `opts.body` is explicitly set.

---

## Tips & Pitfalls

* Always load the spec before calling operations.
* Match `operationId` exactly as in the spec.
* Use `format: 'full'` to inspect `ok`, `status`, and headers for debugging.
* Specs can be swapped or reloaded at runtime — keep references to `specId` consistent.

---

## Minimal Types (informal)

```ts
class SpecManager {
  async load(source: string | object, opts?: { id?: string, type?: string, http?: object }): Promise<{ id: string, spec: object }>;
  async call(specId: string, operationId: string, params?: { path?: object, query?: object, headers?: object, body?: any }, opts?: object): Promise<any>;
}
```

---

## See Also

* **CORE\_API\_HTTP.md** — HTTP client used for actual requests.
* **OpenAPI 3.0 Specification** — Parameter objects, `operationId` rules.


# --- end: docs/usage/CORE_API/SPEC_MANAGER.md ---



# --- begin: docs/usage/CORE_API/SYNC_LOADER.md ---

↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_SYNC\_LOADER

> A minimal coordinator that tracks completion of **named async tasks** and triggers a final callback when the required set is done. Only tasks whose handler returns **`false`** are marked as failed; all others count as success.

---

## Overview

`SyncLoader` is a small controller used by **BatchLoader** and other systems to:

* Declare a set of **required IDs** to complete
* Mark each ID as **set** (success) or **fail** (non‑blocking)
* Trigger a final **onLoad** (or **onFail**) once all required IDs are resolved
* Provide a **wrapper(id, handler)** utility to integrate easily with Promises/events

**Internal state (`controller`)**

```ts
{
  check: Record<string, 1>,  // required ids
  run:   Record<string, 1>,  // completed (success or fail)
  fail:  Record<string, 1>,  // those explicitly failed
  lock?: string              // id that triggered final callback
}
```

When the last required ID resolves, SyncLoader calls either `onFail` (if any failed) or `onLoad` with a small prepend object.

---

## Constructor

### `new SyncLoader({ load, fail, require = [], prepend } = {})`

* **`load(prepend, ...args)`** — called when all required tasks are finished (and none failed, or `fail` not provided).
* **`fail(prepend, ...args)`** — called if any task was marked failed; if omitted, `load` is used instead.
* **`require`** — initial list of IDs to track.
* **`prepend`** — arbitrary value passed as `{ prepend, controller, trigger }` to the final callback.

**Prepend object**

```ts
{ prepend: any, controller: ControllerState, trigger: string }
```

---

## Core API

### `require(ids)`

Declare one or more required IDs. May be called multiple times; duplicates are ignored.

### `set(id, ...args)`

Mark an ID as completed (success). If all required IDs are completed and `lock` is unset, triggers the final callback.

### `fail(id, ...args)`

Mark an ID as failed (still counts toward completion). Final callback will route to `fail` if provided.

### `loaded(id?) => boolean`

* With an `id`: whether that specific task has completed (success or fail).
* Without an `id`: whether **all** required tasks are complete.

### `failed(id?) => boolean`

* With an `id`: whether that task was marked failed.
* Without an `id`: whether **any** task failed.

### `success() => boolean`

Convenience: `!failed()`.

### `wrapper(id, handler?) => (...args) => any`

Returns a function suitable for `.then()`/callbacks. Execution rules:

1. Runs `handler(...args)` if provided; otherwise treats as success.
2. If the handler returns **`false`**, calls `fail(id, ...args)`.
3. Always calls `set(id, ...args)` afterward.
4. Returns the first arg (`args[0]`) if present, otherwise the handler’s return.

### `asPromise() => Promise`

Experimental helper that resolves when all required tasks are complete. It overrides `onLoad` internally; avoid mixing with custom `load` handlers.

---

## Usage Examples

### 1) Wrap fetch calls

```js
const sync = new SyncLoader({ require: ["cfg", "lang"], load: ({ controller }) => {
  console.log("all done", controller);
}});

fetch('/cfg.json').then(sync.wrapper('cfg', res => res.ok ? res : false));
fetch('/i18n/en.json').then(sync.wrapper('lang', res => res.ok ? res : false));
```

### 2) Manual set/fail

```js
const sync = new SyncLoader({ require: ['db', 'fs'], fail: ({ controller }) => console.warn('some failed', controller) });

try { await openDB(); sync.set('db'); } catch (e) { sync.fail('db', e); sync.set('db'); }
try { await mountFS(); sync.set('fs'); } catch (e) { sync.fail('fs', e); sync.set('fs'); }
```

### 3) Promise style

```js
const sync = new SyncLoader({ require: ['a','b'] });
const done = sync.asPromise();

someAsync().then(sync.wrapper('a'));
otherAsync().then(sync.wrapper('b'));
await done; // all required tasks reached set()/fail()
```

---

## Notes & Gotchas

* **Failure semantics:** only a handler **returning `false`** marks failure. If an endpoint legitimately returns boolean `false`, wrap it (e.g., check a `Response.ok` field) before returning.
* **Final callback routing:** if any task failed, `fail` is invoked; otherwise `load`. If `fail` is not supplied, `load` is used for both paths.
* **Locking:** only the **first** ID that completes the set triggers the final callback; subsequent completions are ignored for triggering.
* **Prepend ergonomics:** the `prepend` value you pass to the constructor is always surfaced back in the final callback via `{ prepend, controller, trigger }`.

---

## Types (informal)

```ts
class SyncLoader {
  constructor(opts?: { load?: Function; fail?: Function; require?: string[]; prepend?: any });
  require(ids: string|string[]): boolean;
  set(id: string, ...args: any[]): boolean;
  fail(id: string, ...args: any[]): boolean;
  loaded(id?: string): boolean;
  failed(id?: string): boolean;
  success(): boolean;
  wrapper(id: string, handler?: (...a:any[])=>any): (...a:any[])=>any;
  asPromise(): Promise<any>;
}
```

---

## See Also

* **CORE\_API\_BATCH\_LOADER.md** — how `SyncLoader` coordinates batch completion.
* **CORE\_API\_HTTP.md** — shaping responses for handlers (e.g., use `format:'full'`).


# --- end: docs/usage/CORE_API/SYNC_LOADER.md ---



# --- begin: docs/usage/CORE_API/TYPES.md ---

← Back to [Usage Guide Index](TOC.md)

# CORE\_API\_TYPES (Types & Reports)

> Reference shapes for public return values and helper types across **HTTP**, **SpecManager**, **BatchLoader**, and **SyncLoader**. Use these when writing TypeScript typings, JSDoc, or when integrating with your own type layers.

---

## HTTP Return Shapes

### `format: 'body'` (default)

```ts
export type HTTPBody = any; // Parsed according to content-type & opts.json
```

* If the response `content-type` includes `application/json`, body is `await res.json()`; otherwise `await res.text()`.

### `format: 'full'`

```ts
export interface HTTPFull<TBody = any> {
  status: number;
  statusText: string;
  ok: boolean;
  url: string;
  redirected: boolean;
  elapsedMs: number | null;
  headers: Record<string, string>;
  body: TBody; // parsed as above
}
```

### `format: 'raw'`

```ts
export type HTTPRaw = Response; // native fetch Response
```

### Method Signatures (informal)

```ts
// All return a Promise of one of the above, based on opts.format
export interface RequestOpts {
  params?: Record<string, any>;     // for GET-like
  headers?: Record<string, string>;
  json?: boolean;                   // default true
  urlencoded?: boolean;             // encode body as application/x-www-form-urlencoded
  absolute?: boolean;               // bypass base URL
  timeout?: number;                 // ms
  format?: 'body' | 'full' | 'raw'; // default 'body'
  handler?: (data: any) => void;    // side-effect hook
  // plus validated Fetch options per CORE_API_FETCH_CONSTANTS
}

export interface HTTP {
  get(path: string, opts?: RequestOpts): Promise<HTTPBody | HTTPFull | HTTPRaw>;
  delete(path: string, opts?: RequestOpts): Promise<HTTPBody | HTTPFull | HTTPRaw>;
  head(path: string, opts?: RequestOpts): Promise<HTTPBody | HTTPFull | HTTPRaw>;
  options(path: string, opts?: RequestOpts): Promise<HTTPBody | HTTPFull | HTTPRaw>;
  post(path: string, data?: any, opts?: RequestOpts): Promise<HTTPBody | HTTPFull | HTTPRaw>;
  put(path: string, data?: any, opts?: RequestOpts): Promise<HTTPBody | HTTPFull | HTTPRaw>;
  patch(path: string, data?: any, opts?: RequestOpts): Promise<HTTPBody | HTTPFull | HTTPRaw>;
}
```

### Debug Report (optional helper)

```ts
export interface HTTPDebugReport<TBody = any> {
  status: number;
  ok: boolean;
  url: string;
  elapsedMs: number | null;
  headers: Record<string, string>;
  body: TBody;
}
```

> Emitted if you wire a debug handler that expects `format: 'full'` responses.

---

## SpecManager Types

Spec calls **forward to HTTP** and therefore share the same return union based on `opts.format`:

```ts
export type SpecCallResult = HTTPBody | HTTPFull | HTTPRaw;

export interface SpecManager {
  load(source: string | object, opts?: { id?: string; type?: string; http?: RequestOpts }): Promise<{ id: string; spec: object }>;
  call(specId: string, operationId: string, params?: {
    path?: Record<string, string|number>;
    query?: Record<string, any>;
    headers?: Record<string, string>;
    body?: any;
  }, opts?: RequestOpts): Promise<SpecCallResult>;
}
```

---

## BatchLoader Types

### Item & Options

```ts
export type BatchMethod = 'get' | 'post';

export interface BatchItem {
  id: string;                        // unique ID
  method?: BatchMethod;              // default 'get'
  url: string;
  handler?: (res: any) => any;       // return false ⇒ marks failure
  opts?: RequestOpts;                // forwarded to HTTP
  data?: any;                        // body when method === 'post'
}

export interface BatchRunOpts {
  awaitAll?: boolean; // default true
  limit?: number;     // concurrency cap (default ~8)
}
```

### Results

```ts
export interface BatchRunResultAwaitAll {
  sync: SyncLoader;
  results: Record<string, any>;      // { id → handler result }
}

export interface BatchRunResultStreaming {
  sync: SyncLoader;
  results: Promise<any>[];           // unresolved promises in submission order
}

export type BatchRunResult = BatchRunResultAwaitAll | BatchRunResultStreaming;
```

### BatchLoader Interface (informal)

```ts
export interface BatchLoader {
  context: Record<string, any>;
  setFetchOpts(opts: object): void;
  setBatchHandler(fn: Function | false): void; // choose store/status/none or custom
  get(id: string): any;
  run(loadList: BatchItem[],
      onLoad?: (prepend: Prepend, data?: any) => void | null,
      onFail?: (prepend: Prepend, data?: any) => void | null,
      options?: BatchRunOpts
  ): Promise<BatchRunResult>;
}

export interface Prepend {
  context: Record<string, any>;
  trigger: string;                    // id that completed the set
  controller: SyncControllerState;    // internal sync state
}
```

---

## SyncLoader Types

```ts
export interface SyncControllerState {
  check: Record<string, 1>;  // required ids
  run:   Record<string, 1>;  // completed (success or fail)
  fail:  Record<string, 1>;  // explicitly failed
  lock?: string;             // id that triggered final callback
}

export interface SyncLoader {
  require(ids: string | string[]): boolean;
  set(id: string, ...args: any[]): boolean;
  fail(id: string, ...args: any[]): boolean;
  loaded(id?: string): boolean;
  failed(id?: string): boolean;
  success(): boolean;
  wrapper(id: string, handler?: (...a: any[]) => any): (...a: any[]) => any;
  asPromise(): Promise<any>;
}
```

---

## Example: End-to-End Typed Call

```ts
import type { HTTPFull } from './CORE_API_TYPES';

const res = await net.http.get('/users/me', { format: 'full' }) as HTTPFull<{ id: string; email: string }>;
if (!res.ok) throw new Error(`HTTP ${res.status}`);
console.log(res.body.email);
```

---

## Notes

* These are **informal** type shapes that match runtime behavior. They are suitable for authoring `.d.ts` files or JSDoc typedefs.
* For Fetch option enums, see **CORE\_API\_FETCH\_CONSTANTS.md**.
* Failure semantics in batches: **only** a handler that returns `false` marks an item as failed.


# --- end: docs/usage/CORE_API/TYPES.md ---



# --- begin: docs/usage/CORE_API/VERSIONING.md ---

↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_VERSIONING (Versioning & Compatibility)

## Overview

m7Fetch follows **semantic versioning** principles (MAJOR.MINOR.PATCH) for public API stability. Breaking changes are gated to **major releases**. Minor and patch updates are additive or bug‑fix only.

This page covers:

* How versioning works for core classes and APIs
* How to maintain compatibility across upgrades
* Recommended practices for consuming the library in long‑lived projects

---

## Versioning Policy

### 1. **MAJOR** — Breaking Changes

* Removal or renaming of public methods/properties.
* Changes to method signatures or option shapes.
* Alterations to default behaviors that could break existing code.
* Removal of deprecated features flagged in prior major versions.

### 2. **MINOR** — Backwards‑Compatible Additions

* New public methods, classes, or configuration options.
* Additional allowed values in enums (e.g., `FETCH_CONSTANTS`).
* New batch handlers, spec loaders, or module loader types.

### 3. **PATCH** — Bug Fixes / Internal Improvements

* Non‑breaking bug fixes.
* Performance optimizations.
* Documentation and tooling changes.

---

## Compatibility Guidelines

### For Consumers

* Pin a **minor version range** (`^1.4.0`) to get bug fixes and additive features without breaking changes.
* Review changelogs before bumping major versions.
* Use `format:'full'` when you need stable inspection of responses; body shapes can vary by endpoint, but the `full` envelope is stable.
* Avoid relying on undocumented internal properties — they may change in any release.

### For Extenders

* If subclassing core classes, prefer using documented methods and hooks.
* Watch for deprecation notices in the release notes; migrate before the next major.
* If overriding defaults (e.g., `FETCH_DEFAULTS`), verify against `FETCH_CONSTANTS` after minor bumps.

---

## Deprecation Process

* Deprecated APIs will be annotated in docs and release notes.
* Removal will occur **no sooner** than the next major release.
* Where feasible, shims or adapter methods will be provided during the deprecation period.

---

## Testing & Verification

* Maintain integration tests for your usage of m7Fetch APIs.
* After upgrading, run full test suites before deploying.
* For network‑sensitive changes (HTTP, SpecManager), use a staging environment to validate against your APIs.

---

## Example Upgrade Workflow

```sh
# Update to latest minor within major 1
npm install m7fetch@^1.4.0

# Review changelog for any new features you might use
# Run test suite
npm test
```

When upgrading to a **new major** (e.g., 1.x → 2.x):

1. Read the migration guide in the repo/docs.
2. Update code where APIs were removed or changed.
3. Run tests and manual checks.

---

## Resources

* [Semantic Versioning 2.0.0](https://semver.org/)
* Project changelog (in repo root)
* Migration guides (docs/migration/)


# --- end: docs/usage/CORE_API/VERSIONING.md ---



# --- begin: docs/usage/ERROR_HANDLING_AND_DEBUGGING.md ---

← Back to [Usage Guide Index](TOC.md)

# ERROR\_HANDLING & DEBUGGING

Practical patterns for surfacing failures, inspecting responses, and adding observability to **m7Fetch** (HTTP, Specs, Modules, Batch/Sync).

---

## Overview

* Prefer **structured responses** with `format: "full"` while developing.
* Distinguish **transport errors** (network, CORS) from **application errors** (HTTP 4xx/5xx with JSON body).
* In batches, only a **handler returning `false`** marks an item failed.

---

## Use `format: "full"` during development

Get `{ ok, status, headers, body }` for decisions and logs.

```js
const res = await net.http.get("/thing", { format: "full" });
if (!res.ok) {
  console.error("HTTP error", { route: "/thing", status: res.status, body: res.body });
}
```

### Inspect headers and status

```js
const res = await net.http.head("/file", { format: "full" });
console.log(res.status, Object.fromEntries(res.headers));
```

---

## Common failure modes (HTTP)

* **CORS blocked** → Server must allow your origin/method/headers.
* **Cookies not sent** → Missing `credentials: "include"` or cookie flags.
* **Wrong body encoding** → Add `{ urlencoded: true }` or send `FormData/Blob`.
* **Binary mishandled** → Use `format: "raw"` and decode manually.
* **Timeout** → Provide `timeout` (ms) or pass your own `AbortSignal`.

```js
try {
  const res = await net.http.post("/login", { u: "a", p: "b" }, { urlencoded: true, format: "full", timeout: 5000 });
  if (!res.ok) throw new Error(res.body?.message || `status ${res.status}`);
} catch (err) {
  console.error("login failed", err);
}
```

---

## Batch/Sync errors (coordination layer)

* **Only `false` fails**: if a handler returns `false`, that ID is marked failed.
* **Default behavior**: the default batch handler stores the response and treats `!res.ok` as failure.
* **Duplicate IDs**: batch preflight throws on duplicate `id` or missing `url`.

```js
await net.batch.run([
  { id: "cfg", url: "/config", opts:{ format: "full" } },
  { id: "lang", url: "/i18n/en.json", opts:{ format: "full" } },
],
(prepend) => {
  // success path when none failed (or fail handler omitted)
  console.log("done", Object.keys(prepend.context));
},
(prepend) => {
  // at least one failed
  const failed = Object.keys(prepend.controller.fail);
  console.warn("batch failed", { failed, trigger: prepend.trigger });
},
{ awaitAll: true, limit: 8 });
```

### Edge case: JSON `false`

If your API returns literal `false`, do not return it directly from the handler:

```js
handler: (res) => (res.body === false ? { ok: true, body: false } : res)
```

---

## SpecManager errors

* **`operationId` not found** → check the spec and the ID you used.
* **Missing path params** → provide all `/{param}` values in `args.path`.
* **Spec load failure** → network/CORS errors when fetching the spec; inspect status/body with `format: "full"` on `specs.load`.

```js
try {
  await net.specs.load("/specs/pets.json", { id: "petsAPI" });
  const res = await net.specs.call("petsAPI", "getPet", { path: { petId: "p-42" }, format: "full" });
  if (!res.ok) console.warn("API error", res.status, res.body);
} catch (e) {
  console.error("spec failure", e);
}
```

---

## Module load errors

Typical causes: 404, non‑ESM sources, MIME type, or CORS.

```js
try {
  const charts = await net.modules.load("charts", "/modules/charts.js");
  charts.render("#root");
} catch (e) {
  console.error("module failed", { id: "charts", err: e });
}
```

---

## Centralized logging pattern

Wrap calls with a tiny helper so logs are consistent.

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

## Timeouts & Abort (defensive)

```js
// Timeout
const conf = await net.http.get("/slow", { format: "full", timeout: 4000 });

// Abort flow
const ctrl = new AbortController();
const p = net.http.get("/stream", { format: "raw", signal: ctrl.signal });
ctrl.abort();
try { await p; } catch (e) { console.warn("aborted", e.name); }
```

---

## Retries (guidance)

m7Fetch does not force a retry policy. Consider a small wrapper with **exponential backoff** for idempotent GETs.

```js
async function retry(fn, { tries = 3, base = 200 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { last = e; }
    await new Promise(r => setTimeout(r, base * 2 ** i));
  }
  throw last;
}

const res = await retry(() => net.http.get("/ping", { format: "full" }));
```

---

## Observability checklist

* [ ] Use `format: "full"` in dev paths.
* [ ] Log **endpoint, status, small body excerpt**, not full payloads.
* [ ] Capture **latency** at call sites (Date.now before/after) if needed.
* [ ] For batches, log `prepend.controller.fail` and the `trigger` id.
* [ ] Include a **correlation id** header in requests where possible.

---

## Troubleshooting quick list

* **CORS** → server must allow origin/method/headers; check preflights.
* **Cookies** → add `credentials:"include"` and correct cookie flags.
* **Duplicate batch IDs** → fix `id` collisions in `loadList`.
* **Unsupported method** → only `get`/`post` allowed in batches.
* **Spec call 404** → wrong `operationId` or missing `path` params.
* **Binary parsing** → use `format: "raw"` and decode yourself.

---

## See also

* **HTTP\_GUIDE.md** — response formats and options.
* **BATCHING\_AND\_COORDINATION.md** — batch semantics and handlers.
* **SPEC\_MANAGER.md** — spec load/call flows.
* **AUTHENTICATION\_AND\_SECURITY.md** — headers, credentials, and CORS.


# --- end: docs/usage/ERROR_HANDLING_AND_DEBUGGING.md ---



# --- begin: docs/usage/EXAMPLES_LIBRARY.md ---

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


# --- end: docs/usage/EXAMPLES_LIBRARY.md ---



# --- begin: docs/usage/GLOSSARY.md ---

← Back to [Usage Guide Index](TOC.md)

# GLOSSARY

Short, practical definitions for terms used throughout **m7Fetch** docs.

---

## A–D

* **AbortController** — Web API to cancel a fetch. Pass `signal` to HTTP calls; call `abort()` to cancel.
* **absolute** — Request option that bypasses the instance base URL and uses the provided URL as‑is.
* **AutoLoader** — Logic behind `specs.load(...)` that detects spec type (e.g., OpenAPI), fetches it (GET/POST), and hands off to **SpecManager**. See **[AUTOLOADER.md](./AUTOLOADER.md)**.
* **awaitAll** — Batch option: `true` waits for all items and returns a `results` map; `false` streams handler execution and uses SyncLoader for completion.
* **BatchLoader** — Runs multiple HTTP jobs with per‑item handlers and a concurrency cap. Returns a `results` map (when `awaitAll:true`) and coordinates completion via **SyncLoader**. See **[BATCHING\_AND\_COORDINATION.md](./BATCHING_AND_COORDINATION.md)**.
* **batch handlers** — Strategies controlling storage/failure behavior per item:

  * `batchStatus` *(default)*: store response; fail if `!res.ok`.
  * `batchStore`: store always; only fail when handler returns `false`.
  * `batchNone`: no auto‑storage; your handler must store/return; `false` marks failure.
* **body | full | raw** — Response shapes returned by HTTP/spec calls:

  * `body`: parsed body only,
  * `full`: `{ ok, status, headers, body }`,
  * `raw`: native `Response`.
* **credentials** — Fetch option controlling cookie send/receive behavior (`omit`, `same-origin`, `include`).
* **context (batch)** — Shared object where per‑item results are stored under their IDs.
* **CORS** — Browser security policy for cross‑origin requests; governed by server `Access-Control-*` headers.
* **CSP** — Content‑Security‑Policy header that constrains resource loads (e.g., `connect-src`, `script-src`).

## E–L

* **ESM (ES Modules)** — Module system using `import`/`export`. Required for dynamic module loading.
* **FETCH\_DEFAULTS** — Class‑level defaults on `HTTP` for fetch options (e.g., `credentials`, `mode`). Extend via subclassing. See **[CONFIGURATION\_AND\_DEFAULTS.md](./CONFIGURATION_AND_DEFAULTS.md)**.
* **format** — Per‑request option choosing the response shape (`body` | `full` | `raw`).
* **handler (batch)** — Function `(res) => any` run per item; returning **`false`** marks that item as failed.
* **headers** — HTTP headers; can be set instance‑wide (`new Net({ headers })`) or per request.
* **HTTP** — m7Fetch client that wraps `fetch` with base URL handling, bodies, and response shaping. See **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)**.
* **id (batch/spec)** — Unique key for a batch item or a loaded spec.
* **limit** — Concurrency cap (max simultaneous requests) for a batch. See **[CONCURRENCY\_LIMITING.md](./CONCURRENCY_LIMITING.md)**.

## M–R

* **ModuleManager** — Dynamically `import()` ES modules and return their namespace. See **[MODULES.md](./MODULES.md)**.
* **Net** — The top‑level hub exposing `http`, `specs`, `modules`, and `batch`.
* **operationId** — OpenAPI operation identifier used by **SpecManager** to look up method/path.
* **OpenAPI** — Popular API description format consumed by **SpecManager**.
* **path / query / headers / body** — Parameter groups for **SpecManager** calls:

  * `path`: values injected into URL templates (`/pets/{id}` → `{ id: "42" }`).
  * `query`: `?k=v` pairs appended to the URL.
  * `headers`: merged with instance/request headers.
  * `body`: payload for methods with a request body.
* **raw** — Response format returning the native `Response`. Use for manual parsing (blob/arrayBuffer/stream).
* **results map** — Object returned by `batch.run(..., { awaitAll:true })` keyed by item `id` with each handler’s return value.

## S–Z

* **SRI** — Subresource Integrity; protects static assets/modules from tampering via hashes.
* **SpecManager** — Loads API specs and calls operations by `operationId`. See **[SPEC\_MANAGER.md](./SPEC_MANAGER.md)**.
* **SyncLoader** — Minimal coordinator used by **BatchLoader**; tracks `require`d IDs, success/failure, and triggers final callbacks.
* **timeout** — Per‑request ms value; aborts the request via `AbortController` when available.
* **urlencoded** — Request option for form posts (`application/x-www-form-urlencoded`).
* **WHATWG** — The *Web Hypertext Application Technology Working Group*, a standards body that maintains living web specifications such as the HTML Standard and Fetch Standard, referenced for API compliance in this library.
* **x-type** — Optional hint used by **AutoLoader** to identify spec types (e.g., `openapi`).

---

## Cross‑references

* **HTTP** → **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)**
* **Batch** → **[BATCHING\_AND\_COORDINATION.md](./BATCHING_AND_COORDINATION.md)**
* **Specs** → **[SPEC\_MANAGER.md](./SPEC_MANAGER.md)** and **[AUTOLOADER.md](./AUTOLOADER.md)**
* **Config** → **[CONFIGURATION\_AND\_DEFAULTS.md](./CONFIGURATION_AND_DEFAULTS.md)**
* **Errors** → **[ERROR\_HANDLING\_AND\_DEBUGGING.md](./ERROR_HANDLING_AND_DEBUGGING.md)**
* **Concurrency** → **[CONCURRENCY\_LIMITING.md](./CONCURRENCY_LIMITING.md)**


# --- end: docs/usage/GLOSSARY.md ---



# --- begin: docs/usage/HTTP_GUIDE.md ---

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


# --- end: docs/usage/HTTP_GUIDE.md ---



# --- begin: docs/usage/INSTALLATION.md ---

← Back to [Usage Guide Index](TOC.md)

# INSTALLATION

This page shows how to add **m7Fetch** to your project, verify it works, and set up a clean layout that pairs well with **M7BootStrap**.

---

## Supported Runtimes

* **ES Modules** environments (browser or server).
* **Browser:** works out of the box.
* **Node:** Node 18+ recommended (has global `fetch`). For older Node, add a WHATWG `fetch` polyfill (e.g., `undici`).

> **Note:** m7Fetch is designed as a plain JS drop‑in. No build step is required unless your app needs one.

---

## Add m7Fetch to Your Project

### Option A — Vendor drop‑in (recommended)

Copy the `m7Fetch` folder into your repo (e.g., `vendor/m7Fetch/`).

```
project/
  src/
  public/
  vendor/
    m7Fetch/
      src/
        index.js
        ...
```

Import it via a relative path:

```js
// Browser or Node (ESM)
import Net from "./vendor/m7Fetch/src/index.js";

const net = new Net();
```

### Option B — Package manager (if published)

If you prefer an npm-style import:

```js
import Net from "m7Fetch";
```

If the package name isn’t published in your registry, use **Option A** or set an alias in your bundler (see below).

---

## Optional: Bundler Aliases

If your codebase expects `import Net from "m7Fetch";`, create an alias:

**Vite** (`vite.config.ts`)

```ts
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      m7Fetch: path.resolve(__dirname, "vendor/m7Fetch/src/index.js"),
    },
  },
});
```

**Webpack** (`webpack.config.js`)

```js
const path = require("node:path");
module.exports = {
  resolve: {
    alias: {
      m7Fetch: path.resolve(__dirname, "vendor/m7Fetch/src/index.js"),
    },
  },
};
```

---

## Node: Fetch Polyfill (if needed)

Node 18+ includes `fetch`. On older Node versions, install a polyfill:

```bash
npm i undici
```

Then set globals early in your app:

```js
import { fetch, Headers, Request, Response } from "undici";
Object.assign(globalThis, { fetch, Headers, Request, Response });
```

---

## Minimal Sanity Check

1. Create a file `check-net.js` (or run in your app):

```js
import Net from "./vendor/m7Fetch/src/index.js";

const net = new Net();
const res = await net.http.get("/health", { format: "full" });
console.log("status:", res.status, "ok:", res.ok);
```

2. Serve your app and open the console — you should see a `status` code.

---

## Pairing with M7BootStrap (optional)

Recommended folder layout when using both:

```
project/
  vendor/
    m7Fetch/
    m7BootStrap/
  src/
```

Initialize side‑by‑side:

```js
import Net from "./vendor/m7Fetch/src/index.js";
import BootStrap from "./vendor/m7BootStrap/BootStrap.js";

const net = new Net();
const bootstrap = new BootStrap(net);
```

---

## Common Issues & Fixes

* **"Cannot use import statement outside a module"**

  * Ensure your environment uses **ESM** (`"type": "module"` in `package.json`, or `.mjs` files).

* **404 for module path**

  * Verify your relative import path to `vendor/m7Fetch/src/index.js`. Adjust dev server static roots if needed.

* **CORS errors**

  * Host API and app on compatible origins, or configure appropriate CORS headers. For cookies, set `credentials: "include"` and `SameSite=None; Secure` on the server.

* **No global fetch in Node**

  * Add the `undici` polyfill as shown above (or upgrade to Node 18+).

---

## Uninstall / Update

* **Update:** replace the `vendor/m7Fetch/` folder with a newer commit/tag. Re-run your sanity check.
* **Uninstall:** remove the folder and any bundler aliases; delete imports.

---

## Next Steps

* Read **[QUICK\_START.md](./QUICK_START.md)** for first calls and practical patterns.
* See **[BASIC\_CONCEPTS.md](./BASIC_CONCEPTS.md)** for the building blocks.
* Use **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** to explore request/response formats and options.

---

## Related

* **m7Fetch** README (project overview & features)
* **M7BootStrap** repo: [https://github.com/linearblade/m7bootstrap](https://github.com/linearblade/m7bootstrap)


# --- end: docs/usage/INSTALLATION.md ---



# --- begin: docs/usage/INTRODUCTION.md ---

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


# --- end: docs/usage/INTRODUCTION.md ---



# --- begin: docs/usage/MODULES.md ---

← Back to [Usage Guide Index](TOC.md)

# MODULES

**ModuleManager** lets you dynamically `import()` JavaScript modules at runtime and access their exports through a small registry keyed by your own IDs.

---

## What it does

* **Loads ES modules** from URLs and returns the module namespace (default + named exports).
* **Associates** a module with your chosen `id` so call sites stay short and readable.
* **Caches** modules by `id` to avoid duplicate fetch/parse work in a session.

> Use this when you want feature packs, tools, or plugins that can be fetched lazily.

---

## Basic usage

```js
// Load once, then use
const math = await net.modules.load("mathTools", "/modules/math.js");
console.log("2 + 3 =", math.add(2, 3));

// Somewhere else (later) — load with the same id
const math2 = await net.modules.load("mathTools", "/modules/math.js");
// Typically returns the cached namespace
```

Your module can export anything valid in ESM:

```js
// /modules/math.js
export function add(a, b) { return a + b; }
export const PI = 3.14159;
export default { add };
```

---

## API (surface)

### `await net.modules.load(id, url, opts?)`

* **`id`**: unique string key for the module.
* **`url`**: absolute or relative path to an **ES module**.
* **Returns**: the module namespace object (e.g., `{ default, add, PI }`).
* **Caching**: loading the same `id` (and typically the same URL) returns the already‑resolved namespace.

> Keep `id` stable per capability (e.g., `"csvTools"`, `"sceneChess"`), not per call site.

---

## Invalidation & versioning

Browser module caches and registries are **sticky** by design. Common patterns:

* **Version the URL**:

  ```js
  await net.modules.load("mathTools", "/modules/math.js?v=2");
  ```
* **Use build/commit hashes** in the path (e.g., `/modules/calc.9f3c1.js`).
* **Explicit rename the `id`** for a new major version (e.g., `mathToolsV2`).

> Hard reloading the same URL is generally not supported by browsers once imported; prefer versioned URLs.

---

## Error handling

Wrap loads to surface network/parse errors clearly:

```js
try {
  const mod = await net.modules.load("charts", "/modules/charts.js");
  mod.render("#root");
} catch (e) {
  console.error("Module load failed", { id: "charts", err: e });
}
```

Common causes:

* 404/500 from the module URL
* Non‑ESM sources (UMD/CommonJS) — ensure `export` syntax
* CORS blocked for cross‑origin URLs
* MIME type issues on servers (serve as `text/javascript` or a JS‑compatible type)

---

## Security notes

* **Trust boundary**: remote modules execute code — treat them as untrusted unless you control the origin.
* **CSP**: use a Content‑Security‑Policy that restricts `script-src` to allowed hosts.
* **SRI**: if you serve static modules, consider Subresource Integrity for tamper detection.
* **Dependency hygiene**: prefer pinning/locking versions of third‑party modules.

---

## Patterns & tips

* **Deferred features**: load heavy tools only when needed (editor panes, data viz, rare dialogs).
* **Split by capability**: keep module namespaces small and intention‑revealing (e.g., `imageTools`, `authUI`).
* **Top‑level await**: supported in ESM; your module can `await` during initialization if necessary.
* **Side‑effects**: avoid module‑level side‑effects; export explicit setup functions for predictable lifecycles.

---

## Troubleshooting

* **"Cannot use import statement outside a module"** → The file isn’t served/parsed as ESM. Ensure correct MIME type and no transpiled CommonJS.
* **CORS errors** → Host on the same origin or enable CORS for the app’s origin.
* **Relative import failures inside the module** → Ensure the module’s own `import` statements use valid relative paths from its served location.
* **Cache confusion** → Append a version query (`?v=...`) or change the filename when publishing updates.

---

## See also

* **[SPEC\_MANAGER.md](./SPEC_MANAGER.md)** — spec‑driven API calls.
* **[BATCHING\_AND\_COORDINATION.md](./BATCHING_AND_COORDINATION.md)** — load accompanying configs/assets alongside modules.
* **[AUTHENTICATION\_AND\_SECURITY.md](./AUTHENTICATION_AND_SECURITY.md)** — CORS, credentials, and headers.


# --- end: docs/usage/MODULES.md ---



# --- begin: docs/usage/QUICK_START.md ---

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


# --- end: docs/usage/QUICK_START.md ---



# --- begin: docs/usage/SPEC_MANAGER.md ---

← Back to [Usage Guide Index](TOC.md)

# SPEC\_MANAGER

Use **SpecManager** to load API descriptions (e.g., OpenAPI) and call operations by **`operationId`**. It bridges your spec to the HTTP client, wiring paths, methods, and common request options.

---

## What it does

* **Load one or more specs** (from a URL or inline object) and assign an `id`.
* **Call operations** by `operationId`, building the request URL/method from the spec.
* **Forward request options** (e.g., `format`, headers) to the underlying HTTP client.
* **Infer encoding** (JSON vs. urlencoded) when the spec provides content-type hints.

> Use this when you have OpenAPI or a similar contract but don’t want to scaffold a generated SDK.

---

## Loading a spec

### From a URL (GET)

```js
await net.specs.load("/specs/pets.json", { id: "petsAPI" });
```

### From a URL (POST)

If your spec is behind a POST endpoint (e.g., needs a token or accepts parameters):

```js
await net.specs.load("/specs/fetch", {
  id: "secureAPI",
  method: "post",
  data: { token: "..." },
  headers: { "x-client": "demo" },
});
```

### From an inline object

```js
const spec = { openapi: "3.0.3", paths: { /* ... */ } };
await net.specs.load(spec, { id: "inlineAPI" });
```

**Options (common):**

* `id` — unique name to reference this spec later (required when loading multiple specs).
* `method`, `data`, `headers` — forwarded to the HTTP layer when fetching remote specs.
* Additional loader hints are supported (e.g., type hints) when applicable.

---

## Calling by `operationId`

```js
const res = await net.specs.call("petsAPI", "listPets", {
  path:   { ownerId: "123" },
  query:  { limit: 25 },
  headers:{ "x-trace": "abc" },
  body:   { include: ["name", "type"] },
  format: "full", // body | full | raw
});

if (!res.ok) console.error("failed", res.status, res.body);
```

**Arguments to `call(apiId, operationId, args)`**

* `path` — key/values substituted into `/{param}` segments.
* `query` — appended to the URL as `?k=v` pairs.
* `headers` — merged with instance and per‑request headers.
* `body` — request payload for `POST/PUT/PATCH` operations.
* `format` — response shape (`body` | `full` | `raw`).

**How it works**

1. Finds the operation by `operationId` inside the named spec.
2. Reads its **HTTP method** and **path template**.
3. Substitutes `path` params and attaches `query`.
4. Chooses body encoding from hints (JSON by default; form if requested/indicated).
5. Delegates to `net.http.*` with your provided `format` and options.

---

## Multiple specs

Load and address many specs side‑by‑side using unique IDs:

```js
await net.specs.load("/specs/pets.json", { id: "petsAPI" });
await net.specs.load("/specs/store.json", { id: "storeAPI" });

const pets = await net.specs.call("petsAPI", "listPets");
const order = await net.specs.call("storeAPI", "createOrder", { body: { sku: "X" } });
```

> Use stable IDs per service (e.g., `authAPI`, `billingAPI`) to keep call sites readable.

---

## Encoding & content types

* **Default**: objects are JSON‑encoded.
* **Form posts**: set `{ urlencoded: true }` in `args` or rely on spec content‑type hints when present.
* **Binary**: use `format: "raw"` and supply the appropriate body (e.g., `Blob`, `ArrayBuffer`).

```js
await net.specs.call("authAPI", "login", {
  body: { user: "u", pass: "p" },
  urlencoded: true,
  format: "full",
});
```

---

## Headers & auth

* Add per‑call headers via `args.headers`.
* Set defaults at `new Net({ headers: { ... } })`.
* If you need cookies across sites, configure server cookies and use fetch credentials (see security pages).

```js
await net.specs.call("petsAPI", "getPet", {
  path: { petId: "p-42" },
  headers: { Authorization: "Bearer <token>" },
});
```

---

## Error handling

* Prefer `format: "full"` during development to inspect `{ ok, status, headers, body }`.
* If the `operationId` is not found, the call will throw a descriptive error.
* Missing `path` params cause URL build errors — provide every placeholder.
* Treat non‑2xx `status` as application‑level failures.

```js
try {
  const res = await net.specs.call("petsAPI", "getPet", { path: { petId: "missing" }, format: "full" });
  if (!res.ok) throw new Error(res.body?.message || "request failed");
} catch (e) {
  console.error("spec call error:", e);
}
```

---

## Examples

### Minimal

```js
await net.specs.load("/specs/pets.json", { id: "petsAPI" });
const pets = await net.specs.call("petsAPI", "listPets");
```

### With path/query/headers/body

```js
const res = await net.specs.call("petsAPI", "updatePet", {
  path: { petId: "p-42" },
  query: { notify: true },
  headers: { "x-trace": "abc" },
  body: { name: "Fluff" },
  format: "full",
});
```

### POST to retrieve a spec, then call

```js
await net.specs.load("/specs/resolve", {
  id: "remoteAPI",
  method: "post",
  data: { scope: "public" },
});
const out = await net.specs.call("remoteAPI", "ping", { format: "full" });
```

---

## Troubleshooting

* **`operationId` not found** → verify the ID or inspect the spec; confirm you loaded the right spec under the right `id`.
* **Missing path params** → every `/{param}` must be provided in `args.path`.
* **Wrong encoding** → set `urlencoded: true` or adjust `body` type (FormData, Blob) explicitly.
* **401/403** → add `Authorization` headers or correct cookie/credential settings.

---

## See also

* **[AUTOLOADER.md](./AUTOLOADER.md)** — type inference and custom loaders.
* **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** — request/response formats and options.
* **[AUTHENTICATION\_AND\_SECURITY.md](./AUTHENTICATION_AND_SECURITY.md)** — credentials & CORS.


# --- end: docs/usage/SPEC_MANAGER.md ---



# --- begin: docs/usage/TOC.md ---

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


# --- end: docs/usage/TOC.md ---



# --- begin: docs/usage/TROUBLESHOOTING.md ---

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


# --- end: docs/usage/TROUBLESHOOTING.md ---



# --- begin: docs/USE_POLICY.md ---

# 📘 M7Fetch Use Policy

This document outlines how you may use M7Fetch under the **Moderate Team License (MTL-10)** and what is expected of you as a user.

---

## ✅ Free Use — What You Can Do

You may use M7Fetch **for free** if you fall under any of the following categories:

* **Individuals** using it for personal projects, learning, or experimentation
* **Academic institutions or researchers** using it for teaching, papers, or labs
* **Nonprofits and NGOs** using it internally without revenue generation
* **Startups or companies** with **10 or fewer users** of M7Fetch internally

  * This includes development, deployment, and operational use

There is **no cost, license key, or approval required** for these use cases.

---

## 🚫 Commercial Restrictions

M7Fetch **may not be used** in the following ways without a paid commercial license:

* As part of a **commercial product** that is sold, licensed, or monetized
* Embedded within a platform, device, or SaaS product offered to customers
* Internally at companies with **more than 10 users** working with M7Fetch
* As a hosted service, API, or backend component for commercial delivery
* In resale, sublicensing, or redistribution as part of paid offerings

---

## 🔒 Definitions

* **User**: Anyone who installs, configures, modifies, integrates, or interacts with M7Fetch as part of their role.
* **Commercial use**: Use in a context intended for revenue generation or business advantage (e.g. SaaS, enterprise ops, service platforms).

---

## 💼 Licensing for Larger or Commercial Use

If your company, product, or service falls outside the free use scope:

📩 **Contact us at \[[legal@m7.org](mailto:legal@m7.org)]** to arrange a commercial license.

Licensing is flexible and supports:

* Enterprise support and maintenance
* Extended deployment rights
* Integration into proprietary systems
* Long-term updates and private features

---

## 🤝 Community Guidelines

* Contributions are welcome under a Contributor License Agreement (CLA)
* Respect user limits — we reserve the right to audit compliance
* We appreciate feedback and security reports via \[[security@m7.org](mailto:security@m7.org)]

---

## 📝 Summary

| Use Case                            | Allowed?      |
| ----------------------------------- | ------------- |
| Hobby / personal projects           | ✅ Yes         |
| Research or academic use            | ✅ Yes         |
| Internal team use (≤ 10 people)     | ✅ Yes         |
| SaaS / resale / commercial platform | ❌ License req |
| Internal use by >10 users           | ❌ License req |

---

This policy supplements the terms in `LICENSE.md` and helps clarify user expectations.


# --- end: docs/USE_POLICY.md ---



# --- begin: LICENSE.md ---

Moderate Team Source-Available License (MTL-10)

Version 1.0 – May 2025Copyright (c) 2025 m7.org

1. Purpose

This license allows use of the software for both non-commercial and limited commercial purposes by small to moderate-sized teams. It preserves freedom for individuals and small businesses, while reserving large-scale commercial rights to the Licensor.

2. Grant of Use

You are granted a non-exclusive, worldwide, royalty-free license to use, modify, and redistribute the Software, subject to the following terms:

You may use the Software for any purpose, including commercial purposes, only if your organization or team consists of no more than 10 total users of the Software.

A “user” is defined as any person who develops with, maintains, integrates, deploys, or operates the Software.

You may modify and redistribute the Software under the same terms, but must retain this license in all distributed copies.

3. Restrictions

If your organization exceeds 10 users of the Software, you must obtain a commercial license from the Licensor.

You may not offer the Software as a hosted service, software-as-a-service (SaaS), or part of a commercial product intended for resale or third-party consumption, regardless of team size.

You may not sublicense, relicense, or alter the terms of this license.

4. Attribution and Notices

You must include this license text and a copyright notice in all copies or substantial portions of the Software.

You must clearly indicate any modifications made to the original Software.

5. No Warranty

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY.

6. Contact for Commercial Licensing

If your use case exceeds the permitted team size, or involves resale, SaaS, hosting, or enterprise deployment:

📧 Contact: legal@m7.org

Commercial licensing is available and encouraged for qualified use cases.

# --- end: LICENSE.md ---



# --- begin: m7fetch.md ---



# --- begin: docs/AI_DISCLOSURE.md ---

# ⚙️ AI Disclosure Statement

This project incorporates the assistance of artificial intelligence tools in a supporting role to accelerate development and reduce repetitive labor.

Specifically, AI was used to:

* 🛠️ **Accelerate the creation of repetitive or boilerplate files**, such as configuration definitions and lookup logic.
* ✍️ **Improve documentation clarity**, formatting, and flow for both technical and general audiences.
* 🧠 **Act as a second set of eyes** for small but crucial errors — such as pointer handling, memory safety, and edge-case checks.
* 🌈 **Suggest enhancements** like emoji-infused logging to improve readability and human-friendly debug output.

---

## 🧑‍💻 Emoji Philosophy

I **like emoji**. They're easy for me to scan and read while debugging. Emoji make logs more human-friendly and give structure to otherwise noisy output.

Future versions may include a **configurable emoji-less mode** for those who prefer minimalism or need plaintext compatibility.

And hey — if you don't like them, the wonders of open source mean you're free to **delete them all**. 😄

---

## 🔧 Human-Directed Engineering

All core architecture, flow design, function strategy, and overall system engineering are **authored and owned by the developer**. AI was not used to generate the software's original design, security model, or protocol logic.

Every AI-assisted suggestion was critically reviewed, tested, and integrated under human judgment.

---

## 🤝 Philosophy

AI tools were used in the same spirit as modern compilers, linters, or search engines — as **assistants, not authors**. All decisions, final code, and system behavior remain the responsibility and intellectual output of the developer.


# --- end: docs/AI_DISCLOSURE.md ---



# --- begin: docs/EXAMPLE.md ---

import HTTP from './HTTP.js';

// Extend the HTTP class to provide custom defaults
class MyHTTP extends HTTP {
    static FETCH_DEFAULTS = {
        mode: 'cors',
        credentials: 'include',
        cache: 'no-cache'
    };
}

const http = new MyHTTP();

// This will override mode and add a timeout, but ignore invalid entries
const fetchOpts = http.buildDefaultFetchOpts({
    mode: 'same-origin',   // Valid override
    timeout: 5000,         // Not part of FETCH_CONSTANTS — will be ignored
    credentials: 'omit'    // Valid override
});

console.log(fetchOpts);
// Output (if all values are valid):
// {
//   mode: 'same-origin',
//   credentials: 'omit',
//   cache: 'no-cache'
// }

# --- end: docs/EXAMPLE.md ---



# --- begin: docs/TODO.md ---


🛠️ TODO - possible ideas
The following are items I will do or possibly may do. more of my own internal checklist.

Error Handling
- Consider exposing a global onError or onFail callback for central error tracking/logging.
- eh, possibly, but feels like I'm digging.

Streaming Support
- support ReadableStream (e.g., for SSE, downloads)
- planning to do this.

Retry / Retry-After
- Advanced retry support (backoff, Retry-After header parsing) could be wrapped into a higher-level helper or integrated into fetchOpts.
- will potentially do this. this is sort of implicitly supported via batchLoader and catching failures. requires manual tooling however.
Request Cancellation
- Consider exposing the AbortController in returned results for manual cancellation use cases.
- going to do this

Response Hooking
- A “middleware”-style hook between fetch and parse could allow metrics or mutation before parsing.
- Not a fan of doing this, I want the class to be as atomic as possible


# --- end: docs/TODO.md ---



# --- begin: docs/USE_POLICY.md ---

# 📘 M7Fetch Use Policy

This document outlines how you may use M7Fetch under the **Moderate Team License (MTL-10)** and what is expected of you as a user.

---

## ✅ Free Use — What You Can Do

You may use M7Fetch **for free** if you fall under any of the following categories:

* **Individuals** using it for personal projects, learning, or experimentation
* **Academic institutions or researchers** using it for teaching, papers, or labs
* **Nonprofits and NGOs** using it internally without revenue generation
* **Startups or companies** with **10 or fewer users** of M7Fetch internally

  * This includes development, deployment, and operational use

There is **no cost, license key, or approval required** for these use cases.

---

## 🚫 Commercial Restrictions

M7Fetch **may not be used** in the following ways without a paid commercial license:

* As part of a **commercial product** that is sold, licensed, or monetized
* Embedded within a platform, device, or SaaS product offered to customers
* Internally at companies with **more than 10 users** working with M7Fetch
* As a hosted service, API, or backend component for commercial delivery
* In resale, sublicensing, or redistribution as part of paid offerings

---

## 🔒 Definitions

* **User**: Anyone who installs, configures, modifies, integrates, or interacts with M7Fetch as part of their role.
* **Commercial use**: Use in a context intended for revenue generation or business advantage (e.g. SaaS, enterprise ops, service platforms).

---

## 💼 Licensing for Larger or Commercial Use

If your company, product, or service falls outside the free use scope:

📩 **Contact us at \[[legal@m7.org](mailto:legal@m7.org)]** to arrange a commercial license.

Licensing is flexible and supports:

* Enterprise support and maintenance
* Extended deployment rights
* Integration into proprietary systems
* Long-term updates and private features

---

## 🤝 Community Guidelines

* Contributions are welcome under a Contributor License Agreement (CLA)
* Respect user limits — we reserve the right to audit compliance
* We appreciate feedback and security reports via \[[security@m7.org](mailto:security@m7.org)]

---

## 📝 Summary

| Use Case                            | Allowed?      |
| ----------------------------------- | ------------- |
| Hobby / personal projects           | ✅ Yes         |
| Research or academic use            | ✅ Yes         |
| Internal team use (≤ 10 people)     | ✅ Yes         |
| SaaS / resale / commercial platform | ❌ License req |
| Internal use by >10 users           | ❌ License req |

---

This policy supplements the terms in `LICENSE.md` and helps clarify user expectations.


# --- end: docs/USE_POLICY.md ---



# --- begin: LICENSE.md ---

Moderate Team Source-Available License (MTL-10)

Version 1.0 – May 2025Copyright (c) 2025 m7.org

1. Purpose

This license allows use of the software for both non-commercial and limited commercial purposes by small to moderate-sized teams. It preserves freedom for individuals and small businesses, while reserving large-scale commercial rights to the Licensor.

2. Grant of Use

You are granted a non-exclusive, worldwide, royalty-free license to use, modify, and redistribute the Software, subject to the following terms:

You may use the Software for any purpose, including commercial purposes, only if your organization or team consists of no more than 10 total users of the Software.

A “user” is defined as any person who develops with, maintains, integrates, deploys, or operates the Software.

You may modify and redistribute the Software under the same terms, but must retain this license in all distributed copies.

3. Restrictions

If your organization exceeds 10 users of the Software, you must obtain a commercial license from the Licensor.

You may not offer the Software as a hosted service, software-as-a-service (SaaS), or part of a commercial product intended for resale or third-party consumption, regardless of team size.

You may not sublicense, relicense, or alter the terms of this license.

4. Attribution and Notices

You must include this license text and a copyright notice in all copies or substantial portions of the Software.

You must clearly indicate any modifications made to the original Software.

5. No Warranty

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY.

6. Contact for Commercial Licensing

If your use case exceeds the permitted team size, or involves resale, SaaS, hosting, or enterprise deployment:

📧 Contact: legal@m7.org

Commercial licensing is available and encouraged for qualified use cases.

# --- end: LICENSE.md ---



# --- begin: README.md ---

# m7Fetch 

**m7Fetch** is a dynamic, modular network toolkit for modern JavaScript environments.  
It provides a clean, extensible interface for loading specs, APIs, and dynamic modules at runtime — all wrapped in a developer-friendly architecture that minimizes boilerplate and promotes flexible usage.

> JavaScript is dynamic — stop trying to collar it like C.  
> If I wanted concrete, I’d use WASM.  
> _(But if you **are** into concrete, check out [Siglatch](https://github.com/linearblade/siglatch) — production-ready, written in C, and extremely useful!)_

---

## 🔧 Purpose

Originally derived from the author's legacy **M7 bootstrapper frameworks** (built over 20 years ago), **m7Fetch** is a modernized, production-ready rework — built to serve dynamic apps, toolchains, and in-browser tasks with minimal setup.

Its design favors:

- Rapid prototyping with structured API access
- Declarative API usage through OpenAPI or custom specs
- Flexible module injection (local or remote)
- Dynamic loading of manifests, assets, and operations
- Headless or console-based automation (yes, even from browser devtools)

---

## ⚡️ Features

- ✅ Unified interface for HTTP, module loading, and spec handling
- 📄 Support for OpenAPI and custom API specs
- 📦 ES module dynamic imports with runtime wiring
- 🧠 AutoLoader intelligently infers spec type and fetches accordingly
- 🕹️ SpecManager handles multiple APIs at once, via operationId-based routing
- 🔁 BatchLoader runs multiple HTTP jobs and emits completion

---

## 📦 Usage

```js
import Net from 'm7Fetch';

const net = new Net();

// Load an OpenAPI spec
await net.specs.load('/specs/dogs.json');

// Call an operation via spec
const dogList = await net.specs.call('dogAPI', 'listDogs');

// Dynamically load a module
const mod = await net.modules.load('mytool', '/tools/helper.js');
mod.doThing();

//load some stuff:
data = await net.http.get('/foo/bar');
more = await net.http.post('/some/post', {a:1,b:2}, {urlencoded: true} )
```

---

## 🚧 Status

This project is **actively maintained**, with its **core modules production-ready**.

Further extensions (like advanced batching, plugin systems, or custom spec types) are in planning or prototype stage.

---


## 📜 License

See [`LICENSE.md`](LICENSE.md) for terms.  
Free for personal, non-commercial use.  
Commercial licensing available under M7 Moderate Team License (MTL-10).

---

## 🤖 AI Usage Disclosure

See [`docs/AI_DISCLOSURE.md`](docs/AI_DISCLOSURE.md) and [`docs/USE_POLICY.md`](docs/USE_POLICY.md)  
for details on permitted AI usage and operational security boundaries.

---

## 🛠️ Philosophy

> “Fewer assumptions. More control.”  
> m7Fetch prefers _explicit_ behavior and composability over frameworks that abstract away too much.

---

## 💬 Feedback / Security

- General inquiries: [legal@m7.org](mailto:legal@m7.org)  
- Security issues: [security@m7.org](mailto:security@m7.org)


# --- end: README.md ---



# --- begin: src/batch/customBatchHandlers.md ---

# 📦 Writing a Custom `batchHandler` for `BatchLoader`

The `batchHandler` allows you to define how each HTTP response is processed, stored, and evaluated for success or failure. This gives you full control over:

* Whether to store the result
* Whether to consider the request "failed"
* How to merge or transform the data before storage

---

## 🧱 Function Signature

```js
function batchHandler(obj, id, handler, item, mergeOpts) {
  return function(res) {
    // your logic here
  };
}
```

### Arguments:

| Name        | Type                 | Description                                              |
| ----------- | -------------------- | -------------------------------------------------------- |
| `obj`       | BatchLoader instance | The active loader object (`this`)                        |
| `id`        | string               | Unique ID of the request (from `loadList`)               |
| `handler`   | Function             | Optional handler from the original `loadList` item       |
| `item`      | object               | The full `loadList` entry (`{ id, url, opts, handler }`) |
| `mergeOpts` | object               | The final merged options passed to `net.http.get()`      |

---

## ✅ What to Return

* Return `false` to mark the request as **failed** (this triggers `SyncLoader.fail()`).
* Any other value is treated as **success**.
* If you do **not** explicitly store the result in `obj.context`, it will not be accessible via `.get(id)`.

---

## 📌 Example

```js
function batchStatus(obj, id, handler, item, mergeOpts) {
  return function(res) {
    obj.context[id] = res; // store raw or parsed response

    if (!res.ok) return false; // mark as failure

    if (handler) return handler(res); // custom processing
  };
}
```

---

## ⚠️ Important Notes

* **Only `false` is treated as failure.**
  If your resource legitimately returns `false` (e.g., a JSON boolean), you must **wrap or transform** it in the handler, or use `{ format: 'full' }` to receive a richer object `{ ok, status, body }`.

* **Batch handler is shared.**
  If you mix different kinds of requests (e.g., some raw text, some JSON), you must handle different data formats inside your `batchHandler`.

* **You can access request metadata via `item` and `mergeOpts`.**
  For example, inspect `item.url` or `mergeOpts.headers` if you need to apply different logic for different endpoints.

---

## 🧪 Example: Handling JSON that may return `false`

```js
function batchSafeJSON(obj, id, handler, item, mergeOpts) {
  return res => {
    const json = res.body;
    if (json === false) {
      console.warn(`JSON false value for ${id}, treating as failure.`);
      return false;
    }
    obj.context[id] = json;
    return handler?.(json);
  };
}
```


# --- end: src/batch/customBatchHandlers.md ---



# --- end: m7fetch.md ---



# --- begin: README.md ---

# m7Fetch 

**m7Fetch** is a dynamic, modular network toolkit for modern JavaScript environments.  
It provides a clean, extensible interface for loading specs, APIs, and dynamic modules at runtime — all wrapped in a developer-friendly architecture that minimizes boilerplate and promotes flexible usage.

> JavaScript is dynamic — stop trying to collar it like C.  
> If I wanted concrete, I’d use WASM.  
> _(But if you **are** into concrete, check out [Siglatch](https://github.com/linearblade/siglatch) — production-ready, written in C, and extremely useful!)_

---

## 🔧 Purpose

Originally derived from the author's legacy **M7 bootstrapper frameworks** (built over 20 years ago), **m7Fetch** is a modernized, production-ready rework — built to serve dynamic apps, toolchains, and in-browser tasks with minimal setup.

Its design favors:

- Rapid prototyping with structured API access
- Declarative API usage through OpenAPI or custom specs
- Flexible module injection (local or remote)
- Dynamic loading of manifests, assets, and operations

---

## 📚 Full Guide
m7Fetch is easy to use, however for advanced users there are a lot of options. For complete usage examples,  and advanced integration patterns, see:

[Full Usage Guide](./docs/usage/TOC) →

For detailed instructions and examples, please refer to the usage guide:

- Installation → [INSTALLATION.md](./docs/usage/INSTALLATION.md)
- Quick Start → [QUICKSTART.md](./docs/usage/QUICKSTART.md)
- Example Library → [EXAMPLES_LIBRARY.md](./docs/usage/EXAMPLES_LIBRARY.md)

---

## ⚡️ Features

- ✅ Unified interface for HTTP, module loading, and spec handling
- 📄 Support for OpenAPI and custom API specs
- 📦 ES module dynamic imports with runtime wiring
- 🧠 AutoLoader intelligently infers spec type and fetches accordingly
- 🕹️ SpecManager handles multiple APIs at once, via operationId-based routing
- 🔁 BatchLoader runs multiple HTTP jobs and emits completion

---

## 📦 Usage

```js
import Net from 'm7Fetch';

const net = new Net();

// Load an OpenAPI spec
await net.specs.load('/specs/dogs.json');

// Call an operation via spec
const dogList = await net.specs.call('dogAPI', 'listDogs');

// Dynamically load a module
const mod = await net.modules.load('mytool', '/tools/helper.js');
mod.doThing();

//load some stuff:
data = await net.http.get('/foo/bar');
more = await net.http.post('/some/post', {a:1,b:2}, {urlencoded: true} )
```

---

## 🚧 Status

This project is **actively maintained**, with its **core modules production-ready**.

Further extensions (like advanced batching, plugin systems, or custom spec types) are in planning or prototype stage.

---


## 📜 License

See [`LICENSE.md`](LICENSE.md) for terms.  
Free for personal, non-commercial use.  
Commercial licensing available under M7 Moderate Team License (MTL-10).

---

## 🤖 AI Usage Disclosure

See [`docs/AI_DISCLOSURE.md`](docs/AI_DISCLOSURE.md) and [`docs/USE_POLICY.md`](docs/USE_POLICY.md)  
for details on permitted AI usage and operational security boundaries.

---

## 🛠️ Philosophy

> “Fewer assumptions. More control.”  
> m7Fetch prefers _explicit_ behavior and composability over frameworks that abstract away too much.

---

## 💬 Feedback / Security

- General inquiries: [legal@m7.org](mailto:legal@m7.org)  
- Security issues: [security@m7.org](mailto:security@m7.org)


# --- end: README.md ---



# --- begin: src/batch/customBatchHandlers.md ---

# 📦 Writing a Custom `batchHandler` for `BatchLoader`

The `batchHandler` allows you to define how each HTTP response is processed, stored, and evaluated for success or failure. This gives you full control over:

* Whether to store the result
* Whether to consider the request "failed"
* How to merge or transform the data before storage

---

## 🧱 Function Signature

```js
function batchHandler(obj, id, handler, item, mergeOpts) {
  return function(res) {
    // your logic here
  };
}
```

### Arguments:

| Name        | Type                 | Description                                              |
| ----------- | -------------------- | -------------------------------------------------------- |
| `obj`       | BatchLoader instance | The active loader object (`this`)                        |
| `id`        | string               | Unique ID of the request (from `loadList`)               |
| `handler`   | Function             | Optional handler from the original `loadList` item       |
| `item`      | object               | The full `loadList` entry (`{ id, url, opts, handler }`) |
| `mergeOpts` | object               | The final merged options passed to `net.http.get()`      |

---

## ✅ What to Return

* Return `false` to mark the request as **failed** (this triggers `SyncLoader.fail()`).
* Any other value is treated as **success**.
* If you do **not** explicitly store the result in `obj.context`, it will not be accessible via `.get(id)`.

---

## 📌 Example

```js
function batchStatus(obj, id, handler, item, mergeOpts) {
  return function(res) {
    obj.context[id] = res; // store raw or parsed response

    if (!res.ok) return false; // mark as failure

    if (handler) return handler(res); // custom processing
  };
}
```

---

## ⚠️ Important Notes

* **Only `false` is treated as failure.**
  If your resource legitimately returns `false` (e.g., a JSON boolean), you must **wrap or transform** it in the handler, or use `{ format: 'full' }` to receive a richer object `{ ok, status, body }`.

* **Batch handler is shared.**
  If you mix different kinds of requests (e.g., some raw text, some JSON), you must handle different data formats inside your `batchHandler`.

* **You can access request metadata via `item` and `mergeOpts`.**
  For example, inspect `item.url` or `mergeOpts.headers` if you need to apply different logic for different endpoints.

---

## 🧪 Example: Handling JSON that may return `false`

```js
function batchSafeJSON(obj, id, handler, item, mergeOpts) {
  return res => {
    const json = res.body;
    if (json === false) {
      console.warn(`JSON false value for ${id}, treating as failure.`);
      return false;
    }
    obj.context[id] = json;
    return handler?.(json);
  };
}
```


# --- end: src/batch/customBatchHandlers.md ---

