← Back to [Usage Guide Index](TOC.md)

# CONCURRENCY LIMITING

How **m7Fetch** caps parallel work to protect servers, browsers, and your app’s UX. The limit applies at the **BatchLoader** level via a small queueing helper.

---

## Why limit concurrency?

* **Stability** — avoid request stampedes and resource exhaustion.
* **Fairness** — ensure slow endpoints don’t starve others.
* **UX** — predictable completion times and progress updates.

---

## Where limits apply

* **`BatchLoader.run(..., { limit })`** — caps *concurrent* HTTP requests for that batch.
* **`concurrencyLimiter(max)`** — internal helper that queues functions and runs up to `max` at once. Useful for any async job, not just HTTP.

> There’s **no global cross‑batch limit** by default. Each `run()` manages its own queue. If you start multiple batches at once, coordinate at the app layer (see patterns below).

---

## Defaults & behavior

* **Default `limit`: 8** if not specified.
* **Disable** by setting a very high value (not recommended; prefer a sensible cap).
* Jobs are pushed in submission order and executed FIFO as slots free up.
* Works with `awaitAll: true` (collects results after all complete) and `awaitAll: false` (handlers fire as each finishes).

```js
await net.batch.run(loadList, onLoad, onFail, { awaitAll: true, limit: 4 });
```

---

## Choosing a limit

Pick a starting point and tune with measurements:

* **4–8** for most browser apps hitting typical REST endpoints.
* Increase if endpoints are fast/lightweight or multiplexed; decrease for heavy compute or strict rate limits.
* Measure **latency**, **error/429 rates**, and **server load**; adjust accordingly.

> When working with rate‑limited APIs, combine a lower `limit` with application‑level **backoff** when you see `429` or `Retry‑After`.

---

## Patterns

### 1) Per‑batch cap

Each feature area can choose a limit appropriate to its workload.

```js
await net.batch.run(loadA, onLoadA, onFailA, { limit: 6 });
await net.batch.run(loadB, onLoadB, onFailB, { limit: 3 });
```

### 2) Global semaphore (cross‑batch)

If you need a **single cap across all batches**, wrap HTTP calls with your own limiter and use `batchNone` so you control storage.

```js
const limit = concurrencyLimiter(6);

function limitedGet(url, opts) {
  return limit(() => net.http.get(url, opts));
}

net.batch.setBatchHandler(false); // use batchNone
await net.batch.run(
  [ { id: "a", url: "/a" }, { id: "b", url: "/b" } ],
  (prepend) => console.log("done"),
  (prepend) => console.warn("fail"),
  { awaitAll: false, limit: 1000 } // effectively disabled; we enforce our own above
);
```

### 3) Priorities (lightweight)

Implement simple priority by scheduling **high‑priority** tasks earlier, or maintain two batches (HP first, then LP). For more control, build a small wrapper queue that sorts by `item.priority` before submission.

### 4) Host‑aware caps

Group URLs by origin and run separate batches/queues with different limits (e.g., internal services vs. third‑party APIs).

---

## Progress & streaming

Use `awaitAll:false` to stream results and update progress UI.

```js
const { sync } = await net.batch.run(loadList, onLoad, onFail, { awaitAll: false, limit: 5 });
const total = loadList.length;
const timer = setInterval(() => {
  const done = Object.keys(sync.controller.run).length;
  console.log(`${done}/${total}`);
  if (sync.loaded()) { clearInterval(timer); }
}, 100);
```

---

## Backoff & retries (recommended)

m7Fetch doesn’t impose retries; add a wrapper for **idempotent** requests.

```js
async function backoff(fn, tries = 3, base = 200) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { last = e; }
    await new Promise(r => setTimeout(r, base * 2 ** i));
  }
  throw last;
}

const res = await backoff(() => net.http.get("/ping", { format: "full" }));
```

Combine backoff with a conservative `limit` when facing transient errors or `429` responses.

---

## Pitfalls & how to avoid them

* **Thundering herd** — launching many big batches at once. *Stagger* starts or use a global semaphore.
* **Hidden blocking in handlers** — long CPU work inside item handlers blocks completion. *Offload* heavy parsing or keep handlers small.
* **Assuming global limits** — each `run()` has its own cap. If you require a global cap, implement it explicitly.
* **Binary downloads** — large responses tie up the network; use a **lower limit** and `format: "raw"` when you need manual streaming.

---

## Diagnostics

* Log per‑item **start/finish time** to spot stragglers.
* In `onFail`, inspect `prepend.controller.fail` to see which IDs failed.
* Consider adding an **X‑Correlation‑Id** header to requests for end‑to‑end tracing.

```js
(prepend) => {
  const failedIds = Object.keys(prepend.controller.fail);
  console.warn("failed:", failedIds);
}
```

---

## FAQ

**Q: Can I change the limit mid‑batch?**
A: No; set the desired value in the `run` call. Start a new batch to change it.

**Q: Does the limit control retries?**
A: No; retries are user‑implemented. The limit only caps *current* in‑flight jobs.

**Q: Does it guarantee order?**
A: Submission is FIFO, but completion order depends on network response times.

---

## See also

* **[BATCHING\_AND\_COORDINATION.md](./BATCHING_AND_COORDINATION.md)** — batch anatomy and handlers.
* **[CORE\_API\_BATCH\_LOADER.md](./CORE_API_BATCH_LOADER.md)** — API details.
* **[ERROR\_HANDLING\_AND\_DEBUGGING.md](./ERROR_HANDLING_AND_DEBUGGING.md)** — logging & failure modes.
* **[HTTP\_GUIDE.md](./HTTP_GUIDE.md)** — request options that affect performance.
