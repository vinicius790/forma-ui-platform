import { createSignal, onCleanup } from 'solid-js';
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

export function createCollapsible(options: CollapsibleOptions = {}) {
  const [open, setOpenSignal] = createSignal(options.open ?? options.defaultOpen ?? false);
  const controller = createCollapsibleController({
    ...options,
    onOpenChange: (next) => {
      setOpenSignal(next);
      options.onOpenChange?.(next);
    },
  });
  onCleanup(() => controller.destroy());
  return { open, controller, setOpen: (v: boolean) => controller.setOpen(v), toggle: () => controller.toggle() };
}

export function createPopover(options: PopoverOptions = {}) {
  const [open, setOpenSignal] = createSignal(options.open ?? options.defaultOpen ?? false);
  const controller = createPopoverController({
    ...options,
    onOpenChange: (next) => {
      setOpenSignal(next);
      options.onOpenChange?.(next);
    },
  });
  onCleanup(() => controller.destroy());
  return { open, controller, setOpen: (v: boolean) => controller.setOpen(v), toggle: () => controller.toggle(), close: () => controller.close() };
}

export function createDrawer(options: DrawerOptions = {}) {
  const [open, setOpenSignal] = createSignal(options.open ?? options.defaultOpen ?? false);
  const controller = createDrawerController({
    ...options,
    onOpenChange: (next) => {
      setOpenSignal(next);
      options.onOpenChange?.(next);
    },
  });
  onCleanup(() => controller.destroy());
  return { open, controller, setOpen: (v: boolean) => controller.setOpen(v), toggle: () => controller.toggle(), close: () => controller.close() };
}

export function createSplitter(options: SplitterOptions = {}) {
  const [value, setValueSignal] = createSignal(options.value ?? options.defaultValue ?? 50);
  const controller = createSplitterController({
    ...options,
    onValueChange: (next) => {
      setValueSignal(next);
      options.onValueChange?.(next);
    },
  });
  onCleanup(() => controller.destroy());
  return { value, controller, setValue: (v: number) => controller.setValue(v), toggleCollapse: () => controller.toggleCollapse() };
}

export function createHoverCard(options: HoverCardOptions = {}) {
  const [open, setOpenSignal] = createSignal(options.open ?? options.defaultOpen ?? false);
  const controller = createHoverCardController({
    ...options,
    onOpenChange: (next) => {
      setOpenSignal(next);
      options.onOpenChange?.(next);
    },
  });
  onCleanup(() => controller.destroy());
  return { open, controller, setOpen: (v: boolean) => controller.setOpen(v) };
}
