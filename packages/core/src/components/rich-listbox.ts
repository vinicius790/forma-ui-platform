export interface MentionCandidate {
  id: string;
  label: string;
}

export interface MentionMatch {
  trigger: string;
  query: string;
  startOffset: number;
  endOffset: number;
}

export interface MentionOptions {
  triggers?: readonly string[];
  candidates: readonly MentionCandidate[];
  onSelect?: (candidate: MentionCandidate, nextText: string, nextCursor: number) => void;
}

/** Extracts an active `@mention` or `/command` query immediately preceding `cursorOffset`. */
export function extractMentionTrigger(text: string, cursorOffset: number, triggers: readonly string[] = ['@', '/']): MentionMatch | null {
  const before = text.slice(0, Math.max(0, cursorOffset));
  for (const trigger of triggers) {
    const idx = before.lastIndexOf(trigger);
    if (idx < 0) continue;
    if (idx > 0 && !/\s/u.test(before[idx - 1]!)) continue;
    const query = before.slice(idx + trigger.length);
    if (/\s/u.test(query)) continue;
    return { trigger, query, startOffset: idx, endOffset: cursorOffset };
  }
  return null;
}

export class MentionController {
  private options: MentionOptions;
  private textValue = '';
  private cursor = 0;
  private activeMatch: MentionMatch | null = null;
  private highlighted = 0;

  constructor(options: MentionOptions) {
    this.options = { triggers: ['@', '/'], ...options };
  }

  get open(): boolean {
    return this.activeMatch !== null && this.filteredCandidates.length > 0;
  }

  get match(): MentionMatch | null {
    return this.activeMatch;
  }

  get highlightedIndex(): number {
    return this.highlighted;
  }

  get filteredCandidates(): MentionCandidate[] {
    if (!this.activeMatch) return [];
    const q = this.activeMatch.query.toLowerCase();
    return this.options.candidates.filter((c) => c.label.toLowerCase().includes(q));
  }

  updateText(text: string, cursorOffset: number): void {
    this.textValue = text;
    this.cursor = cursorOffset;
    this.activeMatch = extractMentionTrigger(text, cursorOffset, this.options.triggers);
    this.highlighted = 0;
  }

  selectCandidate(index = this.highlighted): { text: string; cursor: number } | null {
    const list = this.filteredCandidates;
    const picked = list[index];
    if (!picked || !this.activeMatch) return null;
    const insertion = `${this.activeMatch.trigger}${picked.label} `;
    const nextText = this.textValue.slice(0, this.activeMatch.startOffset) + insertion + this.textValue.slice(this.activeMatch.endOffset);
    const nextCursor = this.activeMatch.startOffset + insertion.length;
    this.textValue = nextText;
    this.cursor = nextCursor;
    this.activeMatch = null;
    this.options.onSelect?.(picked, nextText, nextCursor);
    return { text: nextText, cursor: nextCursor };
  }

  handleKeyDown(e: Pick<KeyboardEvent, 'key' | 'preventDefault'>): void {
    if (!this.open) return;
    const count = this.filteredCandidates.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); this.highlighted = (this.highlighted + 1) % count; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.highlighted = (this.highlighted - 1 + count) % count; }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); this.selectCandidate(); }
    else if (e.key === 'Escape') { e.preventDefault(); this.activeMatch = null; }
  }

  destroy(): void {
    this.activeMatch = null;
  }
}

export function createMentionController(options: MentionOptions): MentionController {
  return new MentionController(options);
}
