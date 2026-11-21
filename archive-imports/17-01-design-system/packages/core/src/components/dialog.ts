import { createId } from '../primitives/id.js';
import { createFocusTrap, type FocusTrapController } from '../primitives/focus.js';
import {
  createDismissableLayer,
  type DismissableLayerController
} from '../primitives/dismissable-layer.js';
import { createPortalHost, type PortalController } from '../primitives/portal.js';
import { acquireBodyScrollLock } from '../primitives/scroll-lock.js';
import { ariaHideOutside } from '../primitives/aria-hide-outside.js';
import type { Direction } from '../primitives/roving-tabindex.js';

export type DialogRole = 'dialog' | 'alertdialog';

export interface DialogOptions {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  role?: DialogRole;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  restoreFocus?: boolean;
  lockScroll?: boolean;
  hideOutsideAria?: boolean;
  dir?: Direction;
  closeLabel?: string;
}

export interface DialogState {
  open: boolean;
  modal: boolean;
  role: DialogRole;
  dir: Direction;
}

export interface DialogMachine {
  ids: {
    trigger: string;
    content: string;
    title: string;
    description: string;
  };
  getState: () => DialogState;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (nextOpen: boolean) => void;
  setDir: (dir: Direction) => void;
  mountContent: (contentEl: HTMLElement | null) => () => void;
  getTriggerProps: () => {
    id: string;
    type: 'button';
    'aria-haspopup': 'dialog';
    'aria-expanded': boolean;
    'aria-controls': string;
    'data-forma-dialog-trigger': '';
    'data-state': 'open' | 'closed';
    onClick: () => void;
  };
  getOverlayProps: () => {
    'data-forma-dialog-overlay': '';
    'data-state': 'open' | 'closed';
    onPointerDown: (event: PointerEvent) => void;
  };
  getContentProps: () => {
    id: string;
    role: DialogRole;
    tabIndex: number;
    dir: Direction;
    'aria-modal'?: true;
    'aria-labelledby': string;
    'aria-describedby': string;
    'data-forma-dialog-content': '';
    'data-state': 'open' | 'closed';
  };
  getTitleProps: () => {
    id: string;
    'data-forma-dialog-title': '';
  };
  getDescriptionProps: () => {
    id: string;
    'data-forma-dialog-description': '';
  };
  getCloseProps: () => {
    type: 'button';
    'aria-label': string;
    'data-forma-dialog-close': '';
    onClick: () => void;
  };
  subscribe: (listener: (state: DialogState) => void) => () => void;
  destroy: () => void;
}

