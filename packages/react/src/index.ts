import {
  createElement as h,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type {
  ButtonHTMLAttributes,
  ChangeEvent as ReactChangeEvent,
  ClipboardEvent as ReactClipboardEvent,
  FocusEvent as ReactFocusEvent,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  Ref,
} from 'react';
import {
  ariaHideOutside,
  createAvatarController,
  createComboboxController,
  createListboxController,
  createNumberFieldController,
  createPinInputController,
  createRadioGroupController,
  createRatingGroupController,
  createSearchFieldController,
  createToastStore,
  createToggleGroupController,
  createToolbarController,
  createTreeViewController,
  DismissableLayer,
  FocusTrap,
  getButtonProps,
  lockScroll,
  type AvatarImageState,
  type AvatarOptions,
  type ComboboxOption,
  type ComboboxOptions,
  type ListboxOption,
  type ListboxOptions,
  type ListboxValue,
  type NumberFieldOptions,
  type PinInputOptions,
  type RadioGroupOptions,
  type RadioItem,
  type RatingGroupOptions,
  type SearchFieldOptions,
  type ToggleGroupOptions,
  type ToggleItem,
  type ToolbarOptions,
  type TreeNode,
  type TreeViewOptions,
} from '@forma-ui/core';
import { createAccordionController } from '@forma-ui/core/components/accordion';
import { createCheckboxController, type CheckboxState, type CheckboxOptions } from '@forma-ui/core/components/checkbox';
import { createSwitchController, type SwitchOptions } from '@forma-ui/core/components/switch';
import { createDisclosureController, type DisclosureOptions } from '@forma-ui/core/components/disclosure';
import { createSliderController, type SliderOptions, type SliderValue } from '@forma-ui/core/components/slider';
import { createPaginationController, type PaginationOptions } from '@forma-ui/core/components/pagination';
import { createMenuController } from '@forma-ui/core/components/menu';
import { createSelectController } from '@forma-ui/core/components/select';
import type { SelectOption, SelectValue } from '@forma-ui/core/components/select';
import { createTabsController } from '@forma-ui/core/components/tabs';
import type { ToastInput } from '@forma-ui/core/components/toast';
import { createTooltipController } from '@forma-ui/core/components/tooltip';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { loading = false, disabled, type = 'button', ...props },
  ref,
) {
  return h('button', {
    ...props,
    ...getButtonProps({ disabled, loading, type }),
    ref,
  });
});

export interface DialogHookOptions {
  role?: 'dialog' | 'alertdialog';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsidePointer?: boolean;
  trapFocus?: boolean;
  titleId?: string;
  descriptionId?: string;
}

export function useDialog(options: DialogHookOptions = {}) {
  const [internalOpen, setInternalOpen] = useState(options.defaultOpen ?? false);
  const openState = options.open ?? internalOpen;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const restoreFocusRef = useRef(true);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const contentId = useId();

  const setOpen = useCallback((next: boolean) => {
    if (next) restoreFocusRef.current = true;
    if (optionsRef.current.open === undefined) setInternalOpen(next);
    optionsRef.current.onOpenChange?.(next);
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!openState || !content) return undefined;

    const shouldTrapFocus = options.trapFocus ?? options.modal !== false;
    const trap = shouldTrapFocus ? new FocusTrap(content) : null;
    trap?.activate();
    const unlock = options.modal === false ? () => undefined : lockScroll(content.ownerDocument.body);
    const unhide = options.modal === false ? () => undefined : ariaHideOutside(content);
    const layer = new DismissableLayer({
      element: content,
      dismissOnEscape: options.closeOnEscape !== false,
      dismissOnOutsidePointer: options.closeOnOutsidePointer === true,
      onDismiss: (reason) => {
        restoreFocusRef.current = reason !== 'outside-pointer';
        setOpen(false);
      },
    });
    const dismiss = layer.mount();

    return () => {
      dismiss();
      trap?.deactivate(restoreFocusRef.current);
      if (!trap && restoreFocusRef.current) triggerRef.current?.focus({ preventScroll: true });
      restoreFocusRef.current = true;
      unlock();
      unhide();
    };
  }, [openState, options.modal, options.trapFocus, options.closeOnEscape, options.closeOnOutsidePointer, setOpen]);

  const triggerProps = {
    type: 'button' as const,
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': openState,
    'aria-controls': contentId,
    ref: (element: HTMLElement | null) => { triggerRef.current = element; },
    onClick: () => setOpen(!openState),
  };
  const contentProps = {
    id: contentId,
    role: options.role ?? 'dialog',
    'aria-modal': options.modal === false ? undefined : true,
    'aria-labelledby': options.titleId,
    'aria-describedby': options.descriptionId,
    tabIndex: -1,
    ref: (element: HTMLElement | null) => { contentRef.current = element; },
    'data-state': openState ? 'open' : 'closed',
  };

  return {
    open: openState,
    setOpen,
    show: () => setOpen(true),
    close: () => setOpen(false),
    triggerProps,
    contentProps,
    triggerRef,
    contentRef,
  };
}

