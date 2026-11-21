import {
  readable,
  writable,
  type Readable,
  type Writable,
} from 'svelte/store';
import {
  createAccordionController,
  createAvatarController,
  createComboboxController,
  createDialogController,
  createListboxController,
  createMenuController,
  createNumberFieldController,
  createPinInputController,
  createPortal,
  createRadioGroupController,
  createRatingGroupController,
  createSearchFieldController,
  createSelectController,
  createTabsController,
  createToastStore as createCoreToastStore,
  createToggleGroupController,
  createToolbarController,
  createTooltipController,
  createTreeViewController,
  FocusTrap,
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
import type { SelectOption, SelectValue } from '@forma-ui/core/components/select';
import type { ToastInput, ToastRecord } from '@forma-ui/core/components/toast';
import { createCheckboxController } from '@forma-ui/core/components/checkbox';
import { createSwitchController } from '@forma-ui/core/components/switch';
import { createDisclosureController } from '@forma-ui/core/components/disclosure';
import { createPaginationController } from '@forma-ui/core/components/pagination';
import { createSliderController } from '@forma-ui/core/components/slider';
import type { CheckboxOptions } from '@forma-ui/core/components/checkbox';
import type { SwitchOptions } from '@forma-ui/core/components/switch';
import type { DisclosureOptions } from '@forma-ui/core/components/disclosure';
import type { PaginationOptions } from '@forma-ui/core/components/pagination';
import type { SliderOptions, SliderValue } from '@forma-ui/core/components/slider';

export function createOpenStore(initial = false): Writable<boolean> {
  return writable(initial);
}

export function createDialogStore(initial = false, role: 'dialog' | 'alertdialog' = 'dialog') {
  const open = writable(initial);
  const controller = createDialogController({
    defaultOpen: initial,
    role,
    onOpenChange: (value) => open.set(value),
  });
  const unsubscribeOpen = open.subscribe((value) => {
    if (value && !controller.open) controller.show();
    else if (!value && controller.open) controller.close();
  });

  return {
    open,
    controller,
    set: (value: boolean) => value ? controller.show() : controller.close(),
    getTriggerProps: (contentId?: string) => controller.getTriggerProps(contentId),
    getContentProps: (titleId?: string, descriptionId?: string) => controller.getContentProps(titleId, descriptionId),
    attachTrigger(element: HTMLElement | null, contentId?: string) {
      controller.setTrigger(element);
      if (!element) return { destroy: () => controller.setTrigger(null) };
      const props = controller.getTriggerProps(contentId);
      const handleClick = () => props.onClick();
      const syncState = (value: boolean) => element.setAttribute('aria-expanded', String(value));
      const unsubscribe = open.subscribe(syncState);
      if (element.tagName === 'BUTTON') element.setAttribute('type', 'button');
      element.setAttribute('aria-haspopup', 'dialog');
      if (contentId) element.setAttribute('aria-controls', contentId);
      element.addEventListener('click', handleClick);
      return {
        destroy: () => {
          element.removeEventListener('click', handleClick);
          unsubscribe();
          controller.setTrigger(null);
        },
      };
    },
    attachContent(element: HTMLElement | null, titleId?: string, descriptionId?: string) {
      controller.setContent(element);
      if (!element) return { destroy: () => controller.setContent(null) };
      const props = controller.getContentProps(titleId, descriptionId);
      element.setAttribute('role', props.role);
      if (props['aria-modal'] !== undefined) element.setAttribute('aria-modal', String(props['aria-modal']));
      else element.removeAttribute('aria-modal');
      if (props['aria-labelledby']) element.setAttribute('aria-labelledby', props['aria-labelledby']);
      else element.removeAttribute('aria-labelledby');
      if (props['aria-describedby']) element.setAttribute('aria-describedby', props['aria-describedby']);
      else element.removeAttribute('aria-describedby');
      element.tabIndex = -1;
      const unsubscribe = open.subscribe((value) => { element.dataset['state'] = value ? 'open' : 'closed'; });
      return { destroy: () => { unsubscribe(); controller.setContent(null); } };
    },
    destroy: () => { unsubscribeOpen(); controller.destroy(); },
  };
}

export function createAlertDialogStore(initial = false) {
  return createDialogStore(initial, 'alertdialog');
}

export function createMenuStore(initial = false, direction: 'ltr' | 'rtl' = 'ltr') {
  const open = writable(initial);
  const controller = createMenuController({
    defaultOpen: initial,
    direction,
    onOpenChange: (value) => open.set(value),
  });
  const unsubscribeOpen = open.subscribe((value) => {
    if (value && !controller.open) controller.openMenu();
    else if (!value && controller.open) controller.close(false);
  });
  return {
    open,
    controller,
    show: (edge: 'first' | 'last' = 'first') => controller.openMenu(edge),
    hide: () => controller.close(),
    attachTrigger(element: HTMLElement | null, contentId?: string) {
      controller.setTrigger(element);
      if (!element) return { destroy: () => controller.setTrigger(null) };
      const props = controller.getTriggerProps(contentId);
      const handleClick = () => props.onClick();
      const handleKeyDown = (event: KeyboardEvent) => props.onKeyDown(event);
      const syncExpanded = (value: boolean) => element.setAttribute('aria-expanded', String(value));
      const unsubscribe = open.subscribe(syncExpanded);
      if (element.tagName === 'BUTTON') element.setAttribute('type', 'button');
      element.setAttribute('aria-haspopup', 'menu');
      if (contentId) element.setAttribute('aria-controls', contentId);
      element.addEventListener('click', handleClick);
      element.addEventListener('keydown', handleKeyDown);
      return {
        destroy: () => {
          element.removeEventListener('click', handleClick);
          element.removeEventListener('keydown', handleKeyDown);
          unsubscribe();
          controller.setTrigger(null);
        },
      };
    },
    attachContent(element: HTMLElement | null, contentId?: string) {
      controller.setContent(element);
      if (!element) return { destroy: () => controller.setContent(null) };
      const props = controller.getContentProps();
      if (contentId) element.id = contentId;
      element.setAttribute('role', props.role);
      if (props['aria-orientation']) element.setAttribute('aria-orientation', props['aria-orientation']);
      else element.removeAttribute('aria-orientation');
      const syncState = (value: boolean) => { element.dataset['state'] = value ? 'open' : 'closed'; };
      const unsubscribe = open.subscribe(syncState);
      const handleKeyDown = (event: KeyboardEvent) => controller.onKeyDown(event);
      element.addEventListener('keydown', handleKeyDown);
      return { destroy: () => { unsubscribe(); element.removeEventListener('keydown', handleKeyDown); controller.setContent(null); } };
    },
    registerItem: controller.registerItem.bind(controller),
    getItemProps: controller.getItemProps.bind(controller),
    getCheckboxItemProps: controller.getCheckboxItemProps.bind(controller),
    getRadioItemProps: controller.getRadioItemProps.bind(controller),
    destroy: () => { unsubscribeOpen(); controller.destroy(); },
  };
}

export function createTabsStore(
  initial = '',
  options: { orientation?: 'horizontal' | 'vertical'; direction?: 'ltr' | 'rtl'; activationMode?: 'automatic' | 'manual' } = {},
) {
  const value = writable(initial);
  const controller = createTabsController({
    ...options,
    defaultValue: initial,
    onValueChange: (next) => value.set(next),
  });
  const unsubscribeValue = value.subscribe((next) => controller.updateOptions({ value: next }));
  return {
    value,
    controller,
    select: (next: string) => controller.select(next),
    register: controller.register.bind(controller),
    getTabProps: controller.getTabProps.bind(controller),
    getPanelProps: controller.getPanelProps.bind(controller),
    onKeyDown: controller.onKeyDown.bind(controller),
    destroy: unsubscribeValue,
  };
}

export function createSelectStore(options: SelectOption[], initial: SelectValue = '', multiple = false) {
  const value = writable(initial);
  const open = writable(false);
  const controller = createSelectController({
    options,
    defaultValue: initial,
    multiple,
    onOpenChange: (value) => open.set(value),
    onValueChange: (next) => {
      value.set(next);
      if (!multiple) open.set(false);
    },
  });
  const unsubscribeValue = value.subscribe((next) => controller.updateOptions({ value: next }));
  const unsubscribeOpen = open.subscribe((next) => {
    if (next && !controller.open) controller.show();
    else if (!next && controller.open) controller.hide();
  });
  return {
    value,
    open,
    controller,
    show: () => { controller.show(); open.set(controller.open); },
    hide: () => { controller.hide(); open.set(false); },
    toggle: () => { controller.toggle(); open.set(controller.open); },
    onKeyDown: (event: KeyboardEvent) => { controller.onKeyDown(event); open.set(controller.open); },
    select: (next: string) => controller.select(next),
    setOptions: (next: SelectOption[]) => controller.setOptions(next),
    attachTrigger(element: HTMLElement | null, listboxId = 'forma-select-listbox', labelId?: string) {
      controller.setTrigger(element);
      if (!element) return { destroy: () => controller.setTrigger(null) };
      const props = controller.getTriggerProps(listboxId, labelId);
      const handleClick = () => { props.onClick(); open.set(controller.open); syncState(); };
      const handleKeyDown = (event: KeyboardEvent) => { props.onKeyDown(event); open.set(controller.open); syncState(); };
      const syncState = () => {
        element.setAttribute('aria-expanded', String(controller.open));
        const activeDescendant = controller.getTriggerProps(listboxId, labelId)['aria-activedescendant'];
        if (activeDescendant) element.setAttribute('aria-activedescendant', activeDescendant);
        else element.removeAttribute('aria-activedescendant');
      };
      const unsubscribe = open.subscribe(syncState);
      if (element.tagName === 'BUTTON') element.setAttribute('type', 'button');
      element.setAttribute('role', 'combobox');
      element.setAttribute('aria-haspopup', 'listbox');
      element.setAttribute('aria-controls', listboxId);
      if (labelId) element.setAttribute('aria-labelledby', labelId);
      element.addEventListener('click', handleClick);
      element.addEventListener('keydown', handleKeyDown);
      return {
        destroy: () => {
          element.removeEventListener('click', handleClick);
          element.removeEventListener('keydown', handleKeyDown);
          unsubscribe();
          controller.setTrigger(null);
        },
      };
    },
    attachListbox(element: HTMLElement | null, listboxId = 'forma-select-listbox', labelId?: string) {
      controller.setListbox(element);
      if (!element) return { destroy: () => controller.setListbox(null) };
      const props = controller.getListboxProps(listboxId, labelId);
      element.id = props.id;
      element.setAttribute('role', props.role);
      if (props['aria-labelledby']) element.setAttribute('aria-labelledby', props['aria-labelledby']);
      else element.removeAttribute('aria-labelledby');
      if (props['aria-multiselectable'] !== undefined) element.setAttribute('aria-multiselectable', String(props['aria-multiselectable']));
      else element.removeAttribute('aria-multiselectable');
      const syncState = (value: boolean) => {
        element.hidden = !value;
        element.dataset['state'] = value ? 'open' : 'closed';
      };
      const unsubscribe = open.subscribe(syncState);
      return { destroy: () => { unsubscribe(); controller.setListbox(null); } };
    },
    getListboxProps: controller.getListboxProps.bind(controller),
    getOptionProps: controller.getOptionProps.bind(controller),
    destroy: () => { unsubscribeValue(); unsubscribeOpen(); controller.destroy(); },
  };
}

export function createMultiSelectStore(
  options: SelectOption[],
  initial: string[] = [],
): Omit<ReturnType<typeof createSelectStore>, 'value'> & { value: Writable<string[]> } {
  const store = createSelectStore(options, initial, true);
  return { ...store, value: store.value as Writable<string[]> };
}

export function createTooltipStore(options: { delayDuration?: number; closeDelayDuration?: number; disabled?: boolean } = {}) {
  const open = writable(false);
  const controller = createTooltipController({
    ...options,
    onOpenChange: (value) => open.set(value),
  });
  const unsubscribeOpen = open.subscribe((value) => controller.setOpen(value));
  return {
    open,
    controller,
    attachTrigger(element: HTMLElement | null, tooltipId?: string) {
      controller.setTrigger(element);
      if (!element || !tooltipId) return { destroy: () => controller.setTrigger(null) };
      const syncDescription = (value: boolean) => {
        if (value) element.setAttribute('aria-describedby', tooltipId);
        else if (element.getAttribute('aria-describedby') === tooltipId) element.removeAttribute('aria-describedby');
      };
      const unsubscribe = open.subscribe(syncDescription);
      return { destroy: () => { unsubscribe(); controller.setTrigger(null); } };
    },
    attachContent(element: HTMLElement | null, tooltipId?: string) {
      controller.setContent(element);
      if (!element) return { destroy: () => controller.setContent(null) };
      if (tooltipId) element.id = tooltipId;
      element.setAttribute('role', 'tooltip');
      const unsubscribe = open.subscribe((value) => {
        element.hidden = !value;
        element.dataset['state'] = value ? 'open' : 'closed';
      });
      return { destroy: () => { unsubscribe(); controller.setContent(null); } };
    },
    getTriggerProps: (id: string) => controller.getTriggerProps(id),
    getContentProps: (id: string) => controller.getContentProps(id),
    destroy: () => { unsubscribeOpen(); controller.destroy(); },
  };
}

export function createAccordionStore(
  initial: string | string[] = '',
  options: { multiple?: boolean; collapsible?: boolean } = {},
) {
  const value = writable(initial);
  const controller = createAccordionController({
    ...options,
    multiple: options.multiple ?? Array.isArray(initial),
    defaultValue: initial,
    onValueChange: (next) => value.set(next),
  });
  const unsubscribeValue = value.subscribe((next) => controller.updateOptions({ value: next }));
  return {
    value,
    controller,
    toggle: (id: string) => controller.toggle(id),
    isOpen: (id: string) => controller.isOpen(id),
    register: controller.register.bind(controller),
    getItemProps: controller.getItemProps.bind(controller),
    destroy: unsubscribeValue,
  };
}

export function createToastStore(options: { duration?: number; max?: number } = {}) {
  const notifications = writable<readonly ToastRecord[]>([]);
  const controller = createCoreToastStore(options);
  const unsubscribe = controller.subscribe(() => notifications.set(controller.getSnapshot()));
  return {
    notifications: { subscribe: notifications.subscribe } as Readable<readonly ToastRecord[]>,
    add: (input: ToastInput) => controller.add(input),
    update: (id: string, input: Partial<ToastInput>) => controller.update(id, input),
    dismiss: (id: string) => controller.dismiss(id),
    clear: () => controller.clear(),
    pause: (id: string) => controller.pause(id),
    resume: (id: string) => controller.resume(id),
    destroy: () => { unsubscribe(); controller.clear(); },
  };
}

export function focusTrap(node: HTMLElement, options: { returnFocus?: boolean } = {}) {
  const trap = new FocusTrap(node, options.returnFocus);
  trap.activate();
  return {
    update: () => trap.activate(),
    destroy: () => trap.deactivate(),
  };
}

export function portal(node: HTMLElement, target: HTMLElement | string = 'body') {
  const doc = node.ownerDocument;
  const container = typeof target === 'string'
    ? doc.querySelector<HTMLElement>(target)
    : target;
  if (!container) throw new Error(`Forma UI portal target not found: ${String(target)}`);
  const placeholder = doc.createComment('forma-portal-placeholder');
  node.parentNode?.insertBefore(placeholder, node);
  container.append(node);
  return {
    destroy: () => {
      placeholder.parentNode?.insertBefore(node, placeholder);
      placeholder.remove();
    },
  };
}

export function createPortalHost(target?: HTMLElement) {
  return createPortal({ container: target });
}

export type { Readable, Writable, SelectOption, SelectValue };


export function createCheckboxStore(options: CheckboxOptions = {}) {
  const checked = writable(options.checked ?? options.defaultChecked ?? false);
  const controller = createCheckboxController({ ...options, checked: options.checked ?? options.defaultChecked ?? false, onCheckedChange: (value) => { if (options.checked === undefined) checked.set(value); options.onCheckedChange?.(value); } });
  const unsubscribe = checked.subscribe((value) => controller.updateOptions({ checked: value }));
  return { checked, controller, set: (value: boolean | 'indeterminate') => controller.setChecked(value), toggle: () => controller.toggle(), getInputProps: () => controller.getInputProps(), destroy: () => { unsubscribe(); } };
}

export function createSwitchStore(options: SwitchOptions = {}) {
  const checked = writable(options.checked ?? options.defaultChecked ?? false);
  const controller = createSwitchController({ ...options, checked: options.checked ?? options.defaultChecked ?? false, onCheckedChange: (value) => { if (options.checked === undefined) checked.set(value); options.onCheckedChange?.(value); } });
  const unsubscribe = checked.subscribe((value) => controller.updateOptions({ checked: value }));
  return { checked, controller, set: (value: boolean) => controller.setChecked(value), toggle: () => controller.toggle(), getButtonProps: () => controller.getButtonProps(), destroy: () => unsubscribe() };
}

export function createDisclosureStore(options: DisclosureOptions = {}) {
  const open = writable(options.open ?? options.defaultOpen ?? false);
  const controller = createDisclosureController({ ...options, open: options.open ?? options.defaultOpen ?? false, onOpenChange: (value) => { if (options.open === undefined) open.set(value); options.onOpenChange?.(value); } });
  const unsubscribe = open.subscribe((value) => controller.updateOptions({ open: value }));
  return { open, controller, set: (value: boolean) => controller.setOpen(value), toggle: () => controller.toggle(), destroy: () => unsubscribe() };
}

export function createPaginationStore(options: PaginationOptions) {
  const page = writable(options.page ?? options.defaultPage ?? 1);
  const controller = createPaginationController({ ...options, page: options.page ?? options.defaultPage ?? 1, onPageChange: (value) => { if (options.page === undefined) page.set(value); options.onPageChange?.(value); } });
  const unsubscribe = page.subscribe((value) => controller.updateOptions({ page: value }));
  return { page, controller, set: (value: number) => controller.setPage(value), next: () => controller.next(), previous: () => controller.previous(), pageItems: () => controller.getPageItems(), destroy: () => unsubscribe() };
}

export function createSliderStore(options: SliderOptions) {
  const initial: SliderValue = options.value ?? options.defaultValue ?? options.min ?? 0;
  const value = writable<SliderValue>(initial);
  const controller = createSliderController({ ...options, value: initial, onValueChange: (next) => { if (options.value === undefined) value.set(next); options.onValueChange?.(next); } });
  const unsubscribe = value.subscribe((next) => controller.updateOptions({ value: next }));
  return { value, controller, set: (next: SliderValue, index?: number) => controller.setValue(next, index), setThumbValue: (index: number, next: number) => controller.setThumbValue(index, next), getThumbProps: controller.getThumbProps.bind(controller), destroy: () => unsubscribe() };
}


/** Convert a Forma-compatible external store into a Svelte readable store. */
export function fromFormaStore<Snapshot>(store: { subscribe(listener: () => void): () => void; getSnapshot(): Snapshot }): Readable<Snapshot> {
  return readable(store.getSnapshot(), (set) => store.subscribe(() => set(store.getSnapshot())));
}

export function createRadioGroupStore(options: RadioGroupOptions = {}) {
  const internalValue = writable(options.value ?? options.defaultValue ?? '');
  const controller = createRadioGroupController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) internalValue.set(next);
      options.onValueChange?.(next);
    },
  });
  const value: Writable<string> = {
    subscribe: internalValue.subscribe,
    set: (next) => controller.select(next),
    update: (fn) => controller.select(fn(controller.value)),
  };
  return {
    value,
    controller,
    select: (next: string) => controller.select(next),
    register: (item: RadioItem) => controller.register(item),
    getRootProps: () => controller.getRootProps(),
    getItemProps: (itemValue: string) => controller.getItemProps(itemValue),
    destroy: () => undefined,
  };
}

