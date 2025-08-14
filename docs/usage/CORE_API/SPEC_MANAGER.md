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