export function useAlertDialog(options: Omit<DialogHookOptions, 'role'> = {}) {
  return useDialog({ ...options, role: 'alertdialog', modal: options.modal ?? true });
}

export interface MenuHookOptions {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  direction?: 'ltr' | 'rtl';
  orientation?: 'horizontal' | 'vertical';
}

export function useMenu(options: MenuHookOptions = {}) {
  const [openState, setOpenState] = useState(options.defaultOpen ?? false);
  const contentId = useId();
  const callbackRef = useRef(options.onOpenChange);
  callbackRef.current = options.onOpenChange;
  const onOpenChange = useCallback((open: boolean) => {
    setOpenState(open);
    callbackRef.current?.(open);
  }, []);
  const controllerRef = useRef<ReturnType<typeof createMenuController> | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createMenuController({
      defaultOpen: options.defaultOpen,
      direction: options.direction,
      orientation: options.orientation,
      onOpenChange,
    });
  }
  const controller = controllerRef.current;
  controller.updateOptions({ direction: options.direction, orientation: options.orientation, onOpenChange });

  useEffect(() => () => controller.destroy(), [controller]);

  const triggerProps = {
    ...controller.getTriggerProps(contentId),
    ref: (element: HTMLElement | null) => controller.setTrigger(element),
  };
  const contentProps = {
    ...controller.getContentProps(),
    id: contentId,
    ref: (element: HTMLElement | null) => controller.setContent(element),
  };

  return {
    open: openState,
    controller,
    triggerProps,
    contentProps,
    registerItem: controller.registerItem.bind(controller),
    getItemProps: controller.getItemProps.bind(controller),
    getCheckboxItemProps: controller.getCheckboxItemProps.bind(controller),
    getRadioItemProps: controller.getRadioItemProps.bind(controller),
    openMenu: (edge?: 'first' | 'last') => controller.openMenu(edge),
    close: () => controller.close(),
  };
}

export interface TabsHookOptions {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  direction?: 'ltr' | 'rtl';
  activationMode?: 'automatic' | 'manual';
  loop?: boolean;
}

export function useTabs(options: TabsHookOptions = {}) {
  const [internalValue, setInternalValue] = useState(options.defaultValue ?? '');
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onValueChange = useCallback((next: string) => {
    if (optionsRef.current.value === undefined) setInternalValue(next);
    optionsRef.current.onValueChange?.(next);
  }, []);
  const controllerRef = useRef<ReturnType<typeof createTabsController> | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createTabsController({ ...options, defaultValue: options.defaultValue ?? internalValue, onValueChange });
  }
  const controller = controllerRef.current;
  controller.updateOptions({
    value: options.value,
    direction: options.direction,
    orientation: options.orientation,
    activationMode: options.activationMode,
    loop: options.loop,
    onValueChange,
  });
  const currentValue = options.value ?? internalValue;
  const register = useCallback((tab: Parameters<typeof controller.register>[0]) => controller.register(tab), [controller]);
  return {
    value: currentValue,
    select: (next: string) => controller.select(next),
    focus: (next: string) => controller.focus(next),
    register,
    getTabProps: controller.getTabProps.bind(controller),
    getPanelProps: controller.getPanelProps.bind(controller),
    onKeyDown: controller.onKeyDown.bind(controller),
    controller,
  };
}

export interface TooltipHookOptions {
  delayDuration?: number;
  closeDelayDuration?: number;
  disabled?: boolean;
}

