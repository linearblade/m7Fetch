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
