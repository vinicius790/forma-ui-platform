# @forma-ui/qwik

Resumable state-serialization helpers and Qwik-compatible signal bridges for **Forma UI 50.0.0**.

## Philosophy

Qwik serializes application state across the server/client boundary and resumes interaction lazily on first user event. `@forma-ui/qwik` keeps serializable snapshots (`ResumableFormaState`) separate from live DOM controllers (`createResumableBinding`), so zero controller runtime executes on initial SSR hydration until interaction occurs.
