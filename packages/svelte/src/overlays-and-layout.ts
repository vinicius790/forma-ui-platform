import { writable } from 'svelte/store';
import {
  createCollapsibleController,
  createDrawerController,
  createHoverCardController,
  createPopoverController,
  createSplitterController,
  type CollapsibleOptions,
  type DrawerOptions,
  type HoverCardOptions,
  type PopoverOptions,
  type SplitterOptions,
} from '@forma-ui/core';

export function createCollapsibleStore(options: CollapsibleOptions = {}) {
  const open = writable(options.open ?? options.defaultOpen ?? false);
  const controller = createCollapsibleController({
    ...options,
    onOpenChange: (next) => {
      open.set(next);
      options.onOpenChange?.(next);
    },
  });
  return {
    open,
    controller,
    setOpen: (next: boolean) => controller.setOpen(next),
    toggle: () => controller.toggle(),
    getTriggerProps: () => controller.getTriggerProps(),
    getContentProps: () => controller.getContentProps(),
    destroy: () => controller.destroy(),
  };
}

export function createPopoverStore(options: PopoverOptions = {}) {
  const open = writable(options.open ?? options.defaultOpen ?? false);
  const controller = createPopoverController({
    ...options,
    onOpenChange: (next) => {
      open.set(next);
      options.onOpenChange?.(next);
    },
  });
  return {
    open,
    controller,
    setOpen: (next: boolean) => controller.setOpen(next),
    toggle: () => controller.toggle(),
    close: () => controller.close(),
    attachContent: (el: HTMLElement | null) => controller.attachContent(el),
    getTriggerProps: () => controller.getTriggerProps(),
    getContentProps: () => controller.getContentProps(),
    getCloseProps: () => controller.getCloseProps(),
    destroy: () => controller.destroy(),
  };
}

export function createDrawerStore(options: DrawerOptions = {}) {
  const open = writable(options.open ?? options.defaultOpen ?? false);
  const controller = createDrawerController({
    ...options,
    onOpenChange: (next) => {
      open.set(next);
      options.onOpenChange?.(next);
    },
  });
  return {
    open,
    controller,
    setOpen: (next: boolean) => controller.setOpen(next),
    toggle: () => controller.toggle(),
    close: () => controller.close(),
    attachContent: (el: HTMLElement | null) => controller.attachContent(el),
    getTriggerProps: () => controller.getTriggerProps(),
    getContentProps: () => controller.getContentProps(),
    getTitleProps: () => controller.getTitleProps(),
    getDescriptionProps: () => controller.getDescriptionProps(),
    getCloseProps: () => controller.getCloseProps(),
    destroy: () => controller.destroy(),
  };
}

export function createSplitterStore(options: SplitterOptions = {}) {
  const value = writable(options.value ?? options.defaultValue ?? 50);
  const controller = createSplitterController({
    ...options,
    onValueChange: (next) => {
      value.set(next);
      options.onValueChange?.(next);
    },
  });
  return {
    value,
    controller,
    setValue: (next: number) => controller.setValue(next),
    toggleCollapse: () => controller.toggleCollapse(),
    getHandleProps: () => controller.getHandleProps(),
    getPrimaryPaneProps: () => controller.getPrimaryPaneProps(),
    getSecondaryPaneProps: () => controller.getSecondaryPaneProps(),
    destroy: () => controller.destroy(),
  };
}

export function createHoverCardStore(options: HoverCardOptions = {}) {
  const open = writable(options.open ?? options.defaultOpen ?? false);
  const controller = createHoverCardController({
    ...options,
    onOpenChange: (next) => {
      open.set(next);
      options.onOpenChange?.(next);
    },
  });
  return {
    open,
    controller,
    setOpen: (next: boolean) => controller.setOpen(next),
    getTriggerProps: () => controller.getTriggerProps(),
    getContentProps: () => controller.getContentProps(),
    destroy: () => controller.destroy(),
  };
}