export function useTooltip(options: TooltipHookOptions = {}) {
  const [openState, setOpenState] = useState(false);
  const tooltipId = useId();
  const controllerRef = useRef<ReturnType<typeof createTooltipController> | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createTooltipController({ ...options, onOpenChange: setOpenState });
  }
  const controller = controllerRef.current;
  controller.updateOptions({ ...options, onOpenChange: setOpenState });
  useEffect(() => () => controller.destroy(), [controller]);
  return {
    open: openState && !options.disabled,
    triggerProps: controller.getTriggerProps(tooltipId),
    contentProps: { ...controller.getContentProps(tooltipId), hidden: !openState || Boolean(options.disabled) },
    controller,
  };
}

export interface SelectHookOptions {
  value?: SelectValue;
  defaultValue?: SelectValue;
  options: SelectOption[];
  onValueChange?: (value: SelectValue) => void;
  disabled?: boolean;
  multiple?: boolean;
  labelId?: string;
}

export function useSelect(options: SelectHookOptions) {
  const initialValue: SelectValue = options.multiple
    ? options.defaultValue ?? []
    : options.defaultValue ?? '';
  const [internalValue, setInternalValue] = useState<SelectValue>(initialValue);
  const [openState, setOpenState] = useState(false);
  const listboxId = useId();
  const labelId = options.labelId ?? `${listboxId}-label`;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onValueChange = useCallback((next: SelectValue) => {
    if (optionsRef.current.value === undefined) setInternalValue(next);
    optionsRef.current.onValueChange?.(next);
    if (!optionsRef.current.multiple) setOpenState(false);
  }, []);
  const controllerRef = useRef<ReturnType<typeof createSelectController> | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createSelectController({
      value: options.value,
      defaultValue: initialValue,
      multiple: options.multiple,
      options: options.options,
      disabled: options.disabled,
      onOpenChange: setOpenState,
      onValueChange,
    });
  }
  const controller = controllerRef.current;
  controller.updateOptions({
    value: options.value,
    multiple: options.multiple,
    options: options.options,
    disabled: options.disabled,
    onOpenChange: setOpenState,
    onValueChange,
  });

  useEffect(() => () => controller.destroy(), [controller]);
  useEffect(() => {
    if (options.disabled) {
      controller.hide();
      setOpenState(false);
    }
  }, [controller, options.disabled]);

  const rawValue = options.value ?? internalValue;
  const currentValue: SelectValue = options.multiple
    ? Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : []
    : Array.isArray(rawValue) ? rawValue[0] ?? '' : rawValue;
  const triggerProps = {
    ...controller.getTriggerProps(listboxId, labelId),
    ref: (element: HTMLElement | null) => controller.setTrigger(element),
    onClick: () => controller.toggle(),
    onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => controller.onKeyDown(event.nativeEvent),
  };
  const listboxProps = {
    ...controller.getListboxProps(listboxId, labelId),
    hidden: !openState,
    ref: (element: HTMLElement | null) => controller.setListbox(element),
  };

  return {
    value: currentValue,
    open: openState,
    triggerProps,
    listboxProps,
    labelId,
    labelProps: { id: labelId },
    getOptionProps: (option: SelectOption, index: number) => controller.getOptionProps(option, index, listboxId),
    openList: () => controller.show(),
    close: () => controller.hide(),
    controller,
  };
}

export function useMultiSelect(
  options: Omit<SelectHookOptions, 'multiple'>,
): Omit<ReturnType<typeof useSelect>, 'value'> & { value: string[] } {
  const result = useSelect({ ...options, multiple: true });
  return { ...result, value: Array.isArray(result.value) ? result.value : result.value ? [result.value] : [] };
}

export function useAccordion(options: {
  multiple?: boolean;
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
} = {}) {
  const [internalValue, setInternalValue] = useState<string | string[]>(
    options.defaultValue ?? (options.multiple ? [] : ''),
  );
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onValueChange = useCallback((next: string | string[]) => {
    if (optionsRef.current.value === undefined) setInternalValue(next);
    optionsRef.current.onValueChange?.(next);
  }, []);
  const controllerRef = useRef<ReturnType<typeof createAccordionController> | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createAccordionController({
      ...options,
      defaultValue: options.defaultValue ?? internalValue,
      onValueChange,
    });
  }
  const controller = controllerRef.current;
  controller.updateOptions({
    multiple: options.multiple,
    collapsible: options.collapsible,
    value: options.value,
    onValueChange,
  });
  return {
    value: options.value ?? internalValue,
    toggle: (id: string) => controller.toggle(id),
    isOpen: (id: string) => controller.isOpen(id),
    getItemProps: controller.getItemProps.bind(controller),
    register: controller.register.bind(controller),
    controller,
  };
}

