import { createId } from '../primitives/id';

export interface KanbanCard<T = unknown> {
  id: string;
  title: string;
  data?: T;
}

export interface KanbanColumn<T = unknown> {
  id: string;
  title: string;
  wipLimit?: number;
  cards: KanbanCard<T>[];
}

export interface KanbanOptions<T = unknown> {
  id?: string;
  columns: readonly KanbanColumn<T>[];
  onColumnsChange?: (columns: KanbanColumn<T>[]) => void;
  onAnnounce?: (message: string) => void;
}

function cloneColumns<T>(cols: readonly KanbanColumn<T>[]): KanbanColumn<T>[] {
  return cols.map((c) => ({ ...c, cards: [...c.cards] }));
}

export class KanbanController<T = unknown> {
  private options: KanbanOptions<T>;
  private board: KanbanColumn<T>[];
  private grabbedId: string | null = null;
  private snapshotBeforeGrab: KanbanColumn<T>[] | null = null;
  private lastAnnouncement = '';
  readonly baseId: string;

  constructor(options: KanbanOptions<T>) {
    this.options = options;
    this.board = cloneColumns(options.columns);
    this.baseId = options.id ?? createId('forma-kanban');
  }

  get columns(): readonly KanbanColumn<T>[] {
    return this.board;
  }

  get grabbedCardId(): string | null {
    return this.grabbedId;
  }

  get announcement(): string {
    return this.lastAnnouncement;
  }

  private announce(msg: string): void {
    this.lastAnnouncement = msg;
    this.options.onAnnounce?.(msg);
  }

  private findCard(cardId: string): { colIndex: number; cardIndex: number; card: KanbanCard<T> } | null {
    for (let c = 0; c < this.board.length; c += 1) {
      const idx = this.board[c]!.cards.findIndex((card) => card.id === cardId);
      if (idx >= 0) return { colIndex: c, cardIndex: idx, card: this.board[c]!.cards[idx]! };
    }
    return null;
  }

  moveCard(cardId: string, targetColumnId: string, targetIndex?: number): boolean {
    const loc = this.findCard(cardId);
    const targetColIndex = this.board.findIndex((c) => c.id === targetColumnId);
    if (!loc || targetColIndex < 0) return false;

    const targetCol = this.board[targetColIndex]!;
    if (targetColIndex !== loc.colIndex && targetCol.wipLimit !== undefined && targetCol.cards.length >= targetCol.wipLimit) {
      this.announce(`Cannot move ${loc.card.title} to ${targetCol.title}: WIP limit ${targetCol.wipLimit} reached.`);
      return false;
    }

    const next = cloneColumns(this.board);
    const [removed] = next[loc.colIndex]!.cards.splice(loc.cardIndex, 1);
    const destCards = next[targetColIndex]!.cards;
    const insertAt = targetIndex === undefined ? destCards.length : Math.min(destCards.length, Math.max(0, targetIndex));
    destCards.splice(insertAt, 0, removed!);
    this.board = next;
    this.options.onColumnsChange?.(cloneColumns(this.board));
    this.announce(`Moved ${removed!.title} to ${next[targetColIndex]!.title}, position ${insertAt + 1}.`);
    return true;
  }

  grab(cardId: string): void {
    const loc = this.findCard(cardId);
    if (!loc) return;
    this.snapshotBeforeGrab = cloneColumns(this.board);
    this.grabbedId = cardId;
    this.announce(`Picked up ${loc.card.title} in ${this.board[loc.colIndex]!.title}.`);
  }

  drop(): void {
    if (!this.grabbedId) return;
    const loc = this.findCard(this.grabbedId);
    this.grabbedId = null;
    this.snapshotBeforeGrab = null;
    if (loc) this.announce(`Dropped ${loc.card.title} in ${this.board[loc.colIndex]!.title}.`);
  }

  cancelGrab(): void {
    if (!this.grabbedId || !this.snapshotBeforeGrab) return;
    this.board = this.snapshotBeforeGrab;
    this.grabbedId = null;
    this.snapshotBeforeGrab = null;
    this.options.onColumnsChange?.(cloneColumns(this.board));
    this.announce('Card move cancelled.');
  }

  getBoardProps(label = 'Kanban board') {
    return { id: this.baseId, role: 'region' as const, 'aria-label': label };
  }

  getColumnProps(columnId: string) {
    const col = this.board.find((c) => c.id === columnId);
    return {
      id: `${this.baseId}-col-${columnId}`,
      role: 'list' as const,
      'aria-label': col ? `${col.title} (${col.cards.length})` : columnId,
    };
  }

  getCardProps(cardId: string) {
    const grabbed = this.grabbedId === cardId;
    return {
      id: `${this.baseId}-card-${cardId}`,
      role: 'listitem' as const,
      tabIndex: 0,
      'aria-roledescription': 'kanban card',
      'data-grabbed': grabbed ? 'true' : 'false',
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (grabbed) this.drop();
          else this.grab(cardId);
          return;
        }
        if (!grabbed) return;
        const loc = this.findCard(cardId);
        if (!loc) return;
        if (e.key === 'Escape') { e.preventDefault(); this.cancelGrab(); }
        else if (e.key === 'ArrowUp' && loc.cardIndex > 0) {
          e.preventDefault();
          this.moveCard(cardId, this.board[loc.colIndex]!.id, loc.cardIndex - 1);
        } else if (e.key === 'ArrowDown' && loc.cardIndex < this.board[loc.colIndex]!.cards.length - 1) {
          e.preventDefault();
          this.moveCard(cardId, this.board[loc.colIndex]!.id, loc.cardIndex + 1);
        } else if (e.key === 'ArrowRight' && loc.colIndex < this.board.length - 1) {
          e.preventDefault();
          this.moveCard(cardId, this.board[loc.colIndex + 1]!.id);
        } else if (e.key === 'ArrowLeft' && loc.colIndex > 0) {
          e.preventDefault();
          this.moveCard(cardId, this.board[loc.colIndex - 1]!.id);
        }
      },
    };
  }

  destroy(): void {
    this.grabbedId = null;
    this.snapshotBeforeGrab = null;
  }
}

export function createKanbanController<T = unknown>(options: KanbanOptions<T>): KanbanController<T> {
  return new KanbanController(options);
}
