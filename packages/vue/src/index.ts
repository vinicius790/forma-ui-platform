import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  readonly,
  Teleport,
  watch,
} from 'vue';
import type { PropType, Ref } from 'vue';
import {
  createAccordionController,
  createAvatarController,
  createComboboxController,
  createDialogController,
  createListboxController,
  createMenuController,
  createNumberFieldController,
  createPinInputController,
  createRadioGroupController,
  createRatingGroupController,
  createSearchFieldController,
  createSelectController,
  createTabsController,
  createToastStore,
  createToggleGroupController,
  createToolbarController,
  createTooltipController,
  createTreeViewController,
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

export function useDialog(options: {
  role?: 'dialog' | 'alertdialog';
  defaultOpen?: boolean;
  modal?: boolean;
  closeOnEscape?: boolean;
} = {}) {
  const open = ref(options.defaultOpen ?? false);
  const trigger = ref<HTMLElement | null>(null);
  const content = ref<HTMLElement | null>(null);
  const controller = createDialogController({
    defaultOpen: open.value,
    role: options.role,
    modal: options.modal,
    closeOnEscape: options.closeOnEscape,
    onOpenChange: (value) => { open.value = value; },
  });

  watch(open, (value) => {
    if (value) controller.show();
    else controller.close();
  }, { flush: 'post' });
  watch(content, (element) => controller.setContent(element), { flush: 'post' });
  watch(trigger, (element) => controller.setTrigger(element), { flush: 'post' });
  onBeforeUnmount(() => controller.destroy());

  const setOpen = (value: boolean) => {
    if (value) controller.show();
    else controller.close();
  };
  return {
    open,
    trigger,
    content,
    controller,
    setOpen,
    triggerProps: computed(() => ({
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': open.value,
      onClick: () => setOpen(!open.value),
    })),
    contentProps: computed(() => ({
      role: options.role ?? 'dialog',
      'aria-modal': options.modal === false ? undefined : 'true',
      tabindex: -1,
      'data-state': open.value ? 'open' : 'closed',
    })),
  };
}

export function useAlertDialog(options: {
  defaultOpen?: boolean;
  modal?: boolean;
  closeOnEscape?: boolean;
} = {}) {
  return useDialog({ ...options, role: 'alertdialog', modal: options.modal ?? true });
}

export function useMenu(options: {
  defaultOpen?: boolean;
  direction?: 'ltr' | 'rtl';
  orientation?: 'horizontal' | 'vertical';
} = {}) {
  const open = ref(options.defaultOpen ?? false);
  const trigger = ref<HTMLElement | null>(null);
  const content = ref<HTMLElement | null>(null);
  const controller = createMenuController({
    defaultOpen: open.value,
    direction: options.direction,
    orientation: options.orientation,
    onOpenChange: (value) => { open.value = value; },
  });

  watch(trigger, (element) => controller.setTrigger(element), { flush: 'post' });
  watch(content, (element) => controller.setContent(element), { flush: 'post' });
  watch(open, (value) => value ? controller.openMenu() : controller.close(false), { flush: 'post' });
  onBeforeUnmount(() => controller.destroy());

  return {
    open,
    trigger,
    content,
    controller,
    show: (edge: 'first' | 'last' = 'first') => controller.openMenu(edge),
    hide: () => controller.close(),
    triggerProps: computed(() => ({
      ...controller.getTriggerProps(),
      'aria-expanded': open.value,
    })),
    contentProps: computed(() => controller.getContentProps()),
    getItemProps: controller.getItemProps.bind(controller),
    getCheckboxItemProps: controller.getCheckboxItemProps.bind(controller),
    getRadioItemProps: controller.getRadioItemProps.bind(controller),
    registerItem: controller.registerItem.bind(controller),
  };
}

export function useTabs(options: {
  value?: string;
  defaultValue?: string;
  orientation?: 'horizontal' | 'vertical';
  direction?: 'ltr' | 'rtl';
  activationMode?: 'automatic' | 'manual';
} = {}) {
  const value = ref(options.value ?? options.defaultValue ?? '');
  const controller = createTabsController({
    value: options.value,
    defaultValue: value.value,
    orientation: options.orientation,
    direction: options.direction,
    activationMode: options.activationMode,
    onValueChange: (next) => {
      if (options.value === undefined) value.value = next;
    },
  });
  watch(() => options.value, (next) => {
    if (next !== undefined) value.value = next;
    controller.updateOptions({ value: next });
  });
  watch(value, (next) => {
    if (options.value === undefined) controller.updateOptions({ value: next });
  });
  return {
    value,
    controller,
    select: (next: string) => controller.select(next),
    focus: (next: string) => controller.focus(next),
    register: controller.register.bind(controller),
    getTabProps: controller.getTabProps.bind(controller),
    getPanelProps: controller.getPanelProps.bind(controller),
    onKeyDown: controller.onKeyDown.bind(controller),
  };
}

export function useSelect(options: {
  value?: SelectValue;
  defaultValue?: SelectValue;
  onValueChange?: (value: SelectValue) => void;
  options: SelectOption[];
  disabled?: boolean;
  multiple?: boolean;
}): {
  value: Ref<SelectValue>;
  open: Ref<boolean>;
  trigger: Ref<HTMLElement | null>;
  listbox: Ref<HTMLElement | null>;
  controller: ReturnType<typeof createSelectController>;
  show: () => void;
  hide: () => void;
  select: (value: string) => void;
  getTriggerProps: (listboxId?: string, labelId?: string, describedBy?: string) => ReturnType<ReturnType<typeof createSelectController>['getTriggerProps']>;
  getListboxProps: (id?: string, labelId?: string) => ReturnType<ReturnType<typeof createSelectController>['getListboxProps']>;
  getOptionProps: (option: SelectOption, index: number, listboxId?: string) => ReturnType<ReturnType<typeof createSelectController>['getOptionProps']>;
} {
  const rawInitial: SelectValue = options.value ?? options.defaultValue ?? (options.multiple ? [] : '');
  const initial: SelectValue = options.multiple
    ? Array.isArray(rawInitial) ? rawInitial : rawInitial ? [rawInitial] : []
    : Array.isArray(rawInitial) ? rawInitial[0] ?? '' : rawInitial;
  const value = ref<SelectValue>(initial);
  const open = ref(false);
  const trigger = ref<HTMLElement | null>(null);
  const listbox = ref<HTMLElement | null>(null);
  const controller = createSelectController({
    value: options.value,
    defaultValue: initial,
    multiple: options.multiple,
    options: options.options,
    disabled: options.disabled,
    onOpenChange: (next) => { open.value = next; },
    onValueChange: (next) => {
      if (options.value === undefined) value.value = next;
      options.onValueChange?.(next);
      if (!options.multiple) open.value = false;
    },
  });

  watch(() => options.options, (next) => controller.setOptions(next), { deep: true });
  watch(() => options.value, (next) => {
    if (next === undefined) return;
    const normalized: SelectValue = options.multiple
      ? Array.isArray(next) ? [...new Set(next)] : next ? [next] : []
      : Array.isArray(next) ? next[0] ?? '' : next;
    value.value = normalized;
    controller.updateOptions({ value: normalized });
  });
  watch(open, (next) => next ? controller.show() : controller.hide(), { flush: 'post' });
  watch(value, (next) => {
    if (options.value === undefined) controller.updateOptions({ value: next });
  });
  watch(trigger, (element) => controller.setTrigger(element), { flush: 'post' });
  watch(listbox, (element) => controller.setListbox(element), { flush: 'post' });
  onBeforeUnmount(() => controller.destroy());

  return {
    value,
    open,
    trigger,
    listbox,
    controller,
    show: () => { controller.show(); open.value = controller.open; },
    hide: () => { controller.hide(); open.value = false; },
    select: (next) => controller.select(next),
    getTriggerProps: (listboxId = 'forma-select-listbox', labelId?: string, describedBy?: string) => controller.getTriggerProps(listboxId, labelId, describedBy),
    getListboxProps: (id = 'forma-select-listbox', labelId?: string) => controller.getListboxProps(id, labelId),
    getOptionProps: (option, index, listboxId = 'forma-select-listbox') => controller.getOptionProps(option, index, listboxId),
  };
}

export function useMultiSelect(
  options: Omit<Parameters<typeof useSelect>[0], 'multiple'>,
): Omit<ReturnType<typeof useSelect>, 'value'> & { value: Ref<string[]> } {
  const result = useSelect({ ...options, multiple: true });
  return { ...result, value: result.value as Ref<string[]> };
}

export function useTooltip(options: {
  delayDuration?: number;
  closeDelayDuration?: number;
  disabled?: boolean;
} = {}) {
  const open = ref(false);
  const trigger = ref<HTMLElement | null>(null);
  const content = ref<HTMLElement | null>(null);
  const controller = createTooltipController({
    ...options,
    onOpenChange: (value) => { open.value = value; },
  });
  watch(trigger, (element) => controller.setTrigger(element), { flush: 'post' });
  watch(content, (element) => controller.setContent(element), { flush: 'post' });
  watch(open, (value) => controller.setOpen(value), { flush: 'post' });
  onBeforeUnmount(() => controller.destroy());
  return {
    open, trigger, content, controller,
    getTriggerProps: (id: string) => controller.getTriggerProps(id),
    getContentProps: (id: string) => controller.getContentProps(id),
  };
}

export function useAccordion(options: {
  multiple?: boolean;
  collapsible?: boolean;
  defaultValue?: string | string[];
} = {}) {
  const value = ref(options.defaultValue ?? (options.multiple ? [] : '')) as Ref<string | string[]>;
  const controller = createAccordionController({
    multiple: options.multiple,
    collapsible: options.collapsible,
    defaultValue: value.value,
    onValueChange: (next) => { value.value = next; },
  });
  watch(value, (next) => controller.updateOptions({ value: next }));
  return {
    value,
    controller,
    toggle: (id: string) => controller.toggle(id),
    isOpen: (id: string) => controller.isOpen(id),
    getItemProps: controller.getItemProps.bind(controller),
    register: controller.register.bind(controller),
  };
}

export function useToasts(options: { duration?: number; max?: number } = {}) {
  const store = createToastStore(options);
  const toasts = ref<readonly ToastRecord[]>(store.getSnapshot());
  const unsubscribe = store.subscribe(() => { toasts.value = store.getSnapshot(); });
  onBeforeUnmount(() => {
    unsubscribe();
    store.clear();
  });
  return {
    toasts,
    add: (input: ToastInput) => store.add(input),
    dismiss: (id: string) => store.dismiss(id),
    clear: () => store.clear(),
    pause: (id: string) => store.pause(id),
    resume: (id: string) => store.resume(id),
  };
}

export const FDialog = defineComponent({
  name: 'FDialog',
  props: {
    open: { type: Boolean, default: false },
    role: { type: String as PropType<'dialog' | 'alertdialog'>, default: 'dialog' },
    title: { type: String, default: '' },
    ariaLabel: { type: String, default: '' },
    closeLabel: { type: String, default: 'Close' },
    teleportTo: { type: String, default: 'body' },
    modal: { type: Boolean, default: true },
  },
  emits: ['update:open'],
  setup(props, { slots, emit }) {
    const content = ref<HTMLElement | null>(null);
    const controller = createDialogController({
      defaultOpen: props.open,
      role: props.role,
      modal: props.modal,
      onOpenChange: (value) => emit('update:open', value),
    });

    watch(() => props.open, (value) => {
      if (value) {
        const active = content.value?.ownerDocument.activeElement;
        if (active instanceof HTMLElement && active !== content.value) controller.setTrigger(active);
        controller.show();
      } else controller.close();
    }, { flush: 'post' });
    watch(() => props.modal, (value) => controller.updateOptions({ modal: value }), { flush: 'post' });
    watch(() => props.role, (value) => controller.updateOptions({ role: value }), { flush: 'post' });
    watch(content, (element) => controller.setContent(element), { flush: 'post' });
    onMounted(() => {
      if (props.open) {
        const active = content.value?.ownerDocument.activeElement;
        if (active instanceof HTMLElement && active !== content.value) controller.setTrigger(active);
      }
      controller.setContent(content.value);
    });
    onBeforeUnmount(() => controller.destroy());

    const close = () => controller.close();
    return () => props.open
      ? h(Teleport, { to: props.teleportTo }, [
          h('section', {
            ref: content,
            role: props.role,
            'aria-modal': props.modal ? 'true' : undefined,
            'aria-label': props.title || props.ariaLabel || undefined,
            class: 'forma-dialog',
            tabindex: -1,
            'data-forma-dialog': '',
          }, [
            h('div', {
              class: 'forma-dialog-overlay',
              'data-forma-overlay': '',
              'aria-hidden': 'true',
              onClick: close,
            }),
            props.title ? h('h2', null, props.title) : null,
            slots['default']?.(),
            h('button', { type: 'button', onClick: close }, props.closeLabel),
          ]),
        ])
      : null;
  },
});

export type { SelectOption, SelectValue, ToastInput, ToastRecord };


export function useCheckbox(options: CheckboxOptions = {}) {
  const checked = ref(options.checked ?? options.defaultChecked ?? false);
  const controller = createCheckboxController({ ...options, checked: checked.value, onCheckedChange: (value) => { if (options.checked === undefined) checked.value = value; options.onCheckedChange?.(value); } });
  watch(checked, (value) => controller.updateOptions({ checked: value }), { flush: 'sync' });
  watch(() => options.checked, (value) => { if (value !== undefined) { checked.value = value; controller.updateOptions({ checked: value }); } });
  return { checked, controller, setChecked: (value: boolean | 'indeterminate') => controller.setChecked(value), toggle: () => controller.toggle(), inputProps: computed(() => controller.getInputProps()) };
}

export function useSwitch(options: SwitchOptions = {}) {
  const checked = ref(options.checked ?? options.defaultChecked ?? false);
  const controller = createSwitchController({ ...options, checked: checked.value, onCheckedChange: (value) => { if (options.checked === undefined) checked.value = value; options.onCheckedChange?.(value); } });
  watch(checked, (value) => controller.updateOptions({ checked: value }), { flush: 'sync' });
  watch(() => options.checked, (value) => { if (value !== undefined) { checked.value = value; controller.updateOptions({ checked: value }); } });
  return { checked, controller, setChecked: (value: boolean) => controller.setChecked(value), toggle: () => controller.toggle(), buttonProps: computed(() => controller.getButtonProps()), inputProps: computed(() => controller.getInputProps()) };
}

export function useDisclosure(options: DisclosureOptions = {}) {
  const open = ref(options.open ?? options.defaultOpen ?? false);
  const controller = createDisclosureController({ ...options, open: open.value, onOpenChange: (value) => { if (options.open === undefined) open.value = value; options.onOpenChange?.(value); } });
  watch(open, (value) => controller.updateOptions({ open: value }), { flush: 'sync' });
  watch(() => options.open, (value) => { if (value !== undefined) { open.value = value; controller.updateOptions({ open: value }); } });
  return { open, controller, setOpen: (value: boolean) => controller.setOpen(value), toggle: () => controller.toggle() };
}

export function usePagination(options: PaginationOptions) {
  const page = ref(options.page ?? options.defaultPage ?? 1);
  const controller = createPaginationController({ ...options, page: page.value, onPageChange: (value) => { if (options.page === undefined) page.value = value; options.onPageChange?.(value); } });
  watch(page, (value) => controller.updateOptions({ page: value }), { flush: 'sync' });
  watch(() => options.page, (value) => { if (value !== undefined) { page.value = value; controller.updateOptions({ page: value }); } });
  return { page, controller, pageItems: computed(() => controller.getPageItems()), setPage: (value: number) => controller.setPage(value), next: () => controller.next(), previous: () => controller.previous() };
}

export function useSlider(options: SliderOptions) {
  const value = ref<SliderValue>(options.value ?? options.defaultValue ?? options.min ?? 0);
  const controller = createSliderController({ ...options, value: value.value, onValueChange: (next) => { if (options.value === undefined) value.value = next; options.onValueChange?.(next); } });
  watch(value, (next) => controller.updateOptions({ value: next }), { flush: 'sync' });
  watch(() => options.value, (next) => { if (next !== undefined) { value.value = next; controller.updateOptions({ value: next }); } });
  return { value, controller, values: computed(() => controller.values), setValue: (next: SliderValue, index?: number) => controller.setValue(next, index), setThumbValue: (index: number, next: number) => controller.setThumbValue(index, next), getThumbProps: controller.getThumbProps.bind(controller) };
}


/** Bind a Forma-compatible external store to a Vue shallow ref. */
export function useFormaStore<Snapshot>(store: { subscribe(listener: () => void): () => void; getSnapshot(): Snapshot }): Readonly<Ref<Snapshot>> {
  const state = shallowRef(store.getSnapshot());
  const unsubscribe = store.subscribe(() => { state.value = store.getSnapshot(); });
  onBeforeUnmount(unsubscribe);
  return readonly(state) as Readonly<Ref<Snapshot>>;
}

export function useRadioGroup(options: RadioGroupOptions = {}) {
  const value = ref(options.value ?? options.defaultValue ?? '');
  const controller = createRadioGroupController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) value.value = next;
      options.onValueChange?.(next);
    },
  });
  watch(() => options.value, (next) => { if (next !== undefined) value.value = next; });
  watch(() => options.disabled, (disabled) => controller.updateOptions({ disabled }));
  return {
    value,
    controller,
    select: (next: string) => controller.select(next),
    register: (item: RadioItem) => controller.register(item),
    rootProps: computed(() => {
      void value.value;
      return controller.getRootProps();
    }),
    getItemProps: (itemValue: string) => controller.getItemProps(itemValue),
  };
}

