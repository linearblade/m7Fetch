

# --- begin: docs/AI_DISCLOSURE.md ---

# ⚙️ AI Disclosure Statement

This project incorporates the assistance of artificial intelligence tools in a supporting role to accelerate development and reduce repetitive labor.

Specifically, AI was used to:

* 🛠️ **Accelerate the creation of repetitive or boilerplate files**, such as configuration definitions and lookup logic.
* ✍️ **Improve documentation clarity**, formatting, and flow for both technical and general audiences.
* 🧠 **Act as a second set of eyes** for small but crucial errors — such as pointer handling, memory safety, and edge-case checks.
* 🌈 **Suggest enhancements** like emoji-infused logging to improve readability and human-friendly debug output.

---

## 🧑‍💻 Emoji Philosophy

I **like emoji**. They're easy for me to scan and read while debugging. Emoji make logs more human-friendly and give structure to otherwise noisy output.

Future versions may include a **configurable emoji-less mode** for those who prefer minimalism or need plaintext compatibility.

And hey — if you don't like them, the wonders of open source mean you're free to **delete them all**. 😄

---

## 🔧 Human-Directed Engineering

All core architecture, flow design, function strategy, and overall system engineering are **authored and owned by the developer**. AI was not used to generate the software's original design, security model, or protocol logic.

Every AI-assisted suggestion was critically reviewed, tested, and integrated under human judgment.

---

## 🤝 Philosophy

AI tools were used in the same spirit as modern compilers, linters, or search engines — as **assistants, not authors**. All decisions, final code, and system behavior remain the responsibility and intellectual output of the developer.


# --- end: docs/AI_DISCLOSURE.md ---



# --- begin: docs/EXAMPLE.md ---

import HTTP from './HTTP.js';

// Extend the HTTP class to provide custom defaults
class MyHTTP extends HTTP {
    static FETCH_DEFAULTS = {
        mode: 'cors',
        credentials: 'include',
        cache: 'no-cache'
    };
}

const http = new MyHTTP();

// This will override mode and add a timeout, but ignore invalid entries
const fetchOpts = http.buildDefaultFetchOpts({
    mode: 'same-origin',   // Valid override
    timeout: 5000,         // Not part of FETCH_CONSTANTS — will be ignored
    credentials: 'omit'    // Valid override
});

console.log(fetchOpts);
// Output (if all values are valid):
// {
//   mode: 'same-origin',
//   credentials: 'omit',
//   cache: 'no-cache'
// }

# --- end: docs/EXAMPLE.md ---



# --- begin: docs/TODO.md ---


🛠️ TODO - possible ideas
The following are items I will do or possibly may do. more of my own internal checklist.

Error Handling
- Consider exposing a global onError or onFail callback for central error tracking/logging.
- eh, possibly, but feels like I'm digging.

Streaming Support
- support ReadableStream (e.g., for SSE, downloads)
- planning to do this.

Retry / Retry-After
- Advanced retry support (backoff, Retry-After header parsing) could be wrapped into a higher-level helper or integrated into fetchOpts.
- will potentially do this. this is sort of implicitly supported via batchLoader and catching failures. requires manual tooling however.
Request Cancellation
- Consider exposing the AbortController in returned results for manual cancellation use cases.
- going to do this

Response Hooking
- A “middleware”-style hook between fetch and parse could allow metrics or mutation before parsing.
- Not a fan of doing this, I want the class to be as atomic as possible


# --- end: docs/TODO.md ---



# --- begin: docs/USE_POLICY.md ---

# 📘 M7Fetch Use Policy

This document outlines how you may use M7Fetch under the **Moderate Team License (MTL-10)** and what is expected of you as a user.

---

## ✅ Free Use — What You Can Do

You may use M7Fetch **for free** if you fall under any of the following categories:

* **Individuals** using it for personal projects, learning, or experimentation
* **Academic institutions or researchers** using it for teaching, papers, or labs
* **Nonprofits and NGOs** using it internally without revenue generation
* **Startups or companies** with **10 or fewer users** of M7Fetch internally

  * This includes development, deployment, and operational use

There is **no cost, license key, or approval required** for these use cases.

---

## 🚫 Commercial Restrictions

M7Fetch **may not be used** in the following ways without a paid commercial license:

* As part of a **commercial product** that is sold, licensed, or monetized
* Embedded within a platform, device, or SaaS product offered to customers
* Internally at companies with **more than 10 users** working with M7Fetch
* As a hosted service, API, or backend component for commercial delivery
* In resale, sublicensing, or redistribution as part of paid offerings

---

## 🔒 Definitions

* **User**: Anyone who installs, configures, modifies, integrates, or interacts with M7Fetch as part of their role.
* **Commercial use**: Use in a context intended for revenue generation or business advantage (e.g. SaaS, enterprise ops, service platforms).

---

## 💼 Licensing for Larger or Commercial Use

If your company, product, or service falls outside the free use scope:

📩 **Contact us at \[[legal@m7.org](mailto:legal@m7.org)]** to arrange a commercial license.

Licensing is flexible and supports:

* Enterprise support and maintenance
* Extended deployment rights
* Integration into proprietary systems
* Long-term updates and private features

---

## 🤝 Community Guidelines

* Contributions are welcome under a Contributor License Agreement (CLA)
* Respect user limits — we reserve the right to audit compliance
* We appreciate feedback and security reports via \[[security@m7.org](mailto:security@m7.org)]

