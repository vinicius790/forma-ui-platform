import { FocusTrap } from './focus';

export interface FocusScopeOptions {
  trapped?: boolean;
  returnFocus?: boolean;
  initialFocus?: HTMLElement | null;
}

const activeScopeStack: FocusScope[] = [];

/** Composable FocusScope with pause/resume nesting semantics over FocusTrap. */
export class FocusScope {
  private trap: FocusTrap | null = null;
  private paused = false;
  private mounted = false;

  constructor(
    private readonly container: HTMLElement | null,
    private readonly options: FocusScopeOptions = {},
  ) {}

  get isMounted(): boolean {
    return this.mounted;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  mount(): () => void {
    if (this.mounted || !this.container) return () => {};
    this.mounted = true;
    const prev = activeScopeStack[activeScopeStack.length - 1];
    prev?.pause();
    activeScopeStack.push(this);
    if (this.options.trapped ?? true) {
      this.trap = new FocusTrap(this.container, this.options.returnFocus ?? true);
      this.trap.activate(this.options.initialFocus);
    }
    return () => this.unmount();
  }

  pause(): void {
    if (!this.mounted || this.paused) return;
    this.paused = true;
    this.trap?.deactivate(false);
  }

  resume(): void {
    if (!this.mounted || !this.paused) return;
    this.paused = false;
    this.trap?.activate();
  }

  unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;
    this.paused = false;
    this.trap?.deactivate(this.options.returnFocus ?? true);
    this.trap = null;
    const idx = activeScopeStack.lastIndexOf(this);
    if (idx >= 0) activeScopeStack.splice(idx, 1);
    const nextTop = activeScopeStack[activeScopeStack.length - 1];
    nextTop?.resume();
  }
}

export function createFocusScope(container: HTMLElement | null, options: FocusScopeOptions = {}): FocusScope {
  return new FocusScope(container, options);
}
