↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_FETCH\_CONSTANTS

`FETCH_CONSTANTS` is a static export providing **allowed values** for certain [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) request options.
It is consumed by `HTTP.buildDefaultFetchOpts()` to validate and merge user‐provided settings with defaults.

---

## Keys & Allowed Values

| Option           | Allowed Values                                                                                                                                                                     | Notes                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `mode`           | `"cors"`, `"no-cors"`, `"same-origin"`                                                                                                                                             |                                             |
| `cache`          | `"default"`, `"no-store"`, `"reload"`, `"no-cache"`, `"force-cache"`, `"only-if-cached"`                                                                                           |                                             |
| `referrer`       | *(commented out in default)* `"no-referrer"`, `"client"`, or a string URL                                                                                                          | Values not enforced; any string URL passes  |
| `priority`       | `"auto"`, `"high"`, `"low"`                                                                                                                                                        |                                             |
| `keepalive`      | `true`, `false`                                                                                                                                                                    |                                             |
| `integrity`      | *(no restrictions — valid SRI strings)*                                                                                                                                            |                                             |
| `referrerPolicy` | `"no-referrer"`, `"no-referrer-when-downgrade"`, `"origin"`, `"origin-when-cross-origin"`, `"same-origin"`, `"strict-origin"`, `"strict-origin-when-cross-origin"`, `"unsafe-url"` |                                             |
| `credentials`    | `"omit"`, `"same-origin"`, `"include"`                                                                                                                                             |                                             |
| `redirect`       | `"follow"`, `"error"`, `"manual"`                                                                                                                                                  |                                             |
| `duplex`         | `"half"`                                                                                                                                                                           |                                             |
| `signal`         | `true`, `false`                                                                                                                                                                    | Enables/disables AbortController signal use |

---

## Usage in `HTTP`

When you create an `HTTP` instance or call a request method, any of the above keys can be included in the options.
`HTTP.buildDefaultFetchOpts(opts)` will:

* Look up the allowed values in `FETCH_CONSTANTS`.
* Apply only those that are explicitly allowed for that key (empty array = any value allowed).
* Merge them with `HTTP.FETCH_DEFAULTS`.

Example:

```js
import { HTTP, constants as FETCH_CONSTANTS } from 'm7fetch';

const http = new HTTP({
  mode: 'cors',              // valid
  credentials: 'include',    // valid
  priority: 'high'           // valid
});

// Invalid values will be ignored
```

---

## See Also

* **CORE\_API\_HTTP.md** — consumer of these constants.
* [MDN: Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) — background on these options.
