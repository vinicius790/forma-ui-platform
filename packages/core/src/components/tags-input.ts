import { createId } from '../primitives/id';

export interface TagsInputOptions {
  id?: string;
  value?: readonly string[];
  defaultValue?: readonly string[];
  maxTags?: number;
  allowDuplicates?: boolean;
  delimiters?: readonly string[];
  disabled?: boolean;
  readOnly?: boolean;
  validate?: (tag: string) => boolean;
  onValueChange?: (tags: string[]) => void;
}

export class TagsInputController {
  private options: TagsInputOptions;
  private internalTags: string[];
  private inputText = '';
  private highlightedIndex = -1;
  readonly baseId: string;

  constructor(options: TagsInputOptions = {}) {
    this.options = { allowDuplicates: false, delimiters: [',', 'Enter'], ...options };
    this.internalTags = [...(options.defaultValue ?? [])];
    this.baseId = options.id ?? createId('forma-tags');
  }

  get tags(): readonly string[] {
    return this.options.value ?? this.internalTags;
  }

  get inputValue(): string {
    return this.inputText;
  }

  get highlightedTagIndex(): number {
    return this.highlightedIndex;
  }

  updateOptions(options: Partial<TagsInputOptions>): void {
    this.options = { ...this.options, ...options };
  }

  setInputValue(next: string): void {
    this.inputText = next;
    this.highlightedIndex = -1;
  }

  addTag(raw: string): boolean {
    if (this.options.disabled || this.options.readOnly) return false;
    const tag = raw.trim();
    if (!tag) return false;
    if (this.options.maxTags !== undefined && this.tags.length >= this.options.maxTags) return false;
    if (!this.options.allowDuplicates && this.tags.includes(tag)) return false;
    if (this.options.validate && !this.options.validate(tag)) return false;
    const next = [...this.tags, tag];
    if (this.options.value === undefined) this.internalTags = next;
    this.inputText = '';
    this.highlightedIndex = -1;
    this.options.onValueChange?.(next);
    return true;
  }

  removeTag(index: number): boolean {
    if (this.options.disabled || this.options.readOnly) return false;
    if (index < 0 || index >= this.tags.length) return false;
    const next = this.tags.filter((_, i) => i !== index);
    if (this.options.value === undefined) this.internalTags = next;
    this.highlightedIndex = Math.min(this.highlightedIndex, next.length - 1);
    this.options.onValueChange?.(next);
    return true;
  }

  clear(): void {
    if (this.options.disabled || this.options.readOnly || this.tags.length === 0) return;
    if (this.options.value === undefined) this.internalTags = [];
    this.highlightedIndex = -1;
    this.options.onValueChange?.([]);
  }

  getInputProps() {
    return {
      id: `${this.baseId}-input`,
      type: 'text' as const,
      value: this.inputText,
      disabled: Boolean(this.options.disabled),
      readOnly: Boolean(this.options.readOnly),
      'aria-describedby': `${this.baseId}-list`,
      onInput: (e: { currentTarget?: { value?: string }; target?: { value?: string } }) => {
        const val = e.currentTarget?.value ?? e.target?.value ?? '';
        this.setInputValue(val);
      },
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (this.options.disabled || this.options.readOnly) return;
        const delimiters = this.options.delimiters ?? [',', 'Enter'];
        if (delimiters.includes(e.key) && this.inputText.trim()) {
          e.preventDefault();
          this.addTag(this.inputText);
        } else if (e.key === 'Backspace' && this.inputText === '' && this.tags.length > 0) {
          e.preventDefault();
          const target = this.highlightedIndex >= 0 ? this.highlightedIndex : this.tags.length - 1;
          this.removeTag(target);
        } else if (e.key === 'ArrowLeft' && this.inputText === '' && this.tags.length > 0) {
          e.preventDefault();
          this.highlightedIndex = this.highlightedIndex <= 0 ? this.tags.length - 1 : this.highlightedIndex - 1;
        } else if (e.key === 'ArrowRight' && this.highlightedIndex >= 0) {
          e.preventDefault();
          this.highlightedIndex = this.highlightedIndex >= this.tags.length - 1 ? -1 : this.highlightedIndex + 1;
        }
      },
    };
  }

  getListProps(label = 'Selected tags') {
    return { id: `${this.baseId}-list`, role: 'list' as const, 'aria-label': label };
  }

  getTagProps(index: number) {
    return {
      id: `${this.baseId}-tag-${index}`,
      role: 'listitem' as const,
      'data-highlighted': this.highlightedIndex === index ? 'true' : undefined,
    };
  }

  getTagRemoveProps(index: number) {
    const label = this.tags[index] ?? '';
    return {
      type: 'button' as const,
      disabled: Boolean(this.options.disabled || this.options.readOnly),
      'aria-label': `Remove ${label}`,
      onClick: () => this.removeTag(index),
    };
  }

  destroy(): void {
    this.highlightedIndex = -1;
  }
}

export function createTagsInputController(options: TagsInputOptions = {}): TagsInputController {
  return new TagsInputController(options);
}