const toastStore = createToastStore();
export const toast = (input: ToastInput) => toastStore.add(input);

export function useToasts() {
  const records = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    toastStore.getSnapshot,
  );
  return {
    toasts: records,
    dismiss: (id: string) => toastStore.dismiss(id),
    clear: () => toastStore.clear(),
    pause: (id: string) => toastStore.pause(id),
    resume: (id: string) => toastStore.resume(id),
  };
}

export function ToastViewport({
  label = 'Notifications',
  className,
  ...props
}: HTMLAttributes<HTMLOListElement> & { label?: string }) {
  const { toasts, dismiss, pause, resume } = useToasts();
  return h(
    'ol',
    { ...props, className, 'aria-label': label, 'data-forma-toast-viewport': '' },
    ...toasts.map((item) => h(
      'li',
      {
        key: item.id,
        role: 'status',
        'aria-live': 'polite',
        onMouseEnter: () => pause(item.id),
        onMouseLeave: () => resume(item.id),
        onFocus: () => pause(item.id),
        onBlur: (event: ReactFocusEvent<HTMLLIElement>) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) resume(item.id);
        },
      },
      item.title ? h('strong', null, item.title) : null,
      item.description ? h('p', null, item.description) : null,
      item.action
        ? h('button', { type: 'button', onClick: item.action.onClick }, item.action.label)
        : null,
      item.dismissible
        ? h('button', {
            type: 'button',
            onClick: () => dismiss(item.id),
            'aria-label': `Dismiss ${item.title ?? 'notification'}`,
          }, '×')
        : null,
    )),
  );
}

export { getButtonProps };


/** React state adapter for the core checkbox state machine, including mixed state. */
export function useCheckbox(options: CheckboxOptions = {}) {
  const [internal, setInternal] = useState<CheckboxState>(options.defaultChecked ?? false);
  const optionsRef = useRef(options); optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createCheckboxController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createCheckboxController();
  const checked = options.checked ?? internal;
  controllerRef.current.updateOptions({ ...options, checked, onCheckedChange: (value) => { if (optionsRef.current.checked === undefined) setInternal(value); optionsRef.current.onCheckedChange?.(value); } });
  return { checked, setChecked: (value: CheckboxState) => controllerRef.current?.setChecked(value), toggle: () => controllerRef.current?.toggle(), inputProps: controllerRef.current.getInputProps(), controller: controllerRef.current };
}

/** React adapter for a native-button switch with optional form input props. */
export function useSwitch(options: SwitchOptions = {}) {
  const [internal, setInternal] = useState(options.defaultChecked ?? false);
  const optionsRef = useRef(options); optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createSwitchController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createSwitchController();
  const checked = options.checked ?? internal;
  controllerRef.current.updateOptions({ ...options, checked, onCheckedChange: (value) => { if (optionsRef.current.checked === undefined) setInternal(value); optionsRef.current.onCheckedChange?.(value); } });
  return { checked, setChecked: (value: boolean) => controllerRef.current?.setChecked(value), toggle: () => controllerRef.current?.toggle(), buttonProps: controllerRef.current.getButtonProps(), inputProps: controllerRef.current.getInputProps(), controller: controllerRef.current };
}

export function useDisclosure(options: DisclosureOptions = {}) {
  const [internal, setInternal] = useState(options.defaultOpen ?? false);
  const optionsRef = useRef(options); optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createDisclosureController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createDisclosureController();
  const open = options.open ?? internal;
  controllerRef.current.updateOptions({ ...options, open, onOpenChange: (value) => { if (optionsRef.current.open === undefined) setInternal(value); optionsRef.current.onOpenChange?.(value); } });
  return { open, setOpen: (value: boolean) => controllerRef.current?.setOpen(value), toggle: () => controllerRef.current?.toggle(), controller: controllerRef.current };
}

