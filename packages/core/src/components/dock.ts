import { createId } from '../primitives/id';

export interface DockTab {
  id: string;
  title: string;
  closable?: boolean;
}

export interface DockPane {
  id: string;
  tabs: DockTab[];
  activeTabId: string | null;
}

export interface DockOptions {
  id?: string;
  panes: readonly DockPane[];
  activePaneId?: string | null;
  onChange?: (panes: DockPane[], activePaneId: string | null) => void;
}

function clonePanes(panes: readonly DockPane[]): DockPane[] {
  return panes.map((p) => ({ ...p, tabs: p.tabs.map((t) => ({ ...t })) }));
}

export class DockController {
  private panesList: DockPane[];
  private activePane: string | null;
  private maximizedPaneId: string | null = null;
  private onChange?: (panes: DockPane[], activePaneId: string | null) => void;
  readonly baseId: string;

  constructor(options: DockOptions) {
    this.panesList = clonePanes(options.panes);
    this.activePane = options.activePaneId ?? this.panesList[0]?.id ?? null;
    this.onChange = options.onChange;
    this.baseId = options.id ?? createId('forma-dock');
  }

  get panes(): readonly DockPane[] {
    return this.panesList;
  }

  get activePaneId(): string | null {
    return this.activePane;
  }

  get maximizedPane(): string | null {
    return this.maximizedPaneId;
  }

  private emit(): void {
    this.onChange?.(clonePanes(this.panesList), this.activePane);
  }

  focusPane(paneId: string): void {
    if (!this.panesList.some((p) => p.id === paneId) || this.activePane === paneId) return;
    this.activePane = paneId;
    this.emit();
  }

  activateTab(paneId: string, tabId: string): void {
    const pane = this.panesList.find((p) => p.id === paneId);
    if (!pane || !pane.tabs.some((t) => t.id === tabId)) return;
    pane.activeTabId = tabId;
    this.activePane = paneId;
    this.emit();
  }

  closeTab(paneId: string, tabId: string): boolean {
    const pane = this.panesList.find((p) => p.id === paneId);
    if (!pane) return false;
    const idx = pane.tabs.findIndex((t) => t.id === tabId);
    if (idx < 0 || pane.tabs[idx]?.closable === false) return false;
    pane.tabs.splice(idx, 1);
    if (pane.activeTabId === tabId) pane.activeTabId = pane.tabs[Math.min(idx, pane.tabs.length - 1)]?.id ?? null;
    this.emit();
    return true;
  }

  splitPane(newPaneId: string, tab?: DockTab): void {
    if (this.panesList.some((p) => p.id === newPaneId)) return;
    this.panesList.push({ id: newPaneId, tabs: tab ? [{ ...tab }] : [], activeTabId: tab?.id ?? null });
    this.activePane = newPaneId;
    this.emit();
  }

  toggleMaximize(paneId: string): void {
    this.maximizedPaneId = this.maximizedPaneId === paneId ? null : paneId;
    this.emit();
  }

  serialize(): string {
    return JSON.stringify({ panes: this.panesList, activePaneId: this.activePane, maximizedPaneId: this.maximizedPaneId });
  }

  getPaneProps(paneId: string) {
    return {
      id: `${this.baseId}-pane-${paneId}`,
      role: 'region' as const,
      'data-active': this.activePane === paneId ? 'true' : 'false',
      'data-maximized': this.maximizedPaneId === paneId ? 'true' : 'false',
      onFocusIn: () => this.focusPane(paneId),
    };
  }

  destroy(): void {
    // Idempotent cleanup
  }
}

export function createDockController(options: DockOptions): DockController {
  return new DockController(options);
}
