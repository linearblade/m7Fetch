← Back to [Usage Guide Index](TOC.md)

# AUTHENTICATION & SECURITY

Guidance for sending credentials, securing requests, and hardening your app when using **m7Fetch**.

---

## Overview

* **Where to put auth:** headers (e.g., `Authorization`), or cookies (with `credentials` enabled).
* **What m7Fetch does:** forwards your options to `fetch` (headers, credentials). It doesn’t implement an auth protocol itself.
* **Your responsibility:** server policy (CORS), token lifecycles, cookie flags, and content security controls.

---

## Headers (tokens & API keys)

Use headers for bearer/JWT tokens, API keys, or custom schemes.

```js
// Instance‑wide default header
const net = new Net({ headers: { Authorization: "Bearer <token>" } });

// Per‑request override/merge
await net.http.get("/me", { headers: { Authorization: "Bearer <token2>" }, format: "full" });

// Spec call
await net.specs.call("petsAPI", "getPet", {
  headers: { Authorization: "Bearer <token>" },
  path: { petId: "p-42" },
  format: "full",
});
```

**Best practices**

* Prefer short‑lived access tokens + refresh flow.
* Avoid storing long‑lived tokens in `localStorage` (XSS risk). Prefer **httpOnly cookies** or in‑memory.
* Namescape custom headers (`x-…`) to avoid collisions.

---

## Cookies & `credentials`

To include cookies, instruct fetch to send them and configure server cookie flags.

```js
// Option A: subclass HTTP defaults (global)
class CookieHTTP extends HTTP { static FETCH_DEFAULTS = { credentials: "include" }; }

// Option B: per request
await net.http.get("/me", { format: "full", credentials: "include" });
```

**Server cookie flags**

* `SameSite=None; Secure` for cross‑site usage.
* `HttpOnly` to block JS access where possible.
* Reasonable expiry and rotation.

**Notes**

* Browsers will **not** send cookies cross‑site unless `credentials:"include"` **and** cookie flags allow it.
* For same‑site apps, `SameSite=Lax` may suffice.

---

## CORS (Cross‑Origin Resource Sharing)

CORS is enforced by the **browser**, configured by the **server**.

**Server must send:**

* `Access-Control-Allow-Origin: <your-app-origin>` *(or `*` without credentials)*
* If using cookies: `Access-Control-Allow-Credentials: true`
* If sending custom headers/methods: `Access-Control-Allow-Headers`, `Access-Control-Allow-Methods`

**Preflight (OPTIONS) requests** occur when using non‑simple methods/headers. Ensure server responds 200/204 with the right `Access-Control-*` headers.

**Common fixes**

* Align origins (prefer same‑origin during development via proxy).
* Reflect `Origin` safely on the server or allow a specific list.
* Include `Vary: Origin` when dynamically allowing origins.

---

## CSRF (Cross‑Site Request Forgery)

If you rely on cookies for authentication, implement **CSRF** protections:

* **SameSite** cookies (Lax/Strict) reduce exposure but may break flows.
* **Token patterns**: double‑submit cookie, synchronizer token, or header‑based tokens (e.g., `x-csrf-token`).
* Validate **origin**/`Referer` headers for state‑changing requests.

---

## TLS, CSP, and SRI

* **TLS:** Always prefer HTTPS; mixed content will be blocked by modern browsers.
* **CSP:** Configure `Content-Security-Policy` to restrict `script-src`, `connect-src` (your API endpoints), etc.
* **SRI:** When serving static JS modules, add **Subresource Integrity** hashes to detect tampering.

```html
<!-- Example CSP (simplified) -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' https://api.example.com; script-src 'self'; object-src 'none'">
```

---

## SpecManager integration

You can pass headers/credentials while **loading** a spec and while **calling** operations:

```js
// Load with credentials and headers
await net.specs.load("/specs/resolve", {
  id: "remoteAPI",
  method: "post",
  headers: { Authorization: "Bearer <token>" },
  credentials: "include",
  format: "full",
});

// Call operation with per‑call headers
await net.specs.call("remoteAPI", "getSecret", {
  headers: { Authorization: "Bearer <token>" },
  format: "full",
});
```

---

## Node considerations

* Node 18+ has global `fetch`; earlier versions need a polyfill (e.g., `undici`).
* Environment variables are common for tokens/keys; do not log them.
* For server‑to‑server auth, prefer **mTLS** or OAuth client credentials where applicable.

---

## Examples

**Bearer token across calls**

```js
const net = new Net({ headers: { Authorization: `Bearer ${accessToken}` } });
const me = await net.http.get("/me", { format: "full" });
```

**Cookie session**

```js
class CookieHTTP extends HTTP { static FETCH_DEFAULTS = { credentials: "include" }; }
const net = new Net();
const res = await net.http.get("/profile", { format: "full", credentials: "include" });
```

**Custom header + CORS preflight**

```js
await net.http.post("/mutate", { a: 1 }, {
  headers: { "x-csrf-token": token },
  format: "full",
});
```

---

## Troubleshooting

* **401/403** → expired token, missing cookie, or wrong audience/scope. Refresh/reauth and verify claims.
* **Preflight fails** → server must allow method/headers and reply to `OPTIONS` with the right CORS headers.
* **Cookies not sent** → you didn’t set `credentials:"include"`, or cookie flags disallow cross‑site.
* **Mixed content** → API must be HTTPS when the app is served over HTTPS.
* **Clock skew** (JWT) → `iat/exp` validity issues on server/client; sync clocks.

---

## Checklist

* [ ] Decide on **headers vs cookies** for auth.
* [ ] Configure **CORS** on the server; set `connect-src` in **CSP** accordingly.
* [ ] Use **short‑lived tokens**, refresh flows, and avoid persistent storage for secrets.
* [ ] If using cookies: set `SameSite=None; Secure; HttpOnly` and enable `credentials` in requests.
* [ ] Log **status + endpoint + small body excerpt**, not full tokens.

---

## See also

* **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** — per‑request options (`headers`, `credentials`, `format`).
* **[CONFIGURATION\_AND\_DEFAULTS.md](./CONFIGURATION_AND_DEFAULTS.md)** — layering and merges.
* **[SPEC\_MANAGER.md](./SPEC_MANAGER.md)** — headers/credentials during spec load and calls.
