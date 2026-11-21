import { createId } from '../primitives/id';

export interface SegmentItem {
  value: string;
  disabled?: boolean;
}

export interface SegmentGroupOptions {
  id?: string;
  items: readonly SegmentItem[];
  value?: string;
  defaultValue?: string;
  orientation?: 'horizontal' | 'vertical';
  dir?: 'ltr' | 'rtl';
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}

export class SegmentGroupController {
  private options: SegmentGroupOptions;
  private internalValue: string;
  readonly baseId: string;

  constructor(options: SegmentGroupOptions) {
    this.options = { orientation: 'horizontal', dir: 'ltr', ...options };
    const firstEnabled = options.items.find((i) => !i.disabled)?.value ?? '';
    this.internalValue = options.defaultValue ?? firstEnabled;
    this.baseId = options.id ?? createId('forma-segment');
  }

  get value(): string {
    return this.options.value ?? this.internalValue;
  }

  updateOptions(options: Partial<SegmentGroupOptions>): void {
    this.options = { ...this.options, ...options };
  }

  select(next: string): void {
    if (this.options.disabled) return;
    const item = this.options.items.find((i) => i.value === next);
    if (!item || item.disabled || next === this.value) return;
    if (this.options.value === undefined) this.internalValue = next;
    this.options.onValueChange?.(next);
  }

  private move(delta: number): void {
    const enabled = this.options.items.filter((i) => !i.disabled);
    if (enabled.length === 0) return;
    const idx = Math.max(0, enabled.findIndex((i) => i.value === this.value));
    const next = enabled[((idx + delta) % enabled.length + enabled.length) % enabled.length];
    if (next) this.select(next.value);
  }

  getRootProps(label = 'Segmented control') {
    return {
      id: this.baseId,
      role: 'radiogroup' as const,
      'aria-label': label,
      'aria-orientation': this.options.orientation ?? 'horizontal',
      'data-orientation': this.options.orientation ?? 'horizontal',
    };
  }

  getItemProps(itemValue: string) {
    const item = this.options.items.find((i) => i.value === itemValue);
    const checked = this.value === itemValue;
    const disabled = Boolean(this.options.disabled || item?.disabled);
    const isHoriz = (this.options.orientation ?? 'horizontal') === 'horizontal';
    const isRtl = this.options.dir === 'rtl';

    return {
      id: `${this.baseId}-item-${itemValue}`,
      type: 'button' as const,
      role: 'radio' as const,
      disabled,
      'aria-checked': checked,
      tabIndex: checked && !disabled ? 0 : -1,
      'data-state': checked ? ('checked' as const) : ('unchecked' as const),
      onClick: () => this.select(itemValue),
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (disabled) return;
        const nextKey = isHoriz ? (isRtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
        const prevKey = isHoriz ? (isRtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
        if (e.key === nextKey) {
          e.preventDefault();
          this.move(1);
        } else if (e.key === prevKey) {
          e.preventDefault();
          this.move(-1);
        } else if (e.key === 'Home') {
          e.preventDefault();
          const first = this.options.items.find((i) => !i.disabled);
          if (first) this.select(first.value);
        } else if (e.key === 'End') {
          e.preventDefault();
          const last = [...this.options.items].reverse().find((i) => !i.disabled);
          if (last) this.select(last.value);
        }
      },
    };
  }

  destroy(): void {
    // Idempotent cleanup
  }
}

export function createSegmentGroupController(options: SegmentGroupOptions): SegmentGroupController {
  return new SegmentGroupController(options);
}
