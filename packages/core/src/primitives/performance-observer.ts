export interface InteractionMetric { name: string; durationMs: number; timestamp: number }

/** Measures synchronous or asynchronous UI interaction latency in milliseconds. */
export async function measureInteractionLatency<T>(name: string, fn: () => T | Promise<T>, onRecord?: (metric: InteractionMetric) => void): Promise<T> {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    return await fn();
  } finally {
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    onRecord?.({ name, durationMs: Math.max(0, Math.round((end - start) * 100) / 100), timestamp: Date.now() });
  }
}
