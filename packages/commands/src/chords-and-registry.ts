import type { CommandItem } from './index';

export interface ChordBinding {
  readonly id: string;
  readonly sequence: readonly string[];
  readonly onMatch?: () => void;
}

export interface ChordTrackerOptions {
  /** Milliseconds before an incomplete chord buffer automatically resets. Default: 1000. */
  timeoutMs?: number;
  /** Whether chord key comparisons are case-sensitive. Default: false. */
  caseSensitive?: boolean;
  onMatch?: (binding: ChordBinding) => void;
  onReset?: () => void;
}

export type ChordFeedResult =
  | { readonly status: 'matched'; readonly binding: ChordBinding; readonly buffer: readonly string[] }
  | { readonly status: 'pending'; readonly buffer: readonly string[]; readonly candidates: readonly ChordBinding[] }
  | { readonly status: 'none'; readonly buffer: readonly string[] };

interface NormalizedChord {
  readonly binding: ChordBinding;
  readonly keys: readonly string[];
}

/**
 * Multi-key keyboard chord engine (e.g. `['g', 'i']` -> inbox) with timeout reset,
 * prefix match status reporting, and idempotent cleanup.
 */
export class ChordSequenceTracker {
  private chords: readonly NormalizedChord[];
  private options: ChordTrackerOptions;
  private timeoutMs: number;
  private caseSensitive: boolean;
  private buffer: string[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(chords: readonly ChordBinding[], options: ChordTrackerOptions = {}) {
    this.options = options;
    this.caseSensitive = Boolean(options.caseSensitive);
    const rawTimeout = options.timeoutMs ?? 1000;
    this.timeoutMs = Number.isFinite(rawTimeout) && rawTimeout > 0 ? Math.floor(rawTimeout) : 0;
    this.chords = chords
      .map((binding) => ({
        binding,
        keys: binding.sequence.map((key) => this.normalizeKey(key)).filter((key) => key.length > 0),
      }))
      .filter((entry) => entry.keys.length > 0);
  }

  get pendingKeys(): readonly string[] {
    return [...this.buffer];
  }

  get isPending(): boolean {
    return this.buffer.length > 0;
  }

  feed(keyOrEvent: string | { readonly key: string }): ChordFeedResult {
    if (this.destroyed) return { status: 'none', buffer: [] };
    const rawKey = typeof keyOrEvent === 'string' ? keyOrEvent : keyOrEvent.key;
    const key = this.normalizeKey(rawKey);
    if (!key) return { status: 'none', buffer: [...this.buffer] };

    this.clearTimer();

    const attempt = this.evaluate([...this.buffer, key]);
    if (attempt !== null) return attempt;

    if (this.buffer.length > 0) {
      this.buffer = [];
      const restarted = this.evaluate([key]);
      if (restarted !== null) return restarted;
      this.options.onReset?.();
    }

    return { status: 'none', buffer: [] };
  }

  reset(): void {
    this.clearTimer();
    if (this.buffer.length === 0) return;
    this.buffer = [];
    this.options.onReset?.();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearTimer();
    this.buffer = [];
  }

  private evaluate(candidateBuffer: string[]): ChordFeedResult | null {
    let exactMatch: NormalizedChord | undefined;
    const prefixMatches: ChordBinding[] = [];

    for (const entry of this.chords) {
      if (entry.keys.length < candidateBuffer.length) continue;
      let matchesPrefix = true;
      for (let i = 0; i < candidateBuffer.length; i += 1) {
        if (entry.keys[i] !== candidateBuffer[i]) {
          matchesPrefix = false;
          break;
        }
      }
      if (!matchesPrefix) continue;
      if (entry.keys.length === candidateBuffer.length && !exactMatch) {
        exactMatch = entry;
      } else if (entry.keys.length > candidateBuffer.length) {
        prefixMatches.push(entry.binding);
      }
    }

    if (exactMatch) {
      this.buffer = [];
      exactMatch.binding.onMatch?.();
      this.options.onMatch?.(exactMatch.binding);
      return { status: 'matched', binding: exactMatch.binding, buffer: candidateBuffer };
    }

    if (prefixMatches.length > 0) {
      this.buffer = candidateBuffer;
      this.scheduleReset();
      return { status: 'pending', buffer: [...this.buffer], candidates: prefixMatches };
    }

    return null;
  }

  private scheduleReset(): void {
    this.clearTimer();
    if (this.timeoutMs <= 0 || this.destroyed) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.destroyed || this.buffer.length === 0) return;
      this.buffer = [];
      this.options.onReset?.();
    }, this.timeoutMs);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private normalizeKey(key: string): string {
    const trimmed = key.trim();
    return this.caseSensitive ? trimmed : trimmed.toLowerCase();
  }
}

