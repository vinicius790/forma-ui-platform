/** Cooperative main-thread scheduler using `scheduler.yield()` when available with universal fallback. */
export function yieldToMain(): Promise<void> {
  const g = globalThis as { scheduler?: { yield?: () => Promise<void> } };
  if (typeof g.scheduler?.yield === 'function') return g.scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function runChunkedWork<T>(
  items: readonly T[],
  work: (item: T, index: number) => void,
  chunkSize = 50,
  signal?: AbortSignal,
): Promise<number> {
  const size = Math.max(1, Math.trunc(chunkSize));
  let processed = 0;
  for (let i = 0; i < items.length; i += 1) {
    if (signal?.aborted) break;
    work(items[i]!, i);
    processed += 1;
    if (processed % size === 0 && i + 1 < items.length) await yieldToMain();
  }
  return processed;
}
