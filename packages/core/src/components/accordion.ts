export interface AccordionOptions { multiple?: boolean; collapsible?: boolean; defaultValue?: string | string[]; value?: string | string[]; onValueChange?: (value: string | string[]) => void }
export class AccordionController {
  private internal = new Set<string>();
  private registered = new Map<string, { disabled: boolean }>();
  constructor(private options: AccordionOptions = {}) { for (const value of this.values(options.defaultValue ?? (options.multiple ? [] : ''))) this.internal.add(value); }
  private values(value: string | string[] | undefined): string[] { return value === undefined ? [] : Array.isArray(value) ? value : value ? [value] : []; }
  get value(): string | string[] { const values = this.options.value === undefined ? [...this.internal] : this.values(this.options.value); return this.options.multiple ? values : values[0] ?? ''; }
  updateOptions(options: Partial<AccordionOptions>): void { this.options = { ...this.options, ...options }; }
  isOpen(value: string): boolean { return this.values(this.value).includes(value); }
  register(value: string, disabled = false): () => void { this.registered.set(value, { disabled }); return () => this.registered.delete(value); }
  toggle(value: string): void {
    if (this.registered.get(value)?.disabled) return;
    const current = this.values(this.value); let next: string[];
    if (current.includes(value)) next = this.options.collapsible === false && !this.options.multiple ? current : current.filter((item) => item !== value);
    else next = this.options.multiple ? [...current, value] : [value];
    if (this.options.value === undefined) this.internal = new Set(next);
    this.options.onValueChange?.(this.options.multiple ? next : next[0] ?? '');
  }
  getItemProps(value: string) { const expanded = this.isOpen(value); const disabled = this.registered.get(value)?.disabled ?? false; return { 'aria-expanded': expanded, 'aria-controls': `${value}-panel`, 'data-state': expanded ? 'open' : 'closed', 'data-disabled': disabled ? '' : undefined, disabled }; }
}
export function createAccordionController(options: AccordionOptions = {}): AccordionController { return new AccordionController(options); }
