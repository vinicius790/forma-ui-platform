import { createId } from '../primitives/id';

export interface MenubarItem {
  id: string;
  disabled?: boolean;
}

export interface MenubarOptions {
  id?: string;
  items: readonly MenubarItem[];
  activeMenu?: string | null;
  defaultActiveMenu?: string | null;
  dir?: 'ltr' | 'rtl';
  loop?: boolean;
  onActiveMenuChange?: (menuId: string | null) => void;
}

export class MenubarController {
  private options: MenubarOptions;
  private internalActive: string | null;
  private focusedId: string;
  readonly baseId: string;

  constructor(options: MenubarOptions) {
    this.options = { dir: 'ltr', loop: true, ...options };
    this.internalActive = options.defaultActiveMenu ?? null;
    this.focusedId = options.items.find((i) => !i.disabled)?.id ?? '';
    this.baseId = options.id ?? createId('forma-menubar');
  }

  get activeMenu(): string | null {
    return this.options.activeMenu !== undefined ? this.options.activeMenu : this.internalActive;
  }

  get focusedMenuId(): string {
    return this.focusedId;
  }

  updateOptions(options: Partial<MenubarOptions>): void {
    this.options = { ...this.options, ...options };
  }

  openMenu(id: string | null): void {
    if (id !== null) {
      const item = this.options.items.find((i) => i.id === id);
      if (!item || item.disabled) return;
      this.focusedId = id;
    }
    if (id === this.activeMenu) return;
    if (this.options.activeMenu === undefined) this.internalActive = id;
    this.options.onActiveMenuChange?.(id);
  }

  closeAll(): void {
    this.openMenu(null);
  }

  private move(delta: number): void {
    const enabled = this.options.items.filter((i) => !i.disabled);
    if (!enabled.length) return;
    const currentIdx = Math.max(0, enabled.findIndex((i) => i.id === this.focusedId));
    const raw = currentIdx + delta;
    const nextIdx = (this.options.loop ?? true)
      ? ((raw % enabled.length) + enabled.length) % enabled.length
      : Math.min(enabled.length - 1, Math.max(0, raw));
    const next = enabled[nextIdx]!;
    this.focusedId = next.id;
    if (this.activeMenu !== null) this.openMenu(next.id);
  }

  getMenubarProps(label = 'Application menu') {
    return { id: this.baseId, role: 'menubar' as const, 'aria-label': label };
  }

  getTriggerProps(id: string) {
    const item = this.options.items.find((i) => i.id === id);
    const disabled = Boolean(item?.disabled);
    const expanded = this.activeMenu === id;
    const isRtl = this.options.dir === 'rtl';
    return {
      id: `${this.baseId}-trigger-${id}`,
      type: 'button' as const,
      role: 'menuitem' as const,
      disabled,
      tabIndex: this.focusedId === id && !disabled ? 0 : -1,
      'aria-haspopup': 'menu' as const,
      'aria-expanded': expanded,
      'aria-controls': `${this.baseId}-menu-${id}`,
      'data-state': expanded ? ('open' as const) : ('closed' as const),
      onClick: () => this.openMenu(expanded ? null : id),
      onPointerEnter: () => {
        if (this.activeMenu !== null && !disabled) this.openMenu(id);
      },
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (disabled) return;
        const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
        const prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
        if (e.key === nextKey) { e.preventDefault(); this.move(1); }
        else if (e.key === prevKey) { e.preventDefault(); this.move(-1); }
        else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.openMenu(id); }
        else if (e.key === 'Escape') { e.preventDefault(); this.closeAll(); }
        else if (e.key === 'Home') {
          e.preventDefault();
          const first = this.options.items.find((i) => !i.disabled);
          if (first) { this.focusedId = first.id; if (this.activeMenu !== null) this.openMenu(first.id); }
        } else if (e.key === 'End') {
          e.preventDefault();
          const last = [...this.options.items].reverse().find((i) => !i.disabled);
          if (last) { this.focusedId = last.id; if (this.activeMenu !== null) this.openMenu(last.id); }
        }
      },
    };
  }

  getMenuProps(id: string) {
    const open = this.activeMenu === id;
    return {
      id: `${this.baseId}-menu-${id}`,
      role: 'menu' as const,
      'aria-labelledby': `${this.baseId}-trigger-${id}`,
      hidden: !open,
      'data-state': open ? ('open' as const) : ('closed' as const),
    };
  }

  destroy(): void {
    // Idempotent cleanup
  }
}

export function createMenubarController(options: MenubarOptions): MenubarController {
  return new MenubarController(options);
}