export function useSlider(options: SliderOptions) {
  const initial = options.value ?? options.defaultValue ?? options.min ?? 0;
  const [internal, setInternal] = useState<SliderValue>(initial);
  const optionsRef = useRef(options); optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createSliderController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createSliderController(options);
  const value = options.value ?? internal;
  controllerRef.current.updateOptions({ ...options, value, onValueChange: (next) => { if (optionsRef.current.value === undefined) setInternal(next); optionsRef.current.onValueChange?.(next); } });
  return { value, values: controllerRef.current.values, setValue: (next: SliderValue, index?: number) => controllerRef.current?.setValue(next, index), setThumbValue: (index: number, next: number) => controllerRef.current?.setThumbValue(index, next), getThumbProps: controllerRef.current.getThumbProps.bind(controllerRef.current), controller: controllerRef.current };
}

export function usePagination(options: PaginationOptions) {
  const [internal, setInternal] = useState(options.defaultPage ?? 1);
  const optionsRef = useRef(options); optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createPaginationController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createPaginationController(options);
  const page = options.page ?? internal;
  controllerRef.current.updateOptions({ ...options, page, onPageChange: (next) => { if (optionsRef.current.page === undefined) setInternal(next); optionsRef.current.onPageChange?.(next); } });
  return { page: controllerRef.current.page, pageItems: controllerRef.current.getPageItems(), setPage: (next: number) => controllerRef.current?.setPage(next), previous: () => controllerRef.current?.previous(), next: () => controllerRef.current?.next(), previousProps: controllerRef.current.getPreviousProps(), nextProps: controllerRef.current.getNextProps(), getPageProps: controllerRef.current.getPageProps.bind(controllerRef.current), controller: controllerRef.current };
}


/** Subscribe React to any Forma-compatible external controller/store snapshot. */
export interface FormaExternalStore<Snapshot> {
  subscribe(listener: () => void): () => void;
  getSnapshot(): Snapshot;
}

export function useFormaStore<Snapshot>(store: FormaExternalStore<Snapshot>): Snapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

const toNativeKeyboardEvent = (
  event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent,
): KeyboardEvent => ('nativeEvent' in event ? event.nativeEvent : event);

function useForceRender(): () => void {
  const [, setRevision] = useState(0);
  return useCallback(() => setRevision((value) => value + 1), []);
}

function omitKeys<T extends Record<string, unknown>, K extends keyof T>(
  source: T,
  ...keys: K[]
): Omit<T, K> {
  const clone = { ...source };
  for (const key of keys) {
    delete clone[key];
  }
  return clone;
}

export function useRadioGroup(options: RadioGroupOptions = {}) {
  const [internal, setInternal] = useState(options.defaultValue ?? '');
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createRadioGroupController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createRadioGroupController(options);
  const controller = controllerRef.current;
  controller.updateOptions({
    ...options,
    onValueChange: (next) => {
      if (optionsRef.current.value === undefined) setInternal(next);
      optionsRef.current.onValueChange?.(next);
    },
  });
  const value = options.value ?? internal;
  const rootProps = controller.getRootProps();
  return {
    value,
    controller,
    select: (next: string) => controller.select(next),
    register: (item: RadioItem) => controller.register(item),
    rootProps: {
      ...rootProps,
      onKeyDown: (event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent) =>
        rootProps.onKeyDown(toNativeKeyboardEvent(event)),
    },
    getItemProps: (itemValue: string) => controller.getItemProps(itemValue),
  };
}

export function useListbox<T = unknown>(options: ListboxOptions<T>) {
  const [internal, setInternal] = useState<ListboxValue>(
    options.defaultValue ?? (options.selectionMode === 'multiple' ? [] : ''),
  );
  const bump = useForceRender();
  const listboxId = useId();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createListboxController<T>> | null>(null);
  if (!controllerRef.current) controllerRef.current = createListboxController<T>(options);
  const controller = controllerRef.current;
  controller.updateOptions({
    ...options,
    onValueChange: (next) => {
      if (optionsRef.current.value === undefined) setInternal(next);
      optionsRef.current.onValueChange?.(next);
    },
  });
  const value: ListboxValue =
    options.value !== undefined
      ? options.value
      : controller.mode === 'multiple'
        ? controller.selectedKeys
        : (internal as string);
  return {
    value,
    selectedKeys: controller.selectedKeys,
    activeOption: controller.activeOption,
    controller,
    setActiveKey: (key: string) => {
      controller.setActiveKey(key);
      bump();
    },
    select: (key: string) => controller.select(key),
    selectAll: () => controller.selectAll(),
    getRootProps: (id = listboxId) => {
      const rootProps = controller.getRootProps(id);
      return {
        ...rootProps,
        onKeyDown: (event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent) => {
          rootProps.onKeyDown(toNativeKeyboardEvent(event));
          bump();
        },
      };
    },
    getOptionProps: (key: string) => {
      const itemProps = controller.getOptionProps(key);
      return {
        ...itemProps,
        onPointerMove: () => {
          itemProps.onPointerMove();
          bump();
        },
        onClick: () => {
          itemProps.onClick();
          bump();
        },
      };
    },
  };
}