export function useListbox<T = unknown>(options: ListboxOptions<T>) {
  const value = ref<ListboxValue>(
    options.value ?? options.defaultValue ?? (options.selectionMode === 'multiple' ? [] : ''),
  ) as Ref<ListboxValue>;
  const revision = ref(0);
  const bump = () => { revision.value += 1; };
  const controller = createListboxController<T>({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) value.value = next;
      bump();
      options.onValueChange?.(next);
    },
  });
  watch(() => options.value, (next) => {
    if (next !== undefined) {
      value.value = next;
      controller.updateOptions({ value: next });
      bump();
    }
  });
  watch(() => options.options, (next) => {
    controller.updateOptions({ options: next });
    bump();
  });
  return {
    value,
    selectedKeys: computed(() => {
      void revision.value;
      void value.value;
      return controller.selectedKeys;
    }),
    activeOption: computed(() => {
      void revision.value;
      return controller.activeOption;
    }),
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
  };
}

export function useTreeView<T = unknown>(options: TreeViewOptions<T>) {
  const expandedKeys = ref<ReadonlySet<string>>(new Set(options.expandedKeys ?? options.defaultExpandedKeys ?? []));
  const selectedKeys = ref<ReadonlySet<string>>(new Set(options.selectedKeys ?? options.defaultSelectedKeys ?? []));
  const revision = ref(0);
  const bump = () => { revision.value += 1; };
  const controller = createTreeViewController<T>({
    ...options,
    onExpandedChange: (keys) => {
      if (options.expandedKeys === undefined) expandedKeys.value = keys;
      bump();
      options.onExpandedChange?.(keys);
    },
    onSelectedChange: (keys) => {
      if (options.selectedKeys === undefined) selectedKeys.value = keys;
      bump();
      options.onSelectedChange?.(keys);
    },
  });
  watch(() => options.nodes, (nodes) => {
    controller.updateOptions({ nodes });
    bump();
  });
  onBeforeUnmount(() => controller.destroy());
  return {
    expandedKeys,
    selectedKeys,
    visibleNodes: computed(() => {
      void revision.value;
      void expandedKeys.value;
      return controller.visibleNodes;
    }),
    focusedKey: computed(() => {
      void revision.value;
      return controller.focusedKeyValue;
    }),
    controller,
    focus: (key: string) => { controller.focus(key); bump(); },
    toggleExpanded: (key: string) => { controller.toggleExpanded(key); bump(); },
    select: (key: string, additive?: boolean) => { controller.select(key, additive); bump(); },
    registerItem: (key: string, element: HTMLElement | null) => controller.registerItem(key, element),
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
  const value = ref(options.value ?? options.defaultValue ?? '');
  const inputValue = ref(options.inputValue ?? options.defaultInputValue ?? '');
  const open = ref(options.open ?? options.defaultOpen ?? false);
  const revision = ref(0);
  const bump = () => { revision.value += 1; };
  const controller = createComboboxController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) value.value = next;
      bump();
      options.onValueChange?.(next);
    },
    onInputValueChange: (next) => {
      if (options.inputValue === undefined) inputValue.value = next;
      bump();
      options.onInputValueChange?.(next);
    },
    onOpenChange: (next) => {
      if (options.open === undefined) open.value = next;
      bump();
      options.onOpenChange?.(next);
    },
  });
  watch(() => options.options, (next) => {
    controller.updateOptions({ options: next });
    bump();
  });
  return {
    value,
    inputValue,
    open,
    activeOption: computed(() => {
      void revision.value;
      return controller.activeOption;
    }),
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
  };
}