---

## 📝 Summary

| Use Case                            | Allowed?      |
| ----------------------------------- | ------------- |
| Hobby / personal projects           | ✅ Yes         |
| Research or academic use            | ✅ Yes         |
| Internal team use (≤ 10 people)     | ✅ Yes         |
| SaaS / resale / commercial platform | ❌ License req |
| Internal use by >10 users           | ❌ License req |

---

This policy supplements the terms in `LICENSE.md` and helps clarify user expectations.


# --- end: docs/USE_POLICY.md ---



# --- begin: LICENSE.md ---

Moderate Team Source-Available License (MTL-10)

Version 1.0 – May 2025Copyright (c) 2025 m7.org

1. Purpose

This license allows use of the software for both non-commercial and limited commercial purposes by small to moderate-sized teams. It preserves freedom for individuals and small businesses, while reserving large-scale commercial rights to the Licensor.

2. Grant of Use

You are granted a non-exclusive, worldwide, royalty-free license to use, modify, and redistribute the Software, subject to the following terms:

You may use the Software for any purpose, including commercial purposes, only if your organization or team consists of no more than 10 total users of the Software.

A “user” is defined as any person who develops with, maintains, integrates, deploys, or operates the Software.

You may modify and redistribute the Software under the same terms, but must retain this license in all distributed copies.

3. Restrictions

If your organization exceeds 10 users of the Software, you must obtain a commercial license from the Licensor.

You may not offer the Software as a hosted service, software-as-a-service (SaaS), or part of a commercial product intended for resale or third-party consumption, regardless of team size.

You may not sublicense, relicense, or alter the terms of this license.

4. Attribution and Notices

You must include this license text and a copyright notice in all copies or substantial portions of the Software.

You must clearly indicate any modifications made to the original Software.

5. No Warranty

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY.

6. Contact for Commercial Licensing

If your use case exceeds the permitted team size, or involves resale, SaaS, hosting, or enterprise deployment:

📧 Contact: legal@m7.org

Commercial licensing is available and encouraged for qualified use cases.

# --- end: LICENSE.md ---



# --- begin: README.md ---

# m7Fetch 

**m7Fetch** is a dynamic, modular network toolkit for modern JavaScript environments.  
It provides a clean, extensible interface for loading specs, APIs, and dynamic modules at runtime — all wrapped in a developer-friendly architecture that minimizes boilerplate and promotes flexible usage.

> JavaScript is dynamic — stop trying to collar it like C.  
> If I wanted concrete, I’d use WASM.  
> _(But if you **are** into concrete, check out [Siglatch](https://github.com/linearblade/siglatch) — production-ready, written in C, and extremely useful!)_

---

## 🔧 Purpose

Originally derived from the author's legacy **M7 bootstrapper frameworks** (built over 20 years ago), **m7Fetch** is a modernized, production-ready rework — built to serve dynamic apps, toolchains, and in-browser tasks with minimal setup.

Its design favors:

- Rapid prototyping with structured API access
- Declarative API usage through OpenAPI or custom specs
- Flexible module injection (local or remote)
- Dynamic loading of manifests, assets, and operations
- Headless or console-based automation (yes, even from browser devtools)

---

## ⚡️ Features

- ✅ Unified interface for HTTP, module loading, and spec handling
- 📄 Support for OpenAPI and custom API specs
- 📦 ES module dynamic imports with runtime wiring
- 🧠 AutoLoader intelligently infers spec type and fetches accordingly
- 🕹️ SpecManager handles multiple APIs at once, via operationId-based routing
- 🔁 BatchLoader runs multiple HTTP jobs and emits completion

---

## 📦 Usage

```js
import Net from 'm7Fetch';

const net = new Net();

// Load an OpenAPI spec
await net.specs.load('/specs/dogs.json');

// Call an operation via spec
const dogList = await net.specs.call('dogAPI', 'listDogs');

// Dynamically load a module
const mod = await net.modules.load('mytool', '/tools/helper.js');
mod.doThing();

//load some stuff:
data = await net.http.get('/foo/bar');
more = await net.http.post('/some/post', {a:1,b:2}, {urlencoded: true} )
```

---

## 🚧 Status

This project is **actively maintained**, with its **core modules production-ready**.

Further extensions (like advanced batching, plugin systems, or custom spec types) are in planning or prototype stage.

---


## 📜 License

See [`LICENSE.md`](LICENSE.md) for terms.  
Free for personal, non-commercial use.  
Commercial licensing available under M7 Moderate Team License (MTL-10).

---

## 🤖 AI Usage Disclosure

See [`docs/AI_DISCLOSURE.md`](docs/AI_DISCLOSURE.md) and [`docs/USE_POLICY.md`](docs/USE_POLICY.md)  
for details on permitted AI usage and operational security boundaries.

---

## 🛠️ Philosophy

> “Fewer assumptions. More control.”  
> m7Fetch prefers _explicit_ behavior and composability over frameworks that abstract away too much.

---

## 💬 Feedback / Security

- General inquiries: [legal@m7.org](mailto:legal@m7.org)  
- Security issues: [security@m7.org](mailto:security@m7.org)


# --- end: README.md ---



# --- begin: src/batch/customBatchHandlers.md ---

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


# --- end: src/batch/customBatchHandlers.md ---

