import { RovingTabIndex } from '../primitives/roving-tabindex';
import type { Direction, Orientation } from '../primitives/keyboard';

export interface ToolbarOptions { label?: string; orientation?: Orientation; direction?: Direction; loop?: boolean }
export class ToolbarController {
  private options: ToolbarOptions;
  private roving: RovingTabIndex;
  constructor(options: ToolbarOptions = {}) {
    this.options = { orientation: 'horizontal', direction: 'ltr', loop: true, ...options };
    this.roving = new RovingTabIndex({ orientation: this.options.orientation, direction: this.options.direction, loop: this.options.loop });
  }
  updateOptions(options: Partial<ToolbarOptions>): void { this.options = { ...this.options, ...options }; this.roving.updateOptions({ orientation: this.options.orientation, direction: this.options.direction, loop: this.options.loop }); }
  register(options: { id: string; element: HTMLElement; disabled?: boolean }): () => void { return this.roving.register(options); }
  getRootProps() { return { role: 'toolbar' as const, 'aria-label': this.options.label, 'aria-orientation': this.options.orientation, onKeyDown: (event: KeyboardEvent) => this.roving.onKeyDown(event) }; }
  setCurrent(id: string, focus = false): void { this.roving.setCurrent(id, focus); }
}
export function createToolbarController(options: ToolbarOptions = {}): ToolbarController { return new ToolbarController(options); }
