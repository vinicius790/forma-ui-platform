import { onBeforeUnmount, ref } from 'vue';
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

export function useCollapsible(options: CollapsibleOptions = {}) {
  const open = ref(options.open ?? options.defaultOpen ?? false);
  const controller = createCollapsibleController({
    ...options,
    onOpenChange: (next) => {
      open.value = next;
      options.onOpenChange?.(next);
    },
  });
  onBeforeUnmount(() => controller.destroy());
  return {
    open,
    controller,
    setOpen: (next: boolean) => controller.setOpen(next),
    toggle: () => controller.toggle(),
    getTriggerProps: () => controller.getTriggerProps(),
    getContentProps: () => controller.getContentProps(),
  };
}

export function usePopover(options: PopoverOptions = {}) {
  const open = ref(options.open ?? options.defaultOpen ?? false);
  const controller = createPopoverController({
    ...options,
    onOpenChange: (next) => {
      open.value = next;
      options.onOpenChange?.(next);
    },
  });
  onBeforeUnmount(() => controller.destroy());
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
  };
}

export function useDrawer(options: DrawerOptions = {}) {
  const open = ref(options.open ?? options.defaultOpen ?? false);
  const controller = createDrawerController({
    ...options,
    onOpenChange: (next) => {
      open.value = next;
      options.onOpenChange?.(next);
    },
  });
  onBeforeUnmount(() => controller.destroy());
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
  };
}

export function useSplitter(options: SplitterOptions = {}) {
  const value = ref(options.value ?? options.defaultValue ?? 50);
  const controller = createSplitterController({
    ...options,
    onValueChange: (next) => {
      value.value = next;
      options.onValueChange?.(next);
    },
  });
  onBeforeUnmount(() => controller.destroy());
  return {
    value,
    controller,
    setValue: (next: number) => controller.setValue(next),
    toggleCollapse: () => controller.toggleCollapse(),
    getHandleProps: () => controller.getHandleProps(),
    getPrimaryPaneProps: () => controller.getPrimaryPaneProps(),
    getSecondaryPaneProps: () => controller.getSecondaryPaneProps(),
  };
}

export function useHoverCard(options: HoverCardOptions = {}) {
  const open = ref(options.open ?? options.defaultOpen ?? false);
  const controller = createHoverCardController({
    ...options,
    onOpenChange: (next) => {
      open.value = next;
      options.onOpenChange?.(next);
    },
  });
  onBeforeUnmount(() => controller.destroy());
  return {
    open,
    controller,
    setOpen: (next: boolean) => controller.setOpen(next),
    getTriggerProps: () => controller.getTriggerProps(),
    getContentProps: () => controller.getContentProps(),
  };
}
