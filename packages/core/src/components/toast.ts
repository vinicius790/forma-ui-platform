export type ToastTone = 'info' | 'success' | 'warning' | 'error';
export interface ToastInput { title?: string; description?: string; tone?: ToastTone; duration?: number; dismissible?: boolean; id?: string; action?: { label: string; onClick: () => void } }
export interface ToastRecord extends Required<Pick<ToastInput, 'tone' | 'duration' | 'dismissible'>> { id: string; title?: string; description?: string; action?: ToastInput['action']; createdAt: number }
interface TimerRecord { handle?: ReturnType<typeof setTimeout>; remaining: number; started: number; paused: boolean }
export class ToastStore {
  private records: ToastRecord[] = [];
  private timers = new Map<string, TimerRecord>();
  private listeners = new Set<() => void>();
  private sequence = 0;
  constructor(private defaults: { duration?: number; max?: number; onChange?: (toasts: readonly ToastRecord[]) => void } = {}) {}
  getSnapshot = (): readonly ToastRecord[] => this.records;
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  add(input: ToastInput): string {
    const id = input.id ?? `forma-toast-${++this.sequence}`;
    this.dismiss(id);
    const duration = Math.max(0, input.duration === undefined ? this.defaults.duration ?? 5000 : input.duration);
    const record: ToastRecord = { id, title: input.title, description: input.description, tone: input.tone ?? 'info', duration, dismissible: input.dismissible ?? true, action: input.action, createdAt: Date.now() };
    const next = [...this.records, record];
    const max = Math.max(1, this.defaults.max ?? 5);
    const removed = next.slice(0, Math.max(0, next.length - max));
    for (const previous of removed) this.clearTimer(previous.id);
    this.records = next.slice(-max);
    this.emit();
    if (duration > 0) this.startTimer(id, duration);
    return id;
  }
  update(id: string, patch: Partial<ToastInput>): void {
    const current = this.records.find((record) => record.id === id);
    if (!current) return;
    this.records = this.records.map((record) => record.id === id ? { ...record, ...patch } : record);
    if (patch.duration !== undefined) {
      this.clearTimer(id);
      const duration = Math.max(0, patch.duration);
      if (duration > 0) this.startTimer(id, duration);
    }
    this.emit();
  }
  dismiss(id: string): void { this.clearTimer(id); const next = this.records.filter((x) => x.id !== id); if (next.length !== this.records.length) { this.records = next; this.emit(); } }
  clear(): void { for (const id of this.timers.keys()) this.clearTimer(id); this.records = []; this.emit(); }
  pause(id: string): void { const timer = this.timers.get(id); if (!timer || timer.paused) return; if (timer.handle) clearTimeout(timer.handle); timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.started)); timer.paused = true; timer.handle = undefined; }
  resume(id: string): void { const timer = this.timers.get(id); if (!timer || !timer.paused) return; timer.paused = false; this.startTimer(id, timer.remaining); }
  private startTimer(id: string, duration: number): void { const existing = this.timers.get(id); if (existing?.handle) clearTimeout(existing.handle); const timer: TimerRecord = { remaining: duration, started: Date.now(), paused: false }; timer.handle = setTimeout(() => this.dismiss(id), duration); this.timers.set(id, timer); }
  private clearTimer(id: string): void { const timer = this.timers.get(id); if (timer?.handle) clearTimeout(timer.handle); this.timers.delete(id); }
  private emit(): void { for (const listener of this.listeners) listener(); this.defaults.onChange?.(this.records); }
}
export function createToastStore(options: ConstructorParameters<typeof ToastStore>[0] = {}): ToastStore { return new ToastStore(options); }
export const toast = createToastStore();