export function createListboxStore<T = unknown>(options: ListboxOptions<T>) {
  const initial: ListboxValue =
    options.value ?? options.defaultValue ?? (options.selectionMode === 'multiple' ? [] : '');
  const value = writable<ListboxValue>(initial);
  const revision = writable(0);
  const bump = () => revision.update((n) => n + 1);
  const controller = createListboxController<T>({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) value.set(next);
      bump();
      options.onValueChange?.(next);
    },
  });
  return {
    value: { subscribe: value.subscribe } as Readable<ListboxValue>,
    revision: { subscribe: revision.subscribe } as Readable<number>,
    controller,
    setActiveKey: (key: string) => { controller.setActiveKey(key); bump(); },
    select: (key: string) => { controller.select(key); bump(); },
    selectAll: () => { controller.selectAll(); bump(); },
    getRootProps: (id = 'forma-listbox') => {
      const rootProps = controller.getRootProps(id);
      return {
        ...rootProps,
        onKeyDown: (event: KeyboardEvent) => {
          rootProps.onKeyDown(event);
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
    destroy: () => undefined,
  };
}

export function createTreeViewStore<T = unknown>(options: TreeViewOptions<T>) {
  const expandedKeys = writable<ReadonlySet<string>>(
    new Set(options.expandedKeys ?? options.defaultExpandedKeys ?? []),
  );
  const selectedKeys = writable<ReadonlySet<string>>(
    new Set(options.selectedKeys ?? options.defaultSelectedKeys ?? []),
  );
  const focusedKey = writable<string | undefined>(undefined);
  const controller = createTreeViewController<T>({
    ...options,
    onExpandedChange: (keys) => {
      if (options.expandedKeys === undefined) expandedKeys.set(keys);
      focusedKey.set(controller.focusedKeyValue);
      options.onExpandedChange?.(keys);
    },
    onSelectedChange: (keys) => {
      if (options.selectedKeys === undefined) selectedKeys.set(keys);
      focusedKey.set(controller.focusedKeyValue);
      options.onSelectedChange?.(keys);
    },
  });
  focusedKey.set(controller.focusedKeyValue);
  return {
    expandedKeys: { subscribe: expandedKeys.subscribe } as Readable<ReadonlySet<string>>,
    selectedKeys: { subscribe: selectedKeys.subscribe } as Readable<ReadonlySet<string>>,
    focusedKey: { subscribe: focusedKey.subscribe } as Readable<string | undefined>,
    controller,
    focus: (key: string) => { controller.focus(key); focusedKey.set(controller.focusedKeyValue); },
    toggleExpanded: (key: string) => { controller.toggleExpanded(key); focusedKey.set(controller.focusedKeyValue); },
    select: (key: string, additive?: boolean) => controller.select(key, additive),
    registerItem: (key: string, element: HTMLElement | null) => controller.registerItem(key, element),
    getRootProps: (label?: string) => {
      const rootProps = controller.getRootProps(label);
      return {
        ...rootProps,
        onKeyDown: (event: KeyboardEvent) => {
          rootProps.onKeyDown(event);
          focusedKey.set(controller.focusedKeyValue);
        },
      };
    },
    getItemProps: (key: string) => {
      const itemProps = controller.getItemProps(key);
      return {
        ...itemProps,
        onFocus: () => {
          itemProps.onFocus();
          focusedKey.set(controller.focusedKeyValue);
        },
      };
    },
    destroy: () => controller.destroy(),
  };
}

export function createComboboxStore(options: ComboboxOptions) {
  const internalValue = writable(options.value ?? options.defaultValue ?? '');
  const internalInput = writable(options.inputValue ?? options.defaultInputValue ?? '');
  const internalOpen = writable(options.open ?? options.defaultOpen ?? false);
  const revision = writable(0);
  const bump = () => revision.update((n) => n + 1);
  const controller = createComboboxController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) internalValue.set(next);
      bump();
      options.onValueChange?.(next);
    },
    onInputValueChange: (next) => {
      if (options.inputValue === undefined) internalInput.set(next);
      bump();
      options.onInputValueChange?.(next);
    },
    onOpenChange: (next) => {
      if (options.open === undefined) internalOpen.set(next);
      bump();
      options.onOpenChange?.(next);
    },
  });
  return {
    value: { subscribe: internalValue.subscribe } as Readable<string>,
    inputValue: { subscribe: internalInput.subscribe } as Readable<string>,
    open: { subscribe: internalOpen.subscribe } as Readable<boolean>,
    revision: { subscribe: revision.subscribe } as Readable<number>,
    controller,
    setOpen: (next: boolean) => { controller.setOpen(next); bump(); },
    setInputValue: (next: string) => { controller.setInputValue(next); bump(); },
    select: (next: string) => { controller.select(next); bump(); },
    getInputProps: (listboxId = 'forma-combobox-listbox') => {
      const inputProps = controller.getInputProps(listboxId);
      return {
        ...inputProps,
        onKeyDown: (event: KeyboardEvent) => {
          inputProps.onKeyDown(event);
          bump();
        },
      };
    },
    getListboxProps: (id = 'forma-combobox-listbox') => controller.getListboxProps(id),
    getOptionProps: (option: ComboboxOption, listboxId = 'forma-combobox-listbox') => {
      const optionProps = controller.getOptionProps(option, listboxId);
      return {
        ...optionProps,
        onPointerMove: () => {
          optionProps.onPointerMove();
          bump();
        },
      };
    },
    destroy: () => undefined,
  };
}

