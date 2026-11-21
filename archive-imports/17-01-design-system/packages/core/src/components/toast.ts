import { createId } from '../primitives/id.js';
import type { Direction } from '../primitives/roving-tabindex.js';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading';

export interface ToastInput {
  id?: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

export interface ToastRecord extends Required<Pick<ToastInput, 'id' | 'title' | 'type' | 'duration'>> {
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  paused: boolean;
  createdAt: number;
}

export interface ToastStoreOptions {
  maxToasts?: number;
  defaultDuration?: number;
  dir?: Direction;
  regionLabel?: string;
  closeLabel?: string;
}

export interface ToastStore {
  getToasts: () => ToastRecord[];
  toast: (input: ToastInput) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    }
  ) => Promise<T>;
  update: (id: string, patch: Partial<ToastInput>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  getRegionProps: () => {
    role: 'region';
    tabIndex: number;
    dir: Direction;
    'aria-label': string;
    'data-forma-toast-region': '';
  };
  getToastProps: (item: ToastRecord) => {
    id: string;
    role: 'alert' | 'status';
    'aria-live': 'assertive' | 'polite';
    'aria-atomic': true;
    'data-forma-toast': '';
    'data-type': ToastType;
    'data-paused'?: '';
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
    onKeyDown: (event: KeyboardEvent) => void;
  };
  getCloseButtonProps: (id: string) => {
    type: 'button';
    'aria-label': string;
    'data-forma-toast-close': '';
    onClick: () => void;
  };
  subscribe: (listener: (toasts: ToastRecord[]) => void) => () => void;
}

interface TimerMeta {
  timerId: ReturnType<typeof setTimeout> | null;
  remaining: number;
  startedAt: number;
}

export function createToastStore(options: ToastStoreOptions = {}): ToastStore {
  const maxToasts = options.maxToasts ?? 5;
  const defaultDuration = options.defaultDuration ?? 5000;
  const dir = options.dir ?? 'ltr';

  let toasts: ToastRecord[] = [];
  const timers = new Map<string, TimerMeta>();
  const listeners = new Set<(toasts: ToastRecord[]) => void>();

  const notify = () => {
    for (const listener of listeners) listener(toasts);
  };

  const clearTimer = (id: string) => {
    const meta = timers.get(id);
    if (meta?.timerId) {
      clearTimeout(meta.timerId);
    }
    timers.delete(id);
  };

  const dismiss = (id: string) => {
    const existing = toasts.find((t) => t.id === id);
    if (!existing) return;
    clearTimer(id);
    toasts = toasts.filter((t) => t.id !== id);
    notify();
    existing.onDismiss?.();
  };

  const startTimer = (id: string, duration: number) => {
    if (duration <= 0 || !Number.isFinite(duration)) return;
    clearTimer(id);
    const timerId = setTimeout(() => dismiss(id), duration);
    timers.set(id, {
      timerId,
      remaining: duration,
      startedAt: Date.now()
    });
  };

  const pause = (id: string) => {
    const meta = timers.get(id);
    if (!meta || !meta.timerId) return;
    clearTimeout(meta.timerId);
    const elapsed = Date.now() - meta.startedAt;
    const remaining = Math.max(0, meta.remaining - elapsed);
    timers.set(id, { timerId: null, remaining, startedAt: Date.now() });
    toasts = toasts.map((t) => (t.id === id ? { ...t, paused: true } : t));
    notify();
  };

  const resume = (id: string) => {
    const meta = timers.get(id);
    if (!meta || meta.timerId !== null) return;
    toasts = toasts.map((t) => (t.id === id ? { ...t, paused: false } : t));
    notify();
    if (meta.remaining > 0) {
      startTimer(id, meta.remaining);
    } else {
      dismiss(id);
    }
  };

  const addToast = (input: ToastInput): string => {
    const id = input.id ?? createId('forma-toast');
    const type: ToastType = input.type ?? 'info';
    const duration =
      input.duration !== undefined
        ? input.duration
        : type === 'loading'
          ? 0
          : defaultDuration;

    const record: ToastRecord = {
      id,
      title: input.title,
      description: input.description,
      type,
      duration,
      actionLabel: input.actionLabel,
      onAction: input.onAction,
      onDismiss: input.onDismiss,
      paused: false,
      createdAt: Date.now()
    };

    const next = [...toasts.filter((t) => t.id !== id), record];
    if (next.length > maxToasts) {
      const evicted = next.slice(0, next.length - maxToasts);
      for (const item of evicted) clearTimer(item.id);
      toasts = next.slice(next.length - maxToasts);
    } else {
      toasts = next;
    }

    notify();
    startTimer(id, duration);
    return id;
  };

  const update = (id: string, patch: Partial<ToastInput>) => {
    const existing = toasts.find((t) => t.id === id);
    if (!existing) return;
    const nextType = patch.type ?? existing.type;
    const nextDuration =
      patch.duration !== undefined
        ? patch.duration
        : nextType === 'loading'
          ? 0
          : existing.duration || defaultDuration;

    toasts = toasts.map((t) =>
      t.id === id
        ? {
            ...t,
            ...patch,
            type: nextType,
            duration: nextDuration
          }
        : t
    );
    notify();
    if (nextDuration > 0) {
      startTimer(id, nextDuration);
    } else {
      clearTimer(id);
    }
  };

  return {
    getToasts() {
      return toasts;
    },
    toast: addToast,
    success: (title, description) => addToast({ title, description, type: 'success' }),
    error: (title, description) => addToast({ title, description, type: 'error' }),
    warning: (title, description) => addToast({ title, description, type: 'warning' }),
    info: (title, description) => addToast({ title, description, type: 'info' }),
    async promise(promise, messages) {
      const id = addToast({ title: messages.loading, type: 'loading', duration: 0 });
      try {
        const data = await promise;
        const successTitle =
          typeof messages.success === 'function' ? messages.success(data) : messages.success;
        update(id, { title: successTitle, type: 'success', duration: defaultDuration });
        return data;
      } catch (err) {
        const errorTitle =
          typeof messages.error === 'function' ? messages.error(err) : messages.error;
        update(id, { title: errorTitle, type: 'error', duration: defaultDuration });
        throw err;
      }
    },
    update,
    dismiss,
    dismissAll() {
      for (const item of toasts) clearTimer(item.id);
      toasts = [];
      notify();
    },
    pause,
    resume,
    getRegionProps() {
      return {
        role: 'region',
        tabIndex: -1,
        dir,
        'aria-label': options.regionLabel ?? 'Notificações',
        'data-forma-toast-region': ''
      };
    },
    getToastProps(item) {
      const isUrgent = item.type === 'error' || item.type === 'warning';
      return {
        id: item.id,
        role: isUrgent ? 'alert' : 'status',
        'aria-live': isUrgent ? 'assertive' : 'polite',
        'aria-atomic': true,
        'data-forma-toast': '',
        'data-type': item.type,
        ...(item.paused ? { 'data-paused': '' as const } : {}),
        onMouseEnter: () => pause(item.id),
        onMouseLeave: () => resume(item.id),
        onFocus: () => pause(item.id),
        onBlur: () => resume(item.id),
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            dismiss(item.id);
          }
        }
      };
    },
    getCloseButtonProps(id) {
      return {
        type: 'button',
        'aria-label': options.closeLabel ?? 'Fechar notificação',
        'data-forma-toast-close': '',
        onClick: () => dismiss(id)
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
