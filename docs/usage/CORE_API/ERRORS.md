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
