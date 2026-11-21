export interface MatchRange {
  start: number;
  end: number;
}

/** Returns contiguous matched character ranges in `label` for highlighting fuzzy command matches. */
export function getFuzzyMatchRanges(query: string, label: string): MatchRange[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const hay = label.toLowerCase();
  const exactIdx = hay.indexOf(needle);
  if (exactIdx >= 0) return [{ start: exactIdx, end: exactIdx + needle.length }];

  const ranges: MatchRange[] = [];
  let cursor = 0;
  for (const ch of needle) {
    const idx = hay.indexOf(ch, cursor);
    if (idx < 0) return [];
    const last = ranges[ranges.length - 1];
    if (last && last.end === idx) last.end = idx + 1;
    else ranges.push({ start: idx, end: idx + 1 });
    cursor = idx + 1;
  }
  return ranges;
}

export interface FrecencyRecord {
  count: number;
  lastUsedAt: number;
}

/** Tracks command frequency + recency (frecency) with exponential half-life decay. */
export class FrecencyTracker {
  private records = new Map<string, FrecencyRecord>();
  private halfLifeMs: number;

  constructor(halfLifeDays = 7) {
    this.halfLifeMs = Math.max(1, halfLifeDays) * 24 * 60 * 60 * 1000;
  }

  record(commandId: string, now = Date.now()): void {
    const prev = this.records.get(commandId);
    this.records.set(commandId, { count: (prev?.count ?? 0) + 1, lastUsedAt: now });
  }

  score(commandId: string, now = Date.now()): number {
    const entry = this.records.get(commandId);
    if (!entry) return 0;
    const age = Math.max(0, now - entry.lastUsedAt);
    const decay = Math.pow(0.5, age / this.halfLifeMs);
    return Math.round(entry.count * 100 * decay * 100) / 100;
  }

  exportRecords(): Record<string, FrecencyRecord> {
    return Object.fromEntries(this.records.entries());
  }

  importRecords(data: Record<string, FrecencyRecord>): void {
    this.records.clear();
    for (const [id, rec] of Object.entries(data)) {
      if (rec && typeof rec.count === 'number' && typeof rec.lastUsedAt === 'number') {
        this.records.set(id, { count: rec.count, lastUsedAt: rec.lastUsedAt });
      }
    }
  }
}

export function createFrecencyTracker(halfLifeDays = 7): FrecencyTracker {
  return new FrecencyTracker(halfLifeDays);
}

export interface CommandPage {
  id: string;
  title: string;
}

/** Nested sub-page stack for multi-level Command Palettes. */
export class CommandPageStack {
  private stack: CommandPage[] = [];

  get pages(): readonly CommandPage[] {
    return this.stack;
  }

  get current(): CommandPage | undefined {
    return this.stack[this.stack.length - 1];
  }

  get depth(): number {
    return this.stack.length;
  }

  push(page: CommandPage): void {
    this.stack = [...this.stack, page];
  }

  pop(): CommandPage | undefined {
    if (this.stack.length === 0) return undefined;
    const top = this.stack[this.stack.length - 1];
    this.stack = this.stack.slice(0, -1);
    return top;
  }

  reset(): void {
    this.stack = [];
  }
}

export function createCommandPageStack(): CommandPageStack {
  return new CommandPageStack();
}