export function createNumberFieldStore(options: NumberFieldOptions = {}) {
  const controller = createNumberFieldController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) internalValue.set(next);
      options.onValueChange?.(next);
    },
  });
  const internalValue = writable(controller.value);
  const value: Writable<number> = {
    subscribe: internalValue.subscribe,
    set: (next) => controller.setValue(next),
    update: (fn) => controller.setValue(fn(controller.value)),
  };
  return {
    value,
    controller,
    setValue: (next: number) => controller.setValue(next),
    increment: (multiplier?: number) => controller.increment(multiplier),
    decrement: (multiplier?: number) => controller.decrement(multiplier),
    format: () => controller.format(),
    getInputProps: () => controller.getInputProps(),
    getIncrementButtonProps: () => controller.getIncrementButtonProps(),
    getDecrementButtonProps: () => controller.getDecrementButtonProps(),
    destroy: () => undefined,
  };
}

export function createSearchFieldStore(options: SearchFieldOptions = {}) {
  const controller = createSearchFieldController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) internalValue.set(next);
      options.onValueChange?.(next);
    },
  });
  const internalValue = writable(controller.value);
  const value: Writable<string> = {
    subscribe: internalValue.subscribe,
    set: (next) => controller.setValue(next),
    update: (fn) => controller.setValue(fn(controller.value)),
  };
  return {
    value,
    controller,
    setValue: (next: string) => controller.setValue(next),
    clear: () => controller.clear(),
    submit: () => controller.submit(),
    getInputProps: () => controller.getInputProps(),
    getClearButtonProps: () => controller.getClearButtonProps(),
    destroy: () => undefined,
  };
}

