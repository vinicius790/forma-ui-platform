export type TelemetrySeverity = 'info' | 'warn' | 'error';

export interface TelemetryEvent {
  readonly id: string;
  readonly controller: string;
  readonly action: string;
  readonly severity: TelemetrySeverity;
  readonly timestamp: number;
  readonly detail?: Readonly<Record<string, unknown>>;
}

export interface TelemetryBus {
  emit(event: Omit<TelemetryEvent, 'timestamp'>): void;
  subscribe(listener: (event: TelemetryEvent) => void): () => void;
  getHistory(): readonly TelemetryEvent[];
  clear(): void;
}

/** Zero-dependency opt-in telemetry bus powering @forma-ui/devtools and QA transition auditing. */
export function createTelemetryBus(maxHistory = 500): TelemetryBus {
  const cap = Math.max(1, Math.trunc(maxHistory));
  const listeners = new Set<(event: TelemetryEvent) => void>();
  let history: TelemetryEvent[] = [];

  return {
    emit(input) {
      const event: TelemetryEvent = Object.freeze({ ...input, timestamp: Date.now() });
      history = [...history.slice(-(cap - 1)), event];
      for (const listener of [...listeners]) listener(event);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getHistory() {
      return [...history];
    },
    clear() {
      history = [];
    },
  };
}
