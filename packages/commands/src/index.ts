export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  keywords?: readonly string[];
  group?: string;
  disabled?: boolean;
  onSelect?: () => void | Promise<void>;
  value?: unknown;
}

export interface RankedCommand { item: CommandItem; score: number; matched: boolean }
export interface CommandPaletteOptions {
  id?: string;
  items?: readonly CommandItem[];
  placeholder?: string;
  loop?: boolean;
  locale?: string;
  onQueryChange?: (query: string, signal: AbortSignal) => readonly CommandItem[] | Promise<readonly CommandItem[]>;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (item: CommandItem) => void | Promise<void>;
}
export interface CommandPaletteSnapshot {
  open: boolean;
  query: string;
  activeIndex: number;
  loading: boolean;
  error?: unknown;
  results: readonly RankedCommand[];
}

function normalize(value: string, locale?: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/gu, '').toLocaleLowerCase(locale).trim();
}

/** Subsequence-aware fuzzy matcher; exact prefixes rank ahead of scattered matches. */
export function scoreCommand(query: string, item: CommandItem, locale?: string): number {
  const needle = normalize(query, locale);
  if (!needle) return 1;
  const candidates = [item.label, item.description ?? '', ...(item.keywords ?? [])].map((value) => normalize(value, locale));
  let best = Number.NEGATIVE_INFINITY;
  for (const candidate of candidates) {
    if (candidate === needle) best = Math.max(best, 1000);
    else if (candidate.startsWith(needle)) best = Math.max(best, 800 - (candidate.length - needle.length));
    else if (candidate.includes(needle)) best = Math.max(best, 600 - candidate.indexOf(needle) - (candidate.length - needle.length) / 10);
    else {
      let cursor = 0;
      let score = 0;
      let streak = 0;
      for (const character of needle) {
        const index = candidate.indexOf(character, cursor);
        if (index < 0) { score = Number.NEGATIVE_INFINITY; break; }
        streak = index === cursor ? streak + 1 : 0;
        score += 10 + streak * 4 - Math.min(index - cursor, 12);
        cursor = index + 1;
      }
      best = Math.max(best, score - Math.max(0, candidate.length - needle.length) / 20);
    }
  }
  return best;
}

export function filterCommands(items: readonly CommandItem[], query: string, locale?: string): RankedCommand[] {
  const needle = normalize(query, locale);
  const enabled = items.filter((item) => !item.disabled);
  if (!needle) return enabled.map((item) => ({ item, score: 1, matched: true }));
  return enabled
    .map((item) => ({ item, score: scoreCommand(query, item, locale), matched: true }))
    .filter((result) => result.score > Number.NEGATIVE_INFINITY)
    .sort((left, right) => right.score - left.score || left.item.label.localeCompare(right.item.label, locale));
}

/**
 * Headless command palette state. It does not create a dialog or trap focus;
 * compose it with DialogController and render the listbox in the host framework.
 */
export class CommandPaletteController {
  private options: CommandPaletteOptions;
  private items: readonly CommandItem[];
  private open = false;
  private query = '';
  private activeIndex = 0;
  private loading = false;
  private error?: unknown;
  private request = 0;
  private abort?: AbortController;
  private destroyed = false;
  private listeners = new Set<() => void>();

  constructor(options: CommandPaletteOptions = {}) {
    this.options = { loop: true, locale: 'en', ...options, id: normalizeId(options.id ?? 'forma-command') };
    this.items = validateCommandItems(options.items ?? []);
  }
  getSnapshot = (): CommandPaletteSnapshot => ({ open: this.open, query: this.query, activeIndex: this.activeIndex, loading: this.loading, error: this.error, results: this.getResults() });
  subscribe = (listener: () => void): (() => void) => { this.assertActive(); this.listeners.add(listener); return () => this.listeners.delete(listener); };
  updateOptions(options: Partial<CommandPaletteOptions>): void {
    this.assertActive();
    const hasItems = Object.hasOwn(options, 'items');
    const nextItems = hasItems ? validateCommandItems(options.items ?? []) : this.items;
    const nextOptions = {
      ...this.options,
      ...options,
      ...(options.id !== undefined ? { id: normalizeId(options.id) } : {}),
    };

    // Commit only after validating input; replacing the item source invalidates
    // any in-flight provider response so it cannot overwrite newer local data.
    if (hasItems || Object.hasOwn(options, 'onQueryChange')) {
      this.request += 1;
      this.abort?.abort();
      this.loading = false;
    }
    this.options = nextOptions;
    this.items = nextItems;
    this.publish();
  }
  getResults(): RankedCommand[] { return filterCommands(this.items, this.query, this.options.locale).slice(0, 100); }
  get activeItem(): CommandItem | undefined { return this.getResults()[this.activeIndex]?.item; }

  setOpen(open: boolean): void {
    this.assertActive();
    if (this.open === open) return;
    this.open = open;
    if (!open) { this.abort?.abort(); this.loading = false; }
    this.options.onOpenChange?.(open);
    this.publish();
  }
  openPalette(): void { this.setOpen(true); }
  close(): void { this.setOpen(false); }

