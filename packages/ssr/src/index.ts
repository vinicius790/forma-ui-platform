/** Request-scoped deterministic identifiers for server rendering and hydration. */
export interface IdScope {
  readonly prefix: string;
  next(part?: string): string;
  keyed(key: string, part?: string): string;
  fork(segment: string): IdScope;
  snapshot(): Readonly<{ prefix: string; counter: number }>;
}

function safeSegment(value: string): string {
  const encoded = encodeURIComponent(value.trim() || 'id').replace(/%/gu, '_').replace(/[^a-zA-Z0-9_-]/gu, '-');
  return encoded.slice(0, 72) || 'id';
}

export function createIdScope(prefix = 'forma', initialCounter = 0): IdScope {
  const normalized = safeSegment(prefix);
  let counter = Math.max(0, Math.floor(initialCounter));
  return {
    prefix: normalized,
    next(part = 'id') { counter += 1; return `${normalized}-${safeSegment(part)}-${counter.toString(36)}`; },
    keyed(key, part = 'id') { return `${normalized}-${safeSegment(part)}-${safeSegment(key)}`; },
    fork(segment) { return createIdScope(`${normalized}-${safeSegment(segment)}`); },
    snapshot() { return Object.freeze({ prefix: normalized, counter }); },
  };
}

/** Stable keyed id does not depend on render order; useful for repeated data records. */
export function createKeyedId(prefix: string, key: string, part = 'id'): string {
  const scope = createIdScope(prefix);
  return scope.keyed(key, part);
}

/**
 * Create a minimal serializable request context. Keep one scope per request;
 * never share its counter across concurrent server requests.
 */
export function createRenderContext(requestId: string) {
  const ids = createIdScope(requestId);
  return { ids, serialize: () => ({ idPrefix: ids.prefix, idCounter: ids.snapshot().counter }) };
}

/** Escapes `<`, `>`, `&`, and line separators for XSS-safe inline JSON hydration payloads. */
export function serializeHydrationState(payload: unknown): string {
  return JSON.stringify(payload)
    .replace(/</gu, '\\u003c')
    .replace(/>/gu, '\\u003e')
    .replace(/&/gu, '\\u0026')
    .replace(/\u2028/gu, '\\u2028')
    .replace(/\u2029/gu, '\\u2029');
}

export function deserializeHydrationState<T>(raw: string): T {
  return JSON.parse(raw) as T;
}

/** Request-isolated hydration bag for streaming SSR frameworks (React RSC, SvelteKit, Nuxt, SolidStart, Qwik). */
export function createHydrationContext(requestId: string) {
  const ids = createIdScope(requestId);
  const store = new Map<string, unknown>();
  return {
    ids,
    set<T>(key: string, value: T): void {
      store.set(key, value);
    },
    get<T>(key: string): T | undefined {
      return store.get(key) as T | undefined;
    },
    serialize(): string {
      return serializeHydrationState({
        scope: ids.snapshot(),
        entries: Object.fromEntries(store.entries()),
      });
    },
  };
}

export * from './declarative-shadow-dom';