export function useNumberField(options: NumberFieldOptions = {}) {
  const value = ref(options.value ?? options.defaultValue ?? options.min ?? 0);
  const controller = createNumberFieldController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) value.value = next;
      options.onValueChange?.(next);
    },
  });
  watch(() => options.value, (next) => {
    if (next !== undefined) {
      value.value = next;
      controller.updateOptions({ value: next });
    }
  });
  return {
    value,
    formattedValue: computed(() => {
      void value.value;
      return controller.format();
    }),
    controller,
    setValue: (next: number) => controller.setValue(next),
    increment: (multiplier?: number) => controller.increment(multiplier),
    decrement: (multiplier?: number) => controller.decrement(multiplier),
    inputProps: computed(() => {
      void value.value;
      return controller.getInputProps();
    }),
    incrementButtonProps: computed(() => {
      void value.value;
      return controller.getIncrementButtonProps();
    }),
    decrementButtonProps: computed(() => {
      void value.value;
      return controller.getDecrementButtonProps();
    }),
  };
}

export function useSearchField(options: SearchFieldOptions = {}) {
  const value = ref(options.value ?? options.defaultValue ?? '');
  const controller = createSearchFieldController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) value.value = next;
      options.onValueChange?.(next);
    },
  });
  watch(() => options.value, (next) => {
    if (next !== undefined) {
      value.value = next;
      controller.updateOptions({ value: next });
    }
  });
  return {
    value,
    controller,
    setValue: (next: string) => controller.setValue(next),
    clear: () => controller.clear(),
    submit: () => controller.submit(),
    inputProps: computed(() => {
      void value.value;
      return controller.getInputProps();
    }),
    clearButtonProps: computed(() => {
      void value.value;
      return controller.getClearButtonProps();
    }),
  };
}

