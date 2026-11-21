import { useEffect, useRef, useState } from 'react';
import {
  createCollapsibleController,
  createDrawerController,
  createHoverCardController,
  createPopoverController,
  createSplitterController,
  type CollapsibleController,
  type CollapsibleOptions,
  type DrawerController,
  type DrawerOptions,
  type HoverCardController,
  type HoverCardOptions,
  type PopoverController,
  type PopoverOptions,
  type SplitterController,
  type SplitterOptions,
} from '@forma-ui/core';

function useLazyController<C extends { destroy(): void }>(factory: () => C): C {
  const ref = useRef<C | null>(null);
  if (!ref.current) ref.current = factory();
  useEffect(() => {
    const current = ref.current;
    return () => {
      current?.destroy();
      ref.current = null;
    };
  }, []);
  return ref.current;
}

export function useCollapsible(options: CollapsibleOptions = {}) {
  const [, bump] = useState(0);
  const onOpenChange = (open: boolean) => {
    bump((n) => n + 1);
    options.onOpenChange?.(open);
  };
  const controller = useLazyController<CollapsibleController>(() =>
    createCollapsibleController({ ...options, onOpenChange }),
  );
  controller.updateOptions({ ...options, onOpenChange });
  return {
    open: controller.open,
    setOpen: (next: boolean) => controller.setOpen(next),
    toggle: () => controller.toggle(),
    triggerProps: controller.getTriggerProps(),
    contentProps: controller.getContentProps(),
    controller,
  };
}

export function usePopover(options: PopoverOptions = {}) {
  const [, bump] = useState(0);
  const onOpenChange = (open: boolean) => {
    bump((n) => n + 1);
    options.onOpenChange?.(open);
  };
  const controller = useLazyController<PopoverController>(() =>
    createPopoverController({ ...options, onOpenChange }),
  );
  controller.updateOptions({ ...options, onOpenChange });
  return {
    open: controller.open,
    setOpen: (next: boolean) => controller.setOpen(next),
    toggle: () => controller.toggle(),
    close: () => controller.close(),
    attachContent: (el: HTMLElement | null) => controller.attachContent(el),
    triggerProps: controller.getTriggerProps(),
    contentProps: controller.getContentProps(),
    closeProps: controller.getCloseProps(),
    controller,
  };
}

export function useDrawer(options: DrawerOptions = {}) {
  const [, bump] = useState(0);
  const onOpenChange = (open: boolean) => {
    bump((n) => n + 1);
    options.onOpenChange?.(open);
  };
  const controller = useLazyController<DrawerController>(() =>
    createDrawerController({ ...options, onOpenChange }),
  );
  controller.updateOptions({ ...options, onOpenChange });
  return {
    open: controller.open,
    placement: controller.placement,
    setOpen: (next: boolean) => controller.setOpen(next),
    toggle: () => controller.toggle(),
    close: () => controller.close(),
    attachContent: (el: HTMLElement | null) => controller.attachContent(el),
    triggerProps: controller.getTriggerProps(),
    contentProps: controller.getContentProps(),
    titleProps: controller.getTitleProps(),
    descriptionProps: controller.getDescriptionProps(),
    closeProps: controller.getCloseProps(),
    controller,
  };
}

export function useSplitter(options: SplitterOptions = {}) {
  const [, bump] = useState(0);
  const onValueChange = (val: number) => {
    bump((n) => n + 1);
    options.onValueChange?.(val);
  };
  const controller = useLazyController<SplitterController>(() =>
    createSplitterController({ ...options, onValueChange }),
  );
  controller.updateOptions({ ...options, onValueChange });
  return {
    value: controller.value,
    setValue: (next: number) => controller.setValue(next),
    toggleCollapse: () => controller.toggleCollapse(),
    handleProps: controller.getHandleProps(),
    primaryPaneProps: controller.getPrimaryPaneProps(),
    secondaryPaneProps: controller.getSecondaryPaneProps(),
    controller,
  };
}

export function useHoverCard(options: HoverCardOptions = {}) {
  const [, bump] = useState(0);
  const onOpenChange = (open: boolean) => {
    bump((n) => n + 1);
    options.onOpenChange?.(open);
  };
  const controller = useLazyController<HoverCardController>(() =>
    createHoverCardController({ ...options, onOpenChange }),
  );
  controller.updateOptions({ ...options, onOpenChange });
  return {
    open: controller.open,
    setOpen: (next: boolean) => controller.setOpen(next),
    triggerProps: controller.getTriggerProps(),
    contentProps: controller.getContentProps(),
    controller,
  };
}
