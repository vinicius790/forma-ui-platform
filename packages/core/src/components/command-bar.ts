import { createId } from '../primitives/id';

export interface CommandBarItem {
  id: string;
  label: string;
  width: number;
  priority?: number;
  disabled?: boolean;
}

export interface CommandBarOptions {
  id?: string;
  items: readonly CommandBarItem[];
  containerWidth?: number;
  overflowButtonWidth?: number;
  gap?: number;
  onOverflowChange?: (visibleIds: string[], overflowIds: string[]) => void;
}

export class CommandBarController {
  private options: CommandBarOptions;
  private width: number;
  private visible: CommandBarItem[] = [];
  private overflow: CommandBarItem[] = [];
  readonly baseId: string;

  constructor(options: CommandBarOptions) {
    this.options = { overflowButtonWidth: 44, gap: 8, ...options };
    this.width = options.containerWidth ?? Infinity;
    this.baseId = options.id ?? createId('forma-command-bar');
    this.recompute(false);
  }

  get visibleItems(): readonly CommandBarItem[] {
    return this.visible;
  }

  get overflowItems(): readonly CommandBarItem[] {
    return this.overflow;
  }

  get hasOverflow(): boolean {
    return this.overflow.length > 0;
  }

  setContainerWidth(width: number): void {
    const safe = Math.max(0, Number.isFinite(width) ? width : Infinity);
    if (safe === this.width) return;
    this.width = safe;
    this.recompute(true);
  }

  updateOptions(options: Partial<CommandBarOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.containerWidth !== undefined) this.width = options.containerWidth;
    this.recompute(true);
  }

  private recompute(notify: boolean): void {
    const gap = this.options.gap ?? 8;
    const overflowReserve = this.options.overflowButtonWidth ?? 44;
    const totalAll = this.options.items.reduce((sum, item, i) => sum + item.width + (i > 0 ? gap : 0), 0);

    let nextVisible: CommandBarItem[];
    let nextOverflow: CommandBarItem[];

    if (totalAll <= this.width) {
      nextVisible = [...this.options.items];
      nextOverflow = [];
    } else {
      const budget = Math.max(0, this.width - overflowReserve - gap);
      const ranked = [...this.options.items]
        .map((item, idx) => ({ item, idx, priority: item.priority ?? 0 }))
        .sort((a, b) => b.priority - a.priority || a.idx - b.idx);
      const chosenIds = new Set<string>();
      let used = 0;
      for (const entry of ranked) {
        const needed = entry.item.width + (chosenIds.size > 0 ? gap : 0);
        if (used + needed <= budget) {
          used += needed;
          chosenIds.add(entry.item.id);
        }
      }
      nextVisible = this.options.items.filter((i) => chosenIds.has(i.id));
      nextOverflow = this.options.items.filter((i) => !chosenIds.has(i.id));
    }

    const prevKey = this.overflow.map((i) => i.id).join(',');
    const nextKey = nextOverflow.map((i) => i.id).join(',');
    this.visible = nextVisible;
    this.overflow = nextOverflow;
    if (notify && prevKey !== nextKey) {
      this.options.onOverflowChange?.(
        this.visible.map((i) => i.id),
        this.overflow.map((i) => i.id),
      );
    }
  }

  getRootProps(label = 'Command actions') {
    return {
      id: this.baseId,
      role: 'toolbar' as const,
      'aria-label': label,
      'data-has-overflow': this.hasOverflow ? 'true' : 'false',
    };
  }

  destroy(): void {
    // Idempotent cleanup
  }
}

export function createCommandBarController(options: CommandBarOptions): CommandBarController {
  return new CommandBarController(options);
}
