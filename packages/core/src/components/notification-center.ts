import { createId } from '../primitives/id';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  category?: string;
  priority: NotificationPriority;
  read: boolean;
  archived: boolean;
  createdAt: number;
}

export interface NotificationInput {
  id?: string;
  title: string;
  body?: string;
  category?: string;
  priority?: NotificationPriority;
}

export interface NotificationCenterOptions {
  maxItems?: number;
  initialItems?: readonly NotificationItem[];
  onChange?: (items: readonly NotificationItem[]) => void;
}

export class NotificationCenterController {
  private options: NotificationCenterOptions;
  private list: NotificationItem[];
  private snoozeTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private destroyed = false;

  constructor(options: NotificationCenterOptions = {}) {
    this.options = { maxItems: 200, ...options };
    this.list = [...(options.initialItems ?? [])];
  }

  get items(): readonly NotificationItem[] {
    return this.list.filter((i) => !i.archived);
  }

  get allItems(): readonly NotificationItem[] {
    return this.list;
  }

  get unreadCount(): number {
    return this.list.filter((i) => !i.archived && !i.read).length;
  }

  private emit(): void {
    if (!this.destroyed) this.options.onChange?.([...this.items]);
  }

  push(input: NotificationInput): NotificationItem {
    const item: NotificationItem = {
      id: input.id ?? createId('forma-notif'),
      title: input.title,
      body: input.body,
      category: input.category,
      priority: input.priority ?? 'normal',
      read: false,
      archived: false,
      createdAt: Date.now(),
    };
    const cap = Math.max(1, this.options.maxItems ?? 200);
    this.list = [item, ...this.list].slice(0, cap);
    this.emit();
    return item;
  }

  markRead(id: string, read = true): void {
    let changed = false;
    this.list = this.list.map((i) => {
      if (i.id === id && i.read !== read) {
        changed = true;
        return { ...i, read };
      }
      return i;
    });
    if (changed) this.emit();
  }

  markAllRead(): void {
    if (this.unreadCount === 0) return;
    this.list = this.list.map((i) => (i.read ? i : { ...i, read: true }));
    this.emit();
  }

  archive(id: string): void {
    this.list = this.list.map((i) => (i.id === id ? { ...i, archived: true, read: true } : i));
    this.emit();
  }

  dismiss(id: string): void {
    this.clearSnooze(id);
    this.list = this.list.filter((i) => i.id !== id);
    this.emit();
  }

  snooze(id: string, durationMs: number): void {
    const target = this.list.find((i) => i.id === id);
    if (!target || this.destroyed) return;
    this.clearSnooze(id);
    this.archive(id);
    const timer = setTimeout(() => {
      this.snoozeTimers.delete(id);
      if (this.destroyed) return;
      this.list = this.list.map((i) => (i.id === id ? { ...i, archived: false, read: false } : i));
      this.emit();
    }, Math.max(0, durationMs));
    this.snoozeTimers.set(id, timer);
  }

  byCategory(category: string): NotificationItem[] {
    return this.items.filter((i) => i.category === category);
  }

  private clearSnooze(id: string): void {
    const timer = this.snoozeTimers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.snoozeTimers.delete(id);
    }
  }

  destroy(): void {
    this.destroyed = true;
    for (const timer of this.snoozeTimers.values()) clearTimeout(timer);
    this.snoozeTimers.clear();
  }
}

export function createNotificationCenterController(options: NotificationCenterOptions = {}): NotificationCenterController {
  return new NotificationCenterController(options);
}
