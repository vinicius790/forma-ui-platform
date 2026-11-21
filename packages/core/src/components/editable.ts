import { createId } from '../primitives/id';

export type EditableActivationMode = 'click' | 'dblclick' | 'focus';

export interface EditableOptions {
  id?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  activationMode?: EditableActivationMode;
  submitOnBlur?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onValueChange?: (value: string) => void;
  onValueCommit?: (value: string) => void;
  onEditChange?: (editing: boolean) => void;
}

export class EditableController {
  private options: EditableOptions;
  private internalValue: string;
  private draftValue: string;
  private isEditing = false;
  readonly baseId: string;

  constructor(options: EditableOptions = {}) {
    this.options = { activationMode: 'click', submitOnBlur: true, ...options };
    this.internalValue = options.defaultValue ?? '';
    this.draftValue = this.value;
    this.baseId = options.id ?? createId('forma-editable');
  }

  get value(): string {
    return this.options.value ?? this.internalValue;
  }

  get draft(): string {
    return this.isEditing ? this.draftValue : this.value;
  }

  get editing(): boolean {
    return this.isEditing;
  }

  updateOptions(options: Partial<EditableOptions>): void {
    this.options = { ...this.options, ...options };
  }

  edit(): void {
    if (this.options.disabled || this.options.readOnly || this.isEditing) return;
    this.draftValue = this.value;
    this.isEditing = true;
    this.options.onEditChange?.(true);
  }

  setDraft(next: string): void {
    if (!this.isEditing) return;
    this.draftValue = next;
    this.options.onValueChange?.(next);
  }

  submit(): void {
    if (!this.isEditing) return;
    const committed = this.draftValue;
    this.isEditing = false;
    if (this.options.value === undefined) this.internalValue = committed;
    this.options.onValueChange?.(committed);
    this.options.onValueCommit?.(committed);
    this.options.onEditChange?.(false);
  }

  cancel(): void {
    if (!this.isEditing) return;
    this.draftValue = this.value;
    this.isEditing = false;
    this.options.onEditChange?.(false);
  }

  getPreviewProps() {
    const mode = this.options.activationMode ?? 'click';
    return {
      id: `${this.baseId}-preview`,
      tabIndex: this.options.disabled ? -1 : 0,
      hidden: this.isEditing,
      'data-placeholder-shown': this.value === '' ? 'true' : undefined,
      onClick: mode === 'click' ? () => this.edit() : undefined,
      onDoubleClick: mode === 'dblclick' ? () => this.edit() : undefined,
      onFocus: mode === 'focus' ? () => this.edit() : undefined,
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === 'Enter' || e.key === 'F2') {
          e.preventDefault();
          this.edit();
        }
      },
    };
  }

  getInputProps() {
    return {
      id: `${this.baseId}-input`,
      value: this.draft,
      placeholder: this.options.placeholder,
      hidden: !this.isEditing,
      disabled: Boolean(this.options.disabled),
      readOnly: Boolean(this.options.readOnly),
      onInput: (e: { currentTarget?: { value?: string }; target?: { value?: string } }) => {
        this.setDraft(e.currentTarget?.value ?? e.target?.value ?? '');
      },
      onBlur: () => {
        if (this.options.submitOnBlur ?? true) this.submit();
      },
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.cancel();
        }
      },
    };
  }

  destroy(): void {
    this.isEditing = false;
  }
}

export function createEditableController(options: EditableOptions = {}): EditableController {
  return new EditableController(options);
}
