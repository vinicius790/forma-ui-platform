import {
  createFocusTrap,
  createPortalHost,
  createDialogMachine,
  createMenuMachine,
  createTabsMachine,
  createTooltipMachine,
  createSelectMachine,
  createToastStore,
  createAccordionMachine,
  createI18nManager,
  type DialogOptions,
  type MenuOptions,
  type TabsOptions,
  type TooltipOptions,
  type SelectOptions,
  type ToastStoreOptions,
  type AccordionOptions
} from '@forma-ui/core';

export interface ReadableStore<T> {
  subscribe: (run: (value: T) => void) => () => void;
}

function toReadableStore<T>(
  getSnapshot: () => T,
  subscribeFn: (cb: (v: T) => void) => () => void
): ReadableStore<T> {
  return {
    subscribe(run) {
      run(getSnapshot());
      return subscribeFn(run);
    }
  };
}

export function focusTrapAction(node: HTMLElement, enabled = true) {
  const trap = createFocusTrap({ container: node, restoreFocus: true });
  if (enabled) trap.activate();
  return {
    update(nextEnabled: boolean) {
      if (nextEnabled) trap.activate();
      else trap.deactivate();
    },
    destroy() {
      trap.deactivate();
    }
  };
}

export function portalAction(node: HTMLElement, target?: HTMLElement) {
  const portal = createPortalHost({ target });
  const host = portal.mount();
  host?.appendChild(node);
  return {
    destroy() {
      node.remove();
      portal.unmount();
    }
  };
}

export function createDialogStore(options: DialogOptions = {}) {
  const machine = createDialogMachine(options);
  return {
    machine,
    state: toReadableStore(machine.getState, machine.subscribe)
  };
}

export function createMenuStore(options: MenuOptions) {
  const machine = createMenuMachine(options);
  return {
    machine,
    state: toReadableStore(machine.getState, machine.subscribe)
  };
}

export function createTabsStore(options: TabsOptions) {
  const machine = createTabsMachine(options);
  return {
    machine,
    state: toReadableStore(machine.getState, machine.subscribe)
  };
}

export function createTooltipStore(options: TooltipOptions = {}) {
  const machine = createTooltipMachine(options);
  return {
    machine,
    state: toReadableStore(machine.getState, machine.subscribe)
  };
}

export function createSelectStore(options: SelectOptions) {
  const machine = createSelectMachine(options);
  return {
    machine,
    state: toReadableStore(machine.getState, machine.subscribe)
  };
}

export function createSvelteToastStore(options: ToastStoreOptions = {}) {
  const store = createToastStore(options);
  return {
    store,
    toasts: toReadableStore(store.getToasts, store.subscribe)
  };
}

export function createAccordionStore(options: AccordionOptions) {
  const machine = createAccordionMachine(options);
  return {
    machine,
    state: toReadableStore(machine.getState, machine.subscribe)
  };
}

export function createSvelteI18nStore(locale = 'pt-BR') {
  const manager = createI18nManager(locale);
  return {
    manager,
    state: toReadableStore(manager.getState, manager.subscribe)
  };
}