export function createDialogMachine(options: DialogOptions = {}): DialogMachine {
  const baseId = options.id ?? createId('forma-dialog');
  const ids = {
    trigger: `${baseId}-trigger`,
    content: `${baseId}-content`,
    title: `${baseId}-title`,
    description: `${baseId}-description`
  };

  const isControlled = options.open !== undefined;
  const role: DialogRole = options.role ?? 'dialog';
  // alertdialog by WAI-ARIA spec should not close on outside click by default
  const defaultCloseOutside = role === 'alertdialog' ? false : (options.modal ?? true);

  let state: DialogState = {
    open: options.open ?? options.defaultOpen ?? false,
    modal: options.modal ?? true,
    role,
    dir: options.dir ?? 'ltr'
  };

  const listeners = new Set<(state: DialogState) => void>();
  let contentElement: HTMLElement | null = null;
  let focusTrap: FocusTrapController | null = null;
  let dismissLayer: DismissableLayerController | null = null;
  let releaseScrollLock: (() => void) | null = null;
  let restoreAriaOutside: (() => void) | null = null;
  const portal: PortalController = createPortalHost({ id: `${baseId}-portal`, dir: state.dir });

  const notify = () => {
    for (const listener of listeners) listener(state);
  };

  const cleanupEffects = () => {
    focusTrap?.deactivate();
    focusTrap = null;
    dismissLayer?.deactivate();
    dismissLayer = null;
    releaseScrollLock?.();
    releaseScrollLock = null;
    restoreAriaOutside?.();
    restoreAriaOutside = null;
  };

  const applyOpenEffects = () => {
    cleanupEffects();
    if (!state.open || !contentElement) return;

    if (state.modal && (options.lockScroll ?? true)) {
      releaseScrollLock = acquireBodyScrollLock(contentElement.ownerDocument);
    }

    if (state.modal && (options.hideOutsideAria ?? true)) {
      restoreAriaOutside = ariaHideOutside([contentElement]);
    }

    dismissLayer = createDismissableLayer({
      element: () => contentElement,
      closeOnEscape: options.closeOnEscape ?? true,
      closeOnOutsideClick: options.closeOnOutsideClick ?? defaultCloseOutside,
      onDismiss: () => setOpen(false)
    });
    dismissLayer.activate();

    if (state.modal) {
      focusTrap = createFocusTrap({
        container: contentElement,
        restoreFocus: options.restoreFocus ?? true
      });
      focusTrap.activate();
    }
  };

  const setOpen = (nextOpen: boolean) => {
    if (state.open === nextOpen) return;
    if (!isControlled) {
      state = { ...state, open: nextOpen };
      notify();
    }
    options.onOpenChange?.(nextOpen);
    if (!isControlled) {
      if (nextOpen) {
        applyOpenEffects();
      } else {
        cleanupEffects();
      }
    }
  };

  return {
    ids,
    getState() {
      return state;
    },
    open() {
      setOpen(true);
    },
    close() {
      setOpen(false);
    },
    toggle() {
      setOpen(!state.open);
    },
    setOpen(nextOpen) {
      if (isControlled) {
        state = { ...state, open: nextOpen };
        notify();
        if (nextOpen) applyOpenEffects();
        else cleanupEffects();
        return;
      }
      setOpen(nextOpen);
    },
    setDir(dir) {
      if (state.dir === dir) return;
      state = { ...state, dir };
      notify();
    },
    mountContent(el) {
      contentElement = el;
      if (el && state.open) {
        applyOpenEffects();
      }
      return () => {
        if (contentElement === el) {
          cleanupEffects();
          contentElement = null;
        }
      };
    },
    getTriggerProps() {
      return {
        id: ids.trigger,
        type: 'button',
        'aria-haspopup': 'dialog',
        'aria-expanded': state.open,
        'aria-controls': ids.content,
        'data-forma-dialog-trigger': '',
        'data-state': state.open ? 'open' : 'closed',
        onClick: () => setOpen(!state.open)
      };
    },
    getOverlayProps() {
      return {
        'data-forma-dialog-overlay': '',
        'data-state': state.open ? 'open' : 'closed',
        onPointerDown: (event: PointerEvent) => {
          if (
            event.target === event.currentTarget &&
            (options.closeOnOutsideClick ?? defaultCloseOutside)
          ) {
            setOpen(false);
          }
        }
      };
    },
    getContentProps() {
      return {
        id: ids.content,
        role: state.role,
        tabIndex: -1,
        dir: state.dir,
        ...(state.modal ? { 'aria-modal': true as const } : {}),
        'aria-labelledby': ids.title,
        'aria-describedby': ids.description,
        'data-forma-dialog-content': '',
        'data-state': state.open ? 'open' : 'closed'
      };
    },
    getTitleProps() {
      return {
        id: ids.title,
        'data-forma-dialog-title': ''
      };
    },
    getDescriptionProps() {
      return {
        id: ids.description,
        'data-forma-dialog-description': ''
      };
    },
    getCloseProps() {
      return {
        type: 'button',
        'aria-label': options.closeLabel ?? 'Fechar diálogo',
        'data-forma-dialog-close': '',
        onClick: () => setOpen(false)
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy() {
      cleanupEffects();
      portal.unmount();
      listeners.clear();
    }
  };
}
