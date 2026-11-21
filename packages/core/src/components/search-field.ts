export interface SearchFieldOptions { value?: string; defaultValue?: string; disabled?: boolean; readOnly?: boolean; name?: string; placeholder?: string; onValueChange?: (value: string) => void; onSearch?: (value: string) => void }
export class SearchFieldController {
  private options: SearchFieldOptions;
  private internal: string;
  constructor(options: SearchFieldOptions = {}) { this.options = { ...options }; this.internal = options.defaultValue ?? ''; }
  get value(): string { return this.options.value ?? this.internal; }
  updateOptions(options: Partial<SearchFieldOptions>): void { this.options = { ...this.options, ...options }; }
  setValue(value: string): void { if (this.options.disabled || this.options.readOnly || value === this.value) return; if (this.options.value === undefined) this.internal = value; this.options.onValueChange?.(value); }
  clear(): void { this.setValue(''); }
  submit(): void { if (!this.options.disabled) this.options.onSearch?.(this.value); }
  getInputProps() { return { type: 'search' as const, role: 'searchbox' as const, name: this.options.name, value: this.value, placeholder: this.options.placeholder, disabled: this.options.disabled, readOnly: this.options.readOnly, onInput: (event: Event) => this.setValue((event.currentTarget as HTMLInputElement).value), onKeyDown: (event: KeyboardEvent) => { if (event.key === 'Escape' && this.value && !this.options.disabled && !this.options.readOnly) { event.preventDefault(); this.clear(); } else if (event.key === 'Enter') this.submit(); } }; }
  getClearButtonProps() { return { type: 'button' as const, disabled: this.options.disabled || this.options.readOnly || !this.value, 'aria-label': 'Clear search', onClick: () => this.clear() }; }
}
export function createSearchFieldController(options: SearchFieldOptions = {}): SearchFieldController { return new SearchFieldController(options); }
