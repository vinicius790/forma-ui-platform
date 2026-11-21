import { createId } from '../primitives/id';

export interface SplitButtonOptions { id?: string; disabled?: boolean; defaultOpen?: boolean; onPrimaryAction?: () => void; onOpenChange?: (open: boolean) => void }

export class SplitButtonController {
  private options: SplitButtonOptions;
  private menuOpen: boolean;
  readonly baseId: string;
  constructor(options: SplitButtonOptions = {}) {
    this.options = options;
    this.menuOpen = options.defaultOpen ?? false;
    this.baseId = options.id ?? createId('forma-split-btn');
  }
  get open(): boolean { return this.menuOpen; }
  setOpen(next: boolean): void {
    if (this.options.disabled || next === this.menuOpen) return;
    this.menuOpen = next;
    this.options.onOpenChange?.(next);
  }
  triggerPrimary(): void {
    if (this.options.disabled) return;
    this.options.onPrimaryAction?.();
  }
  getPrimaryButtonProps() {
    return { id: `${this.baseId}-primary`, type: 'button' as const, disabled: Boolean(this.options.disabled), onClick: () => this.triggerPrimary() };
  }
  getMenuTriggerProps() {
    return {
      id: `${this.baseId}-trigger`,
      type: 'button' as const,
      disabled: Boolean(this.options.disabled),
      'aria-haspopup': 'menu' as const,
      'aria-expanded': this.menuOpen,
      'aria-controls': `${this.baseId}-menu`,
      onClick: () => this.setOpen(!this.menuOpen),
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); this.setOpen(true); }
        else if (e.key === 'Escape') { e.preventDefault(); this.setOpen(false); }
      },
    };
  }
  destroy(): void { this.menuOpen = false; }
}
export function createSplitButtonController(options: SplitButtonOptions = {}): SplitButtonController {
  return new SplitButtonController(options);
}
