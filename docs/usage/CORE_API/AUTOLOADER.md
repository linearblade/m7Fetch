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
