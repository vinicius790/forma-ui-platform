export interface LwwEnvelope<T> {
  readonly value: T;
  readonly clock: number;
  readonly peerId: string;
}

function winsOver<T>(incoming: LwwEnvelope<T>, current: LwwEnvelope<T>): boolean {
  if (incoming.clock !== current.clock) return incoming.clock > current.clock;
  return incoming.peerId > current.peerId;
}

/** Last-Write-Wins Register with Lamport clock and deterministic peer tie-breaking. */
export class LwwRegister<T> {
  private envelope: LwwEnvelope<T>;
  private readonly peerId: string;

  constructor(peerId: string, initialValue: T, initialClock = 0) {
    this.peerId = peerId;
    this.envelope = Object.freeze({ value: initialValue, clock: initialClock, peerId });
  }

  get value(): T {
    return this.envelope.value;
  }

  get state(): LwwEnvelope<T> {
    return this.envelope;
  }

  set(nextValue: T): LwwEnvelope<T> {
    this.envelope = Object.freeze({ value: nextValue, clock: this.envelope.clock + 1, peerId: this.peerId });
    return this.envelope;
  }

  merge(remote: LwwEnvelope<T>): boolean {
    if (!winsOver(remote, this.envelope)) return false;
    this.envelope = Object.freeze({ ...remote });
    return true;
  }
}

export function createLwwRegister<T>(peerId: string, initialValue: T, initialClock = 0): LwwRegister<T> {
  return new LwwRegister(peerId, initialValue, initialClock);
}

/** Conflict-free LWW-Element-Map for collaborative UI state (forms, kanban, grids). */
export class LwwMap<T> {
  private entriesMap = new Map<string, LwwEnvelope<T | null>>();
  private clock = 0;
  private readonly peerId: string;

  constructor(peerId: string) {
    this.peerId = peerId;
  }

  set(key: string, value: T): LwwEnvelope<T | null> {
    this.clock += 1;
    const env: LwwEnvelope<T | null> = Object.freeze({ value, clock: this.clock, peerId: this.peerId });
    this.entriesMap.set(key, env);
    return env;
  }

  delete(key: string): LwwEnvelope<T | null> {
    this.clock += 1;
    const env: LwwEnvelope<T | null> = Object.freeze({ value: null, clock: this.clock, peerId: this.peerId });
    this.entriesMap.set(key, env);
    return env;
  }

  get(key: string): T | undefined {
    const env = this.entriesMap.get(key);
    return env && env.value !== null ? env.value : undefined;
  }

  mergeEntry(key: string, remote: LwwEnvelope<T | null>): boolean {
    this.clock = Math.max(this.clock, remote.clock);
    const local = this.entriesMap.get(key);
    if (local && !winsOver(remote, local)) return false;
    this.entriesMap.set(key, Object.freeze({ ...remote }));
    return true;
  }

  mergeState(remoteState: Readonly<Record<string, LwwEnvelope<T | null>>>): number {
    let applied = 0;
    for (const [k, v] of Object.entries(remoteState)) {
      if (this.mergeEntry(k, v)) applied += 1;
    }
    return applied;
  }

  toRecord(): Record<string, T> {
    const out: Record<string, T> = {};
    for (const [k, env] of this.entriesMap) {
      if (env.value !== null) out[k] = env.value;
    }
    return out;
  }

  exportState(): Record<string, LwwEnvelope<T | null>> {
    return Object.fromEntries(this.entriesMap.entries());
  }
}

export function createLwwMap<T>(peerId: string): LwwMap<T> {
  return new LwwMap<T>(peerId);
}

export interface PeerPresence<T = Record<string, unknown>> {
  readonly peerId: string;
  readonly state: T;
  readonly updatedAt: number;
}

/** Multiplayer presence store (cursors, active focus, selections) with TTL expiry. */
export class PresenceController<T = Record<string, unknown>> {
  private peers = new Map<string, PeerPresence<T>>();
  private readonly ttlMs: number;
  private onChange?: (peers: readonly PeerPresence<T>[]) => void;

  constructor(options: { ttlMs?: number; onChange?: (peers: readonly PeerPresence<T>[]) => void } = {}) {
    this.ttlMs = Math.max(1000, options.ttlMs ?? 30000);
    this.onChange = options.onChange;
  }

  update(peerId: string, state: T, now = Date.now()): void {
    this.peers.set(peerId, Object.freeze({ peerId, state, updatedAt: now }));
    this.onChange?.(this.getActivePeers(now));
  }

  remove(peerId: string): void {
    if (this.peers.delete(peerId)) this.onChange?.(this.getActivePeers());
  }

  prune(now = Date.now()): number {
    let removed = 0;
    for (const [id, peer] of this.peers) {
      if (now - peer.updatedAt > this.ttlMs) {
        this.peers.delete(id);
        removed += 1;
      }
    }
    if (removed > 0) this.onChange?.(this.getActivePeers(now));
    return removed;
  }

  getActivePeers(now = Date.now()): PeerPresence<T>[] {
    const out: PeerPresence<T>[] = [];
    for (const peer of this.peers.values()) {
      if (now - peer.updatedAt <= this.ttlMs) out.push(peer);
    }
    return out;
  }

  destroy(): void {
    this.peers.clear();
  }
}

export function createPresenceController<T = Record<string, unknown>>(
  options: { ttlMs?: number; onChange?: (peers: readonly PeerPresence<T>[]) => void } = {},
): PresenceController<T> {
  return new PresenceController<T>(options);
}
