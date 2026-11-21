import { getDirectionalKey, getNextIndex, type Direction, type Orientation } from '../primitives/keyboard';
export interface TabRecord { value: string; id: string; panelId: string; element?: HTMLElement | null; disabled?: boolean }
export interface TabsOptions { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; orientation?: Orientation; direction?: Direction; activationMode?: 'automatic' | 'manual'; loop?: boolean }
export class TabsController {
  private internalValue: string;
  private focusedValue: string;
  private tabs: TabRecord[] = [];
  constructor(private options: TabsOptions = {}) { this.internalValue = options.defaultValue ?? ''; this.focusedValue = this.value; }
  get value(): string { return this.options.value ?? this.internalValue; }
  get focused(): string { return this.focusedValue; }
  updateOptions(options: Partial<TabsOptions>): void {
    const previousValue = this.value;
    this.options = { ...this.options, ...options };
    const selected = this.tabs.find((tab) => tab.value === this.value && !tab.disabled);
    if (Object.hasOwn(options, 'value') && previousValue !== this.value && selected) {
      this.focusedValue = selected.value;
    } else if (!selected && this.tabs.length > 0) {
      const first = this.tabs.find((tab) => !tab.disabled);
      if (first) this.focusedValue = first.value;
    } else if (this.focusedValue && !this.tabs.some((tab) => tab.value === this.focusedValue && !tab.disabled)) {
      this.focusedValue = selected?.value ?? '';
    }
  }
  register(tab: TabRecord): () => void {
    this.tabs = [...this.tabs.filter((x) => x.value !== tab.value), tab];
    if (!this.value || this.tabs.some((x) => x.value === this.value && x.disabled)) {
      const first = this.tabs.find((x) => !x.disabled);
      if (first) this.select(first.value);
    } else if (!this.focusedValue && !tab.disabled) {
      this.focusedValue = tab.value;
    }
    return () => {
      this.tabs = this.tabs.filter((x) => x.value !== tab.value);
      if (this.focusedValue === tab.value) this.focusedValue = this.value;
    };
  }
  select(value: string): void {
    const tab = this.tabs.find((x) => x.value === value);
    if (this.tabs.length > 0 ? (!tab || tab.disabled) : !value) return;
    if (this.options.value === undefined) this.internalValue = value;
    this.focusedValue = value;
    this.options.onValueChange?.(value);
  }
  focus(value: string): void { const tab = this.tabs.find((x) => x.value === value); if (!tab || tab.disabled) return; this.focusedValue = value; tab.element?.focus(); if ((this.options.activationMode ?? 'automatic') === 'automatic') this.select(value); }
  getTabProps(tab: TabRecord) { const selected = tab.value === this.value; return { id: tab.id, role: 'tab', tabIndex: !tab.disabled && (this.focusedValue === tab.value || (selected && !this.tabs.some((x) => x.value === this.focusedValue && !x.disabled))) ? 0 : -1, 'aria-selected': selected, 'aria-controls': tab.panelId, 'aria-disabled': tab.disabled || undefined, 'data-state': selected ? 'active' : 'inactive', onClick: () => this.select(tab.value), onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event, tab.value) }; }
  getPanelProps(tab: TabRecord) { return { id: tab.panelId, role: 'tabpanel', 'aria-labelledby': tab.id, hidden: tab.value !== this.value, tabIndex: 0 }; }
  onKeyDown(event: KeyboardEvent, from: string): void { const key = getDirectionalKey(event.key, this.options.direction ?? 'ltr'); const vertical = this.options.orientation === 'vertical'; let delta = 0; if ((!vertical && key === 'ArrowRight') || (vertical && key === 'ArrowDown')) delta = 1; if ((!vertical && key === 'ArrowLeft') || (vertical && key === 'ArrowUp')) delta = -1; if (key === 'Home' || key === 'End') { event.preventDefault(); const enabled = this.tabs.filter((x) => !x.disabled); const target = key === 'Home' ? enabled[0] : enabled.at(-1); if (target) this.focus(target.value); return; } if (delta) { event.preventDefault(); const enabled = this.tabs.filter((x) => !x.disabled); const index = enabled.findIndex((x) => x.value === from); const next = getNextIndex(index, enabled.length, delta, this.options.loop !== false); if (next >= 0) this.focus(enabled[next]!.value); } }
}
export function createTabsController(options: TabsOptions = {}): TabsController { return new TabsController(options); }
