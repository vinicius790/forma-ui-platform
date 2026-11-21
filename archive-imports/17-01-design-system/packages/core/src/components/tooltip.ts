import { createId } from '../primitives/id.js';
import type { Direction } from '../primitives/roving-tabindex.js';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipOptions {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  placement?: TooltipPlacement;
  disabled?: boolean;
  dir?: Direction;
}

export interface TooltipState {
  open: boolean;
  placement: TooltipPlacement;
  dir: Direction;
}

export interface TooltipMachine {
  ids: {
    trigger: string;
    tooltip: string;
  };
  getState: () => TooltipState;
  open: (immediate?: boolean) => void;
  close: (immediate?: boolean) => void;
  setDir: (dir: Direction) => void;
  getTriggerProps: () => {
    id: string;
    'aria-describedby'?: string;
    'data-forma-tooltip-trigger': '';
    'data-state': 'open' | 'closed';
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
    onKeyDown: (event: KeyboardEvent) => void;
  };
  getTooltipProps: () => {
    id: string;
    role: 'tooltip';
    dir: Direction;
    hidden: boolean;
    'data-forma-tooltip': '';
    'data-state': 'open' | 'closed';
    'data-placement': TooltipPlacement;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  subscribe: (listener: (state: TooltipState) => void) => () => void;
  destroy: () => void;
}

let lastTooltipCloseTimestamp = 0;
const WARMUP_WINDOW_MS = 400;

export function createTooltipMachine(options: TooltipOptions = {}): TooltipMachine {
  const baseId = options.id ?? createId('forma-tooltip');
  const ids = {
    trigger: `${baseId}-trigger`,
    tooltip: `${baseId}-content`
  };

  const isControlled = options.open !== undefined;
  const openDelay = options.openDelay ?? 300;
  const closeDelay = options.closeDelay ?? 100;

  let state: TooltipState = {
    open: options.open ?? options.defaultOpen ?? false,
    placement: options.placement ?? 'top',
    dir: options.dir ?? 'ltr'
  };

  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<(state: TooltipState) => void>();

  const notify = () => {
    for (const listener of listeners) listener(state);
  };

  const clearTimers = () => {
    if (openTimer !== null) {
      clearTimeout(openTimer);
      openTimer = null;
    }
    if (closeTimer !== null) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  };

  const commitOpen = (nextOpen: boolean) => {
    if (!nextOpen) {
      lastTooltipCloseTimestamp = Date.now();
    }
    if (state.open === nextOpen) return;
    if (!isControlled) {
      state = { ...state, open: nextOpen };
      notify();
    }
    options.onOpenChange?.(nextOpen);
  };

  const scheduleOpen = (immediate = false) => {
    if (options.disabled) return;
    clearTimers();
    const isWarm = Date.now() - lastTooltipCloseTimestamp < WARMUP_WINDOW_MS;
    const effectiveDelay = immediate || isWarm ? 0 : openDelay;
    if (effectiveDelay <= 0) {
      commitOpen(true);
    } else {
      openTimer = setTimeout(() => commitOpen(true), effectiveDelay);
    }
  };

  const scheduleClose = (immediate = false) => {
    clearTimers();
    if (immediate || closeDelay <= 0) {
      commitOpen(false);
    } else {
      closeTimer = setTimeout(() => commitOpen(false), closeDelay);
    }
  };

  return {
    ids,
    getState() {
      return state;
    },
    open(immediate = true) {
      scheduleOpen(immediate);
    },
    close(immediate = true) {
      scheduleClose(immediate);
    },
    setDir(dir) {
      if (state.dir === dir) return;
      state = { ...state, dir };
      notify();
    },
    getTriggerProps() {
      return {
        id: ids.trigger,
        ...(state.open ? { 'aria-describedby': ids.tooltip } : {}),
        'data-forma-tooltip-trigger': '',
        'data-state': state.open ? 'open' : 'closed',
        onMouseEnter: () => scheduleOpen(false),
        onMouseLeave: () => scheduleClose(false),
        onFocus: () => scheduleOpen(true),
        onBlur: () => scheduleClose(true),
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key === 'Escape' && state.open) {
            event.stopPropagation();
            scheduleClose(true);
          }
        }
      };
    },
    getTooltipProps() {
      return {
        id: ids.tooltip,
        role: 'tooltip',
        dir: state.dir,
        hidden: !state.open,
        'data-forma-tooltip': '',
        'data-state': state.open ? 'open' : 'closed',
        'data-placement': state.placement,
        onMouseEnter: () => {
          if (closeTimer !== null) {
            clearTimeout(closeTimer);
            closeTimer = null;
          }
        },
        onMouseLeave: () => scheduleClose(false)
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy() {
      clearTimers();
      listeners.clear();
    }
  };
}