export function createToggleGroupStore(options: ToggleGroupOptions = {}) {
  const value = writable<string | string[]>(
    options.value ?? options.defaultValue ?? (options.type === 'multiple' ? [] : ''),
  );
  const revision = writable(0);
  const bump = () => revision.update((n) => n + 1);
  const controller = createToggleGroupController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) value.set(next);
      bump();
      options.onValueChange?.(next);
    },
  });
  return {
    value: { subscribe: value.subscribe } as Readable<string | string[]>,
    revision: { subscribe: revision.subscribe } as Readable<number>,
    controller,
    toggle: (itemValue: string) => controller.toggle(itemValue),
    register: (item: ToggleItem) => controller.register(item),
    getRootProps: (label?: string) => {
      const rootProps = controller.getRootProps(label);
      return {
        ...rootProps,
        onKeyDown: (event: KeyboardEvent) => {
          rootProps.onKeyDown(event);
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
    destroy: () => undefined,
  };
}

export function createPinInputStore(options: PinInputOptions = {}) {
  const internalValue = writable(options.value ?? options.defaultValue ?? '');
  const focusedIndex = writable(0);
  const controller = createPinInputController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) internalValue.set(next);
      options.onValueChange?.(next);
    },
  });
  const value: Writable<string> = {
    subscribe: internalValue.subscribe,
    set: (next) => controller.setValue(next),
    update: (fn) => controller.setValue(fn(controller.value)),
  };
  return {
    value,
    focusedIndex: { subscribe: focusedIndex.subscribe } as Readable<number>,
    length: controller.length,
    controller,
    setValue: (next: string) => controller.setValue(next),
    paste: (text: string) => controller.paste(text),
    focus: (index: number) => {
      controller.focus(index);
      focusedIndex.set(controller.focusedIndexValue);
    },
    registerInput: (index: number, element: HTMLInputElement | null) =>
      controller.registerInput(index, element),
    getRootProps: () => controller.getRootProps(),
    getInputProps: (index: number) => {
      const inputProps = controller.getInputProps(index);
      return {
        ...inputProps,
        onKeyDown: (event: KeyboardEvent) => {
          inputProps.onKeyDown(event);
          focusedIndex.set(controller.focusedIndexValue);
        },
      };
    },
    destroy: () => controller.destroy(),
  };
}

