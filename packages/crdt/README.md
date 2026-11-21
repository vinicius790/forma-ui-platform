# @forma-ui/crdt

Zero-dependency conflict-free replicated data types & multiplayer presence controllers for **Forma UI 100.0.0**:
- `createLwwRegister<T>`: Last-Write-Wins Lamport register with deterministic peer tie-breaking.
- `createLwwMap<T>`: Conflict-free shared state map for collaborative forms, grids, and Kanban boards.
- `createPresenceController<T>`: Live multiplayer cursors/selections with TTL expiration and idempotent cleanup.
