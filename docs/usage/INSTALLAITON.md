← Back to [Usage Guide Index](TOC.md)

# INSTALLATION

This page shows how to add **m7Fetch** to your project, verify it works, and set up a clean layout that pairs well with **M7BootStrap**.

---

## Supported Runtimes

* **ES Modules** environments (browser or server).
* **Browser:** works out of the box.
* **Node:** Node 18+ recommended (has global `fetch`). For older Node, add a WHATWG `fetch` polyfill (e.g., `undici`).

> **Note:** m7Fetch is designed as a plain JS drop‑in. No build step is required unless your app needs one.

---

## Add m7Fetch to Your Project

### Option A — Vendor drop‑in (recommended)

Copy the `m7Fetch` folder into your repo (e.g., `vendor/m7Fetch/`).

```
project/
  src/
  public/
  vendor/
    m7Fetch/
      src/
        index.js
        ...
```

Import it via a relative path:

```js
// Browser or Node (ESM)
import Net from "./vendor/m7Fetch/src/index.js";

const net = new Net();
```

### Option B — Package manager (if published)

If you prefer an npm-style import:

```js
import Net from "m7Fetch";
```

If the package name isn’t published in your registry, use **Option A** or set an alias in your bundler (see below).

---

## Optional: Bundler Aliases

If your codebase expects `import Net from "m7Fetch";`, create an alias:

**Vite** (`vite.config.ts`)

```ts
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      m7Fetch: path.resolve(__dirname, "vendor/m7Fetch/src/index.js"),
    },
  },
});
```

**Webpack** (`webpack.config.js`)

```js
const path = require("node:path");
module.exports = {
  resolve: {
    alias: {
      m7Fetch: path.resolve(__dirname, "vendor/m7Fetch/src/index.js"),
    },
  },
};
```

---

## Node: Fetch Polyfill (if needed)

Node 18+ includes `fetch`. On older Node versions, install a polyfill:

```bash
npm i undici
```

Then set globals early in your app:

```js
import { fetch, Headers, Request, Response } from "undici";
Object.assign(globalThis, { fetch, Headers, Request, Response });
```

---

## Minimal Sanity Check

1. Create a file `check-net.js` (or run in your app):

```js
import Net from "./vendor/m7Fetch/src/index.js";

const net = new Net();
const res = await net.http.get("/health", { format: "full" });
console.log("status:", res.status, "ok:", res.ok);
```

2. Serve your app and open the console — you should see a `status` code.

---

## Pairing with M7BootStrap (optional)

Recommended folder layout when using both:

```
project/
  vendor/
    m7Fetch/
    m7BootStrap/
  src/
```

Initialize side‑by‑side:

```js
import Net from "./vendor/m7Fetch/src/index.js";
import BootStrap from "./vendor/m7BootStrap/BootStrap.js";

const net = new Net();
const bootstrap = new BootStrap(net);
```

---

## Common Issues & Fixes

* **"Cannot use import statement outside a module"**

  * Ensure your environment uses **ESM** (`"type": "module"` in `package.json`, or `.mjs` files).

* **404 for module path**

  * Verify your relative import path to `vendor/m7Fetch/src/index.js`. Adjust dev server static roots if needed.

* **CORS errors**

  * Host API and app on compatible origins, or configure appropriate CORS headers. For cookies, set `credentials: "include"` and `SameSite=None; Secure` on the server.

* **No global fetch in Node**

  * Add the `undici` polyfill as shown above (or upgrade to Node 18+).

---

## Uninstall / Update

* **Update:** replace the `vendor/m7Fetch/` folder with a newer commit/tag. Re-run your sanity check.
* **Uninstall:** remove the folder and any bundler aliases; delete imports.

---

## Next Steps

* Read **[QUICK\_START.md](./QUICK_START.md)** for first calls and practical patterns.
* See **[BASIC\_CONCEPTS.md](./BASIC_CONCEPTS.md)** for the building blocks.
* Use **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** to explore request/response formats and options.

---

## Related

* **m7Fetch** README (project overview & features)
* **M7BootStrap** repo: [https://github.com/linearblade/m7bootstrap](https://github.com/linearblade/m7bootstrap)
