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
