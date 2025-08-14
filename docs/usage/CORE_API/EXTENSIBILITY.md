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
