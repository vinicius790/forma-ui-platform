export interface HistoryStackOptions {
  capacity?: number;
}

export interface HistoryStack<T> {
  readonly present: T;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  push(next: T): void;
  undo(): T;
  redo(): T;
  clear(nextPresent?: T): void;
}

export function createHistoryStack<T>(initial: T, options: HistoryStackOptions = {}): HistoryStack<T> {
  const capacity = Math.max(1, options.capacity ?? 100);
  let past: T[] = [];
  let present: T = initial;
  let future: T[] = [];

  return {
    get present() {
      return present;
    },
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    push(next: T) {
      if (Object.is(next, present)) return;
      past = [...past.slice(-(capacity - 1)), present];
      present = next;
      future = [];
    },
    undo(): T {
      if (past.length === 0) return present;
      const previous = past[past.length - 1]!;
      past = past.slice(0, -1);
      future = [present, ...future];
      present = previous;
      return present;
    },
    redo(): T {
      if (future.length === 0) return present;
      const next = future[0]!;
      future = future.slice(1);
      past = [...past, present];
      present = next;
      return present;
    },
    clear(nextPresent?: T) {
      past = [];
      future = [];
      if (nextPresent !== undefined) present = nextPresent;
    },
  };
}