  async setQuery(query: string): Promise<void> {
    this.assertActive();
    this.query = query;
    this.activeIndex = 0;
    this.error = undefined;
    this.request += 1;
    const revision = this.request;
    this.abort?.abort();
    const provider = this.options.onQueryChange;
    if (!provider) { this.loading = false; this.publish(); return; }
    const abort = new AbortController();
    this.abort = abort;
    this.loading = true;
    this.publish();
    try {
      const results = await provider(query, abort.signal);
      if (!this.destroyed && !abort.signal.aborted && revision === this.request) {
        this.items = validateCommandItems(results);
        this.activeIndex = 0;
      }
    } catch (error) {
      if (!this.destroyed && !abort.signal.aborted && revision === this.request) this.error = error;
    } finally {
      if (!this.destroyed && revision === this.request) { this.loading = false; this.publish(); }
    }
  }

  move(delta: number): void {
    this.assertActive();
    const results = this.getResults();
    if (!results.length) { this.activeIndex = 0; this.publish(); return; }
    const movement = Number.isFinite(delta) ? Math.trunc(delta) : 0;
    const next = this.activeIndex + movement;
    this.activeIndex = this.options.loop
      ? ((next % results.length) + results.length) % results.length
      : Math.max(0, Math.min(results.length - 1, next));
    this.publish();
  }
  setActiveIndex(index: number): void {
    this.assertActive();
    const count = this.getResults().length;
    const safeIndex = Number.isFinite(index) ? Math.floor(index) : 0;
    this.activeIndex = count ? Math.max(0, Math.min(count - 1, safeIndex)) : 0;
    this.publish();
  }

  async select(itemOrId: CommandItem | string = this.activeItem!): Promise<boolean> {
    this.assertActive();
    const current = this.getResults();
    const item = typeof itemOrId === 'string'
      ? current.find((entry) => entry.item.id === itemOrId)?.item
      : current.find((entry) => entry.item.id === itemOrId?.id)?.item;
    if (!item || item.disabled) return false;
    try {
      await item.onSelect?.();
      await this.options.onSelect?.(item);
      this.close();
      return true;
    } catch (error) {
      this.error = error;
      this.publish();
      return false;
    }
  }

  getRootProps(label = 'Command results') { return { id: `${this.options.id}-listbox`, role: 'listbox' as const, 'aria-label': label, 'aria-busy': this.loading || undefined }; }
  getItemProps(item: CommandItem) {
    const index = this.getResults().findIndex((result) => result.item.id === item.id);
    return {
      id: `${this.options.id}-option-${safeId(item.id)}`,
      role: 'option' as const,
      'aria-selected': index >= 0 && index === this.activeIndex,
      'aria-disabled': item.disabled || undefined,
      onMouseMove: () => { if (index >= 0) this.setActiveIndex(index); },
      onClick: () => { if (index >= 0) void this.select(item); },
    };
  }
  getInputProps() {
    return { role: 'combobox' as const, 'aria-autocomplete': 'list' as const, 'aria-expanded': this.open, 'aria-controls': `${this.options.id}-listbox`, 'aria-activedescendant': this.activeItem ? `${this.options.id}-option-${safeId(this.activeItem.id)}` : undefined, placeholder: this.options.placeholder ?? 'Search commands…', value: this.query, onInput: (event: Event) => { void this.setQuery((event.currentTarget as HTMLInputElement).value); }, onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event) };
  }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.request += 1; this.abort?.abort(); this.listeners.clear(); }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); this.move(1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); this.move(-1); }
    else if (event.key === 'Home') { event.preventDefault(); this.setActiveIndex(0); }
    else if (event.key === 'End') { event.preventDefault(); this.setActiveIndex(this.getResults().length - 1); }
    else if (event.key === 'Enter') { event.preventDefault(); void this.select(); }
    else if (event.key === 'Escape') { event.preventDefault(); this.close(); }
  }
  private publish(): void { for (const listener of [...this.listeners]) listener(); }
  private assertActive(): void { if (this.destroyed) throw new Error('CommandPaletteController has been destroyed.'); }
}

function validateCommandItems(items: readonly CommandItem[]): readonly CommandItem[] {
  const ids = new Set<string>();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim()) throw new TypeError('Command item IDs must be non-empty strings.');
    if (ids.has(item.id)) throw new TypeError(`Duplicate command item ID: ${item.id}`);
    ids.add(item.id);
  }
  return items;
}

function normalizeId(value: string): string {
  const encoded = Array.from(value.trim()).map((character) => character.codePointAt(0)!.toString(16)).join('-');
  return encoded ? `forma-${encoded}` : 'forma-command';
}
function safeId(value: string): string {
  return Array.from(value).map((character) => character.codePointAt(0)!.toString(16)).join('-') || 'item';
}
export function createCommandPaletteController(options: CommandPaletteOptions = {}): CommandPaletteController { return new CommandPaletteController(options); }

export * from './frecency-and-pages';
export * from './chords-and-registry';