export function useToggleGroup(options: ToggleGroupOptions = {}) {
  const value = ref<string | string[]>(
    options.value ?? options.defaultValue ?? (options.type === 'multiple' ? [] : ''),
  ) as Ref<string | string[]>;
  const revision = ref(0);
  const bump = () => { revision.value += 1; };
  const controller = createToggleGroupController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) value.value = next;
      bump();
      options.onValueChange?.(next);
    },
  });
  watch(() => options.value, (next) => {
    if (next !== undefined) {
      value.value = next;
      controller.updateOptions({ value: next });
      bump();
    }
  });
  return {
    value,
    controller,
    toggle: (itemValue: string) => controller.toggle(itemValue),
    register: (item: ToggleItem) => controller.register(item),
    getRootProps: (label?: string) => {
      void revision.value;
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
      void revision.value;
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
  const value = ref(options.value ?? options.defaultValue ?? '');
  const revision = ref(0);
  const bump = () => { revision.value += 1; };
  const controller = createPinInputController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) value.value = next;
      bump();
      options.onValueChange?.(next);
    },
  });
  onBeforeUnmount(() => controller.destroy());
  return {
    value,
    length: controller.length,
    focusedIndex: computed(() => {
      void revision.value;
      return controller.focusedIndexValue;
    }),
    controller,
    setValue: (next: string) => controller.setValue(next),
    paste: (text: string) => controller.paste(text),
    focus: (index: number) => { controller.focus(index); bump(); },
    registerInput: (index: number, element: HTMLInputElement | null) =>
      controller.registerInput(index, element),
    rootProps: computed(() => controller.getRootProps()),
    getInputProps: (index: number) => {
      const inputProps = controller.getInputProps(index);
      return {
        ...inputProps,
        onKeyDown: (event: KeyboardEvent) => {
          inputProps.onKeyDown(event);
          bump();
        },
      };
    },
  };
}

