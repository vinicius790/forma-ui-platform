import {
  getDirectionalKey,
  getNextIndex,
  type Direction,
  type Orientation,
} from './keyboard';

export interface RovingItem {
  id: string;
  element: HTMLElement;
  disabled?: boolean;
  row?: number;
  column?: number;
}

export interface RovingTabIndexOptions {
  orientation?: Orientation | 'both';
  direction?: Direction;
  loop?: boolean;
}

export class RovingTabIndex {
  private items: RovingItem[] = [];
  private currentId: string | null = null;

  constructor(private options: RovingTabIndexOptions = {}) {}

  updateOptions(options: Partial<RovingTabIndexOptions>): void {
    this.options = { ...this.options, ...options };
    this.sync();
  }

  register(item: RovingItem): () => void {
    this.items = [...this.items.filter((candidate) => candidate.id !== item.id), item];
    if (!this.currentId && !item.disabled) this.currentId = item.id;
    this.sync();

    return () => {
      this.items = this.items.filter((candidate) => candidate.id !== item.id);
      if (this.currentId === item.id) {
        this.currentId = this.items.find((candidate) => !candidate.disabled)?.id ?? null;
      }
      this.sync();
    };
  }

  setCurrent(id: string, focus = false): void {
    if (!this.items.some((item) => item.id === id && !item.disabled)) return;
    this.currentId = id;
    this.sync();
    if (focus) this.items.find((item) => item.id === id)?.element.focus();
  }

  onKeyDown(event: KeyboardEvent): void {
    const key = getDirectionalKey(event.key, this.options.direction ?? 'ltr');
    const orientation = this.options.orientation ?? 'horizontal';

    if (event.ctrlKey && (key === 'Home' || key === 'End')) {
      event.preventDefault();
      const enabled = this.enabledItems();
      const target = key === 'Home' ? enabled[0] : enabled.at(-1);
      if (target) this.setCurrent(target.id, true);
      return;
    }

    if (orientation === 'both') {
      if (this.handleGridKey(key, event)) return;
    } else {
      const vertical = orientation === 'vertical';
      let delta = 0;
      if ((!vertical && key === 'ArrowRight') || (vertical && key === 'ArrowDown')) delta = 1;
      if ((!vertical && key === 'ArrowLeft') || (vertical && key === 'ArrowUp')) delta = -1;
      if (delta !== 0) {
        event.preventDefault();
        this.moveLinear(delta);
        return;
      }
    }

    if (key === 'Home' || key === 'End') {
      event.preventDefault();
      const enabled = this.enabledItems();
      const target = key === 'Home' ? enabled[0] : enabled.at(-1);
      if (target) this.setCurrent(target.id, true);
    }
  }

  private handleGridKey(key: string, event: KeyboardEvent): boolean {
    const current = this.items.find((item) => item.id === this.currentId);
    const hasGridCoordinates = current?.row !== undefined && current.column !== undefined;
    if (key === 'Home' || key === 'End') {
      event.preventDefault();
      const enabled = this.enabledItems();
      const rowItems = hasGridCoordinates
        ? enabled.filter((item) => item.row === current.row)
        : enabled;
      const target = key === 'Home' ? rowItems[0] : rowItems.at(-1);
      if (target) this.setCurrent(target.id, true);
      return true;
    }

    const directions: Record<string, [number, number]> = {
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
    };
    const vector = directions[key];
    if (!vector) return false;
    event.preventDefault();

    if (!hasGridCoordinates) {
      this.moveLinear(vector[0] === 0 ? vector[1] : vector[0]);
      return true;
    }

    const [rowDelta, columnDelta] = vector;
    const enabled = this.enabledItems().filter(
      (item) => item.row !== undefined && item.column !== undefined,
    );
    const sameAxis = enabled.filter((item) => rowDelta === 0
      ? item.row === current.row
      : item.column === current.column);
    const coordinate = rowDelta === 0 ? current.column! : current.row!;
    const candidates = sameAxis
      .filter((item) => rowDelta === 0 ? item.column !== coordinate : item.row !== coordinate)
      .map((item) => ({
        item,
        value: rowDelta === 0 ? item.column! : item.row!,
      }));
    const next = candidates
      .filter(({ value }) => rowDelta + columnDelta > 0 ? value > coordinate : value < coordinate)
      .sort((a, b) => Math.abs(a.value - coordinate) - Math.abs(b.value - coordinate))[0];

    if (next) {
      this.setCurrent(next.item.id, true);
      return true;
    }

    if (this.options.loop !== false && candidates.length > 0) {
      const wrapped = candidates.sort((a, b) =>
        rowDelta + columnDelta > 0 ? a.value - b.value : b.value - a.value,
      )[0];
      if (wrapped) this.setCurrent(wrapped.item.id, true);
    }
    return true;
  }

  private moveLinear(delta: number): void {
    const enabled = this.enabledItems();
    const index = enabled.findIndex((item) => item.id === this.currentId);
    const next = getNextIndex(index < 0 ? 0 : index, enabled.length, delta, this.options.loop !== false);
    if (next >= 0) this.setCurrent(enabled[next]!.id, true);
  }

  private enabledItems(): RovingItem[] {
    return this.items.filter((item) => !item.disabled);
  }

  private sync(): void {
    for (const item of this.items) {
      item.element.tabIndex = item.id === this.currentId && !item.disabled ? 0 : -1;
    }
  }
}
