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