export function useRatingGroup(options: RatingGroupOptions = {}) {
  const value = ref(options.value ?? options.defaultValue ?? 0);
  const revision = ref(0);
  const bump = () => { revision.value += 1; };
  const controller = createRatingGroupController({
    ...options,
    onValueChange: (next) => {
      if (options.value === undefined) value.value = next;
      bump();
      options.onValueChange?.(next);
    },
  });
  return {
    value,
    count: controller.count,
    controller,
    setValue: (next: number) => controller.setValue(next),
    getRootProps: (label?: string) => controller.getRootProps(label),
    getItemProps: (itemValue: number) => {
      void revision.value;
      const itemProps = controller.getItemProps(itemValue);
      return {
        ...itemProps,
        onFocus: () => {
          itemProps.onFocus();
          bump();
        },
        onKeyDown: (event: KeyboardEvent) => {
          itemProps.onKeyDown(event);
          bump();
        },
      };
    },
  };
}

export function useAvatar(options: AvatarOptions = {}) {
  const imageState = ref<AvatarImageState>(options.src ? 'loading' : 'empty');
  const controller = createAvatarController({
    ...options,
    onLoad: () => {
      imageState.value = controller.imageState;
      options.onLoad?.();
    },
    onError: () => {
      imageState.value = controller.imageState;
      options.onError?.();
    },
  });
  imageState.value = controller.imageState;
  return {
    imageState,
    controller,
    imageProps: computed(() => {
      void imageState.value;
      return controller.getImageProps();
    }),
    fallbackProps: computed(() => {
      void imageState.value;
      return controller.getFallbackProps();
    }),
  };
}

export function useToolbar(options: ToolbarOptions = {}) {
  const controller = createToolbarController(options);
  return {
    controller,
    register: (item: { id: string; element: HTMLElement; disabled?: boolean }) =>
      controller.register(item),
    setCurrent: (id: string, focus?: boolean) => controller.setCurrent(id, focus),
    rootProps: computed(() => controller.getRootProps()),
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