export function createChordSequenceTracker(
  chords: readonly ChordBinding[],
  options: ChordTrackerOptions = {},
): ChordSequenceTracker {
  return new ChordSequenceTracker(chords, options);
}

export interface CommandSource {
  readonly name: string;
  /** Higher priority sources take precedence during ordering and ID deduplication. Default: 0. */
  readonly priority?: number;
  readonly getItems: (
    query: string,
    signal?: AbortSignal,
  ) => readonly CommandItem[] | Promise<readonly CommandItem[]>;
}

export interface CommandRegistry {
  register(source: CommandSource): () => void;
  unregister(name: string): boolean;
  getSourceNames(): string[];
  resolveAll(query: string, signal?: AbortSignal): Promise<CommandItem[]>;
  clear(): void;
}

interface RegisteredSource {
  readonly source: CommandSource;
  readonly priority: number;
  readonly order: number;
}

/**
 * Merges multiple named command sources/plugins with priority ordering, ID deduplication,
 * and abort-safe async resolution.
 */
export function createCommandRegistry(): CommandRegistry {
  const sources = new Map<string, RegisteredSource>();
  let sequence = 0;

  return {
    register(source: CommandSource): () => void {
      if (!source || typeof source.name !== 'string' || !source.name.trim()) {
        throw new TypeError('Command source name must be a non-empty string.');
      }
      const priority = Number.isFinite(source.priority ?? 0) ? (source.priority ?? 0) : 0;
      const entry: RegisteredSource = { source, priority, order: ++sequence };
      sources.set(source.name, entry);
      return () => {
        if (sources.get(source.name) === entry) {
          sources.delete(source.name);
        }
      };
    },

    unregister(name: string): boolean {
      return sources.delete(name);
    },

    getSourceNames(): string[] {
      return [...sources.values()]
        .sort((a, b) => b.priority - a.priority || a.order - b.order)
        .map((entry) => entry.source.name);
    },

    async resolveAll(query: string, signal?: AbortSignal): Promise<CommandItem[]> {
      if (signal?.aborted) return [];
      const ordered = [...sources.values()].sort(
        (a, b) => b.priority - a.priority || a.order - b.order,
      );
      if (ordered.length === 0) return [];

      let onAbort: (() => void) | undefined;
      const abortPromise = signal
        ? new Promise<'aborted'>((resolve) => {
            if (signal.aborted) {
              resolve('aborted');
              return;
            }
            onAbort = () => resolve('aborted');
            signal.addEventListener('abort', onAbort, { once: true });
          })
        : null;

      const batchPromise = Promise.all(
        ordered.map(async (entry) => {
          try {
            return await entry.source.getItems(query, signal);
          } catch (error) {
            if (signal?.aborted) return [] as readonly CommandItem[];
            throw error;
          }
        }),
      );
      batchPromise.catch(() => {});

      try {
        const outcome = abortPromise
          ? await Promise.race([batchPromise, abortPromise])
          : await batchPromise;
        if (outcome === 'aborted' || signal?.aborted) return [];

        const seen = new Set<string>();
        const merged: CommandItem[] = [];
        for (const list of outcome) {
          for (const item of list) {
            if (!item || typeof item.id !== 'string' || !item.id.trim() || seen.has(item.id)) continue;
            seen.add(item.id);
            merged.push(item);
          }
        }
        return merged;
      } finally {
        if (signal && onAbort) {
          signal.removeEventListener('abort', onAbort);
        }
      }
    },

    clear(): void {
      sources.clear();
    },
  };
}

/** Tracks recently executed command IDs in Most-Recently-Used (MRU) order. */
export class CommandHistory {
  private entries: string[] = [];
  private maxSize: number;

  constructor(maxSize = 20) {
    this.maxSize = Math.max(1, Number.isFinite(maxSize) ? Math.floor(maxSize) : 20);
  }

  get recent(): readonly string[] {
    return [...this.entries];
  }

  get size(): number {
    return this.entries.length;
  }

  record(commandId: string): void {
    if (typeof commandId !== 'string' || !commandId.trim()) return;
    this.entries = [commandId, ...this.entries.filter((id) => id !== commandId)].slice(0, this.maxSize);
  }

  has(commandId: string): boolean {
    return this.entries.includes(commandId);
  }

  remove(commandId: string): boolean {
    const before = this.entries.length;
    this.entries = this.entries.filter((id) => id !== commandId);
    return this.entries.length < before;
  }

  clear(): void {
    this.entries = [];
  }
}

export function createCommandHistory(maxSize = 20): CommandHistory {
  return new CommandHistory(maxSize);
}
