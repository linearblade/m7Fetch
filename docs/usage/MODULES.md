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
