
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