export function createRatingGroupStore(options: RatingGroupOptions = {}) {
  const controller = createRatingGroupController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) internalValue.set(next);
      revision.update((n) => n + 1);
      options.onValueChange?.(next);
    },
  });
  const internalValue = writable(controller.value);
  const revision = writable(0);
  const value: Writable<number> = {
    subscribe: internalValue.subscribe,
    set: (next) => controller.setValue(next),
    update: (fn) => controller.setValue(fn(controller.value)),
  };
  return {
    value,
    revision: { subscribe: revision.subscribe } as Readable<number>,
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
          revision.update((n) => n + 1);
        },
        onKeyDown: (event: KeyboardEvent) => {
          itemProps.onKeyDown(event);
          revision.update((n) => n + 1);
        },
      };
    },
    destroy: () => undefined,
  };
}

export function createAvatarStore(options: AvatarOptions = {}) {
  const imageState = writable<AvatarImageState>(options.src ? 'loading' : 'empty');
  const controller = createAvatarController({
    ...options,
    onLoad: () => {
      imageState.set(controller.imageState);
      options.onLoad?.();
    },
    onError: () => {
      imageState.set(controller.imageState);
      options.onError?.();
    },
  });
  imageState.set(controller.imageState);
  return {
    imageState: { subscribe: imageState.subscribe } as Readable<AvatarImageState>,
    controller,
    getImageProps: () => controller.getImageProps(),
    getFallbackProps: () => controller.getFallbackProps(),
    destroy: () => undefined,
  };
}

export function createToolbarStore(options: ToolbarOptions = {}) {
  const controller = createToolbarController(options);
  return {
    controller,
    register: (item: { id: string; element: HTMLElement; disabled?: boolean }) =>
      controller.register(item),
    setCurrent: (id: string, focus?: boolean) => controller.setCurrent(id, focus),
    getRootProps: () => controller.getRootProps(),
    destroy: () => undefined,
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