export function useTreeView<T = unknown>(options: TreeViewOptions<T>) {
  const [, setRevision] = useState(0);
  const bump = useCallback(() => setRevision((value) => value + 1), []);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createTreeViewController<T>> | null>(null);
  if (!controllerRef.current) controllerRef.current = createTreeViewController<T>(options);
  const controller = controllerRef.current;
  controller.updateOptions({
    ...options,
    onExpandedChange: (keys) => {
      bump();
      optionsRef.current.onExpandedChange?.(keys);
    },
    onSelectedChange: (keys) => {
      bump();
      optionsRef.current.onSelectedChange?.(keys);
    },
  });
  useEffect(() => () => controller.destroy(), [controller]);
  return {
    expandedKeys: controller.expandedKeys,
    selectedKeys: controller.selectedKeys,
    visibleNodes: controller.visibleNodes,
    focusedKey: controller.focusedKeyValue,
    controller,
    focus: (key: string) => {
      controller.focus(key);
      bump();
    },
    toggleExpanded: (key: string) => {
      controller.toggleExpanded(key);
      bump();
    },
    select: (key: string, additive?: boolean) => controller.select(key, additive),
    registerItem: (key: string, element: HTMLElement | null) =>
      controller.registerItem(key, element),
    getRootProps: (label?: string) => {
      const rootProps = controller.getRootProps(label);
      return {
        ...rootProps,
        onKeyDown: (event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent) => {
          rootProps.onKeyDown(toNativeKeyboardEvent(event));
          bump();
        },
      };
    },
    getItemProps: (key: string) => {
      const itemProps = controller.getItemProps(key);
      return {
        ...itemProps,
        onFocus: () => {
          itemProps.onFocus();
          bump();
        },
      };
    },
  };
}

export function useCombobox(options: ComboboxOptions) {
  const [internalValue, setInternalValue] = useState(options.defaultValue ?? '');
  const [internalInput, setInternalInput] = useState(options.defaultInputValue ?? '');
  const [internalOpen, setInternalOpen] = useState(options.defaultOpen ?? false);
  const bump = useForceRender();
  const listboxId = useId();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createComboboxController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createComboboxController(options);
  const controller = controllerRef.current;
  controller.updateOptions({
    ...options,
    onValueChange: (next) => {
      if (optionsRef.current.value === undefined) setInternalValue(next);
      optionsRef.current.onValueChange?.(next);
    },
    onInputValueChange: (next) => {
      if (optionsRef.current.inputValue === undefined) setInternalInput(next);
      optionsRef.current.onInputValueChange?.(next);
    },
    onOpenChange: (next) => {
      if (optionsRef.current.open === undefined) setInternalOpen(next);
      optionsRef.current.onOpenChange?.(next);
    },
  });
  const value = options.value ?? internalValue;
  const inputValue = options.inputValue ?? internalInput;
  const open = options.open ?? internalOpen;
  return {
    value,
    inputValue,
    open,
    activeOption: controller.activeOption,
    controller,
    setOpen: (next: boolean) => controller.setOpen(next),
    setInputValue: (next: string) => controller.setInputValue(next),
    select: (next: string) => controller.select(next),
    getInputProps: (id = listboxId) => {
      const raw = controller.getInputProps(id);
      return {
        ...omitKeys(raw, 'onInput'),
        onChange: (event: ReactChangeEvent<HTMLInputElement> | Event) =>
          controller.setInputValue((event.currentTarget as HTMLInputElement).value),
        onKeyDown: (event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent) => {
          raw.onKeyDown(toNativeKeyboardEvent(event));
          bump();
        },
      };
    },
    getListboxProps: (id = listboxId) => controller.getListboxProps(id),
    getOptionProps: (option: ComboboxOption, id = listboxId) => {
      const optionProps = controller.getOptionProps(option, id);
      return {
        ...optionProps,
        onPointerMove: () => {
          optionProps.onPointerMove();
          bump();
        },
      };
    },
  };
}

