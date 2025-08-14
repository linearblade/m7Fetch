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
