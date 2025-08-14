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
