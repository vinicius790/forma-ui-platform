export interface AsyncKvStore<T = unknown> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/** SSR-safe asynchronous key-value store with deterministic in-memory fallback when IndexedDB is unavailable. */
export function createAsyncKvStore<T = unknown>(): AsyncKvStore<T> {
  const memory = new Map<string, T>();
  return {
    async get(key) { return memory.get(key); },
    async set(key, value) { memory.set(key, value); },
    async delete(key) { memory.delete(key); },
    async clear() { memory.clear(); },
  };
}