export function useNumberField(options: NumberFieldOptions = {}) {
  const [internal, setInternal] = useState(options.defaultValue ?? options.min ?? 0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createNumberFieldController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createNumberFieldController(options);
  const controller = controllerRef.current;
  controller.updateOptions({
    ...options,
    onValueChange: (next) => {
      if (optionsRef.current.value === undefined) setInternal(next);
      optionsRef.current.onValueChange?.(next);
    },
  });
  void internal;
  const inputProps = controller.getInputProps();
  return {
    value: controller.value,
    formattedValue: controller.format(),
    controller,
    setValue: (next: number) => controller.setValue(next),
    increment: (multiplier?: number) => controller.increment(multiplier),
    decrement: (multiplier?: number) => controller.decrement(multiplier),
    inputProps: {
      ...inputProps,
      onChange: (event: ReactChangeEvent<HTMLInputElement> | Event) => {
        const next = (event.currentTarget as HTMLInputElement).valueAsNumber;
        if (Number.isFinite(next)) controller.setValue(next);
      },
      onKeyDown: (event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent) =>
        inputProps.onKeyDown(toNativeKeyboardEvent(event)),
    },
    incrementButtonProps: controller.getIncrementButtonProps(),
    decrementButtonProps: controller.getDecrementButtonProps(),
  };
}

export function useSearchField(options: SearchFieldOptions = {}) {
  const [internal, setInternal] = useState(options.defaultValue ?? '');
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createSearchFieldController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createSearchFieldController(options);
  const controller = controllerRef.current;
  controller.updateOptions({
    ...options,
    onValueChange: (next) => {
      if (optionsRef.current.value === undefined) setInternal(next);
      optionsRef.current.onValueChange?.(next);
    },
  });
  const value = options.value ?? internal;
  const raw = controller.getInputProps();
  return {
    value,
    controller,
    setValue: (next: string) => controller.setValue(next),
    clear: () => controller.clear(),
    submit: () => controller.submit(),
    inputProps: {
      ...omitKeys(raw, 'onInput'),
      onChange: (event: ReactChangeEvent<HTMLInputElement> | Event) =>
        controller.setValue((event.currentTarget as HTMLInputElement).value),
      onKeyDown: (event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent) =>
        raw.onKeyDown(toNativeKeyboardEvent(event)),
    },
    clearButtonProps: controller.getClearButtonProps(),
  };
}

export function useToggleGroup(options: ToggleGroupOptions = {}) {
  const [internal, setInternal] = useState<string | string[]>(
    options.defaultValue ?? (options.type === 'multiple' ? [] : ''),
  );
  const bump = useForceRender();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createToggleGroupController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createToggleGroupController(options);
  const controller = controllerRef.current;
  controller.updateOptions({
    ...options,
    onValueChange: (next) => {
      if (optionsRef.current.value === undefined) setInternal(next);
      optionsRef.current.onValueChange?.(next);
    },
  });
  const value = options.value ?? internal;
  return {
    value,
    controller,
    toggle: (itemValue: string) => controller.toggle(itemValue),
    register: (item: ToggleItem) => controller.register(item),
    getRootProps: (label?: string) => {
      const rootProps = controller.getRootProps(label);
      return {
        ...rootProps,
        onKeyDown: (event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent) => {
          rootProps.onKeyDown(toNativeKeyboardEvent(event));
          bump();
        },
      };
    },
    getItemProps: (itemValue: string) => {
      const itemProps = controller.getItemProps(itemValue);
      return {
        ...itemProps,
        onFocus: () => {
          itemProps.onFocus();
          bump();
        },
      };
    },
  };
}

export function usePinInput(options: PinInputOptions = {}) {
  const [internal, setInternal] = useState(options.defaultValue ?? '');
  const bump = useForceRender();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createPinInputController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createPinInputController(options);
  const controller = controllerRef.current;
  controller.updateOptions({
    ...options,
    onValueChange: (next) => {
      if (optionsRef.current.value === undefined) setInternal(next);
      optionsRef.current.onValueChange?.(next);
    },
  });
  useEffect(
    () => () => {
      for (let i = 0; i < controller.length; i += 1) {
        controller.registerInput(i, null);
      }
    },
    [controller],
  );
  const value = options.value ?? internal;
  const rootProps = controller.getRootProps();
  return {
    value,
    length: controller.length,
    focusedIndex: controller.focusedIndexValue,
    controller,
    setValue: (next: string) => controller.setValue(next),
    paste: (text: string) => controller.paste(text),
    focus: (index: number) => {
      controller.focus(index);
      bump();
    },
    registerInput: (index: number, element: HTMLInputElement | null) =>
      controller.registerInput(index, element),
    rootProps,
    getInputProps: (index: number) => {
      const raw = controller.getInputProps(index);
      return {
        ...omitKeys(raw, 'onInput', 'onPaste'),
        onChange: (event: ReactChangeEvent<HTMLInputElement> | Event) => {
          controller.input(index, (event.currentTarget as HTMLInputElement).value);
          bump();
        },
        onPaste: (event: ReactClipboardEvent<HTMLInputElement> | ClipboardEvent) => {
          const text = event.clipboardData?.getData('text');
          if (text) {
            event.preventDefault();
            controller.paste(text);
            bump();
          }
        },
        onKeyDown: (event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent) => {
          raw.onKeyDown(toNativeKeyboardEvent(event));
          bump();
        },
      };
    },
  };
}

export function useRatingGroup(options: RatingGroupOptions = {}) {
  const [internal, setInternal] = useState(options.defaultValue ?? 0);
  const bump = useForceRender();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createRatingGroupController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createRatingGroupController(options);
  const controller = controllerRef.current;
  controller.updateOptions({
    ...options,
    onValueChange: (next) => {
      if (optionsRef.current.value === undefined) setInternal(next);
      optionsRef.current.onValueChange?.(next);
    },
  });
  void internal;
  return {
    value: controller.value,
    count: controller.count,
    controller,
    setValue: (next: number) => controller.setValue(next),
    getRootProps: (label?: string) => controller.getRootProps(label),
    getItemProps: (itemValue: number) => {
      const itemProps = controller.getItemProps(itemValue);
      return {
        ...itemProps,
        onFocus: () => {
          itemProps.onFocus();
          bump();
        },
        onKeyDown: (event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent) => {
          itemProps.onKeyDown(toNativeKeyboardEvent(event));
          bump();
        },
      };
    },
  };
}

export function useAvatar(options: AvatarOptions = {}) {
  const [, setState] = useState<AvatarImageState>(() => (options.src ? 'loading' : 'empty'));
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controllerRef = useRef<ReturnType<typeof createAvatarController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createAvatarController(options);
  const controller = controllerRef.current;
  controller.updateOptions({
    ...options,
    onLoad: () => {
      setState(controller.imageState);
      optionsRef.current.onLoad?.();
    },
    onError: () => {
      setState(controller.imageState);
      optionsRef.current.onError?.();
    },
  });
  return {
    imageState: controller.imageState,
    controller,
    imageProps: controller.getImageProps(),
    fallbackProps: controller.getFallbackProps(),
  };
}

export function useToolbar(options: ToolbarOptions = {}) {
  const controllerRef = useRef<ReturnType<typeof createToolbarController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createToolbarController(options);
  const controller = controllerRef.current;
  controller.updateOptions(options);
  const rootProps = controller.getRootProps();
  return {
    controller,
    register: (item: { id: string; element: HTMLElement; disabled?: boolean }) =>
      controller.register(item),
    setCurrent: (id: string, focus?: boolean) => controller.setCurrent(id, focus),
    rootProps: {
      ...rootProps,
      onKeyDown: (event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent) =>
        rootProps.onKeyDown(toNativeKeyboardEvent(event)),
    },
  };
}

export type {
  AvatarImageState,
  AvatarOptions,
  ComboboxOption,
  ComboboxOptions,
  ListboxOption,
  ListboxOptions,
  ListboxValue,
  NumberFieldOptions,
  PinInputOptions,
  RadioGroupOptions,
  RadioItem,
  RatingGroupOptions,
  SearchFieldOptions,
  ToggleGroupOptions,
  ToggleItem,
  ToolbarOptions,
  TreeNode,
  TreeViewOptions,
};

export * from './overlays-and-layout';
export * from './inputs-and-navigation';
export * from './enterprise-and-boards';
export * from './workbench-and-media';
