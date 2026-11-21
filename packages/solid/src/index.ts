import { createSignal, onCleanup, type Accessor, type Setter } from 'solid-js';
import {
  createAccordionController,
  createAlertDialogController,
  createAvatarController,
  createCheckboxController,
  createComboboxController,
  createDialogController,
  createDisclosureController,
  createListboxController,
  createMenuController,
  createNumberFieldController,
  createPaginationController,
  createPinInputController,
  createRadioGroupController,
  createRatingGroupController,
  createSearchFieldController,
  createSelectController,
  createSliderController,
  createSwitchController,
  createTabsController,
  createToastStore,
  createToggleGroupController,
  createToolbarController,
  createTooltipController,
  createTreeViewController,
} from '@forma-ui/core';
import type { AccordionOptions } from '@forma-ui/core/components/accordion';
import type { AvatarImageState, AvatarOptions } from '@forma-ui/core/components/avatar';
import type { CheckboxOptions } from '@forma-ui/core/components/checkbox';
import type { ComboboxOption, ComboboxOptions } from '@forma-ui/core/components/combobox';
import type { DialogOptions } from '@forma-ui/core/components/dialog';
import type { DisclosureOptions } from '@forma-ui/core/components/disclosure';
import type { ListboxOptions, ListboxValue } from '@forma-ui/core/components/listbox';
import type { MenuOptions } from '@forma-ui/core/components/menu';
import type { NumberFieldOptions } from '@forma-ui/core/components/number-field';
import type { PaginationOptions } from '@forma-ui/core/components/pagination';
import type { PinInputOptions } from '@forma-ui/core/components/pin-input';
import type { RadioGroupOptions, RadioItem } from '@forma-ui/core/components/radio-group';
import type { RatingGroupOptions } from '@forma-ui/core/components/rating-group';
import type { SearchFieldOptions } from '@forma-ui/core/components/search-field';
import type { SelectOption, SelectOptions, SelectValue } from '@forma-ui/core/components/select';
import type { SliderOptions, SliderValue } from '@forma-ui/core/components/slider';
import type { SwitchOptions } from '@forma-ui/core/components/switch';
import type { TabsOptions } from '@forma-ui/core/components/tabs';
import type { ToastInput, ToastRecord } from '@forma-ui/core/components/toast';
import type { ToggleGroupOptions, ToggleItem } from '@forma-ui/core/components/toggle-group';
import type { ToolbarOptions } from '@forma-ui/core/components/toolbar';
import type { TooltipOptions } from '@forma-ui/core/components/tooltip';
import type { TreeViewOptions } from '@forma-ui/core/components/tree-view';

export interface SolidBinding<T> { value: Accessor<T>; setValue: Setter<T>; destroy: () => void }
function bind<T>(initial: T, destroy?: () => void): SolidBinding<T> { const [value, setValue] = createSignal(initial); let disposed = false; const cleanup = () => { if (disposed) return; disposed = true; destroy?.(); }; onCleanup(cleanup); return { value, setValue, destroy: cleanup }; }

export function createCheckbox(options: CheckboxOptions = {}) {
  let state: SolidBinding<boolean | 'indeterminate'> | undefined;
  const controller = createCheckboxController({ ...options, onCheckedChange: (next) => { state?.setValue(next); options.onCheckedChange?.(next); } });
  state = bind(controller.checked);
  return { ...state!, controller, toggle: () => controller.toggle(), setChecked: (value: boolean | 'indeterminate') => controller.setChecked(value), inputProps: () => controller.getInputProps() };
}
export function createSwitch(options: SwitchOptions = {}) {
  let state: SolidBinding<boolean> | undefined;
  const controller = createSwitchController({ ...options, onCheckedChange: (next) => { state?.setValue(next); options.onCheckedChange?.(next); } });
  state = bind(controller.checked);
  return { ...state!, controller, toggle: () => controller.toggle(), setChecked: (value: boolean) => controller.setChecked(value), buttonProps: () => controller.getButtonProps() };
}
export function createDisclosure(options: DisclosureOptions = {}) {
  let state: SolidBinding<boolean> | undefined;
  const controller = createDisclosureController({ ...options, onOpenChange: (next) => { state?.setValue(next); options.onOpenChange?.(next); } });
  state = bind(controller.open);
  return { ...state!, controller, toggle: () => controller.toggle(), setOpen: (value: boolean) => controller.setOpen(value) };
}
export function createPagination(options: PaginationOptions) {
  let state: SolidBinding<number> | undefined;
  const controller = createPaginationController({ ...options, onPageChange: (next) => { state?.setValue(next); options.onPageChange?.(next); } });
  state = bind(controller.page);
  return { ...state!, controller, setPage: (page: number) => controller.setPage(page), next: () => controller.next(), previous: () => controller.previous(), items: () => controller.getPageItems() };
}
export function createSlider(options: SliderOptions) {
  let state: SolidBinding<SliderValue> | undefined;
  const controller = createSliderController({ ...options, onValueChange: (next) => { state?.setValue(next); options.onValueChange?.(next); } });
  state = bind<SliderValue>(controller.value);
  return { ...state!, controller, setValue: (value: SliderValue) => controller.setValue(value), setThumbValue: (index: number, value: number) => controller.setThumbValue(index, value) };
}


/** Bind a Forma-compatible external store to a Solid accessor in the current owner scope. */
export function fromFormaStore<Snapshot>(store: { subscribe(listener: () => void): () => void; getSnapshot(): Snapshot }): Accessor<Snapshot> {
  const [value, setValue] = createSignal(store.getSnapshot());
  const unsubscribe = store.subscribe(() => setValue(() => store.getSnapshot()));
  onCleanup(unsubscribe);
  return value;
}

function bindDialog(
  controllerFactory: (onOpenChange: (open: boolean) => void) => ReturnType<typeof createDialogController>,
  onOpenChange?: (open: boolean) => void,
) {
  let state: SolidBinding<boolean> | undefined;
  const controller = controllerFactory((next) => {
    state?.setValue(() => next);
    onOpenChange?.(next);
  });
  state = bind(controller.open, () => controller.destroy());
  return {
    open: state.value,
    value: state.value,
    controller,
    destroy: state.destroy,
    show: () => controller.show(),
    close: (restoreFocus?: boolean) => controller.close(restoreFocus),
    setOpen: (open: boolean) => controller.setOpen(open),
    setTrigger: (element: HTMLElement | null) => controller.setTrigger(element),
    setContent: (element: HTMLElement | null) => controller.setContent(element),
    getTriggerProps: (contentId?: string) => controller.getTriggerProps(contentId),
    getContentProps: (titleId?: string, descriptionId?: string) =>
      controller.getContentProps(titleId, descriptionId),
  };
}

export function createDialog(options: DialogOptions = {}) {
  return bindDialog(
    (onOpenChange) => createDialogController({ ...options, onOpenChange }),
    options.onOpenChange,
  );
}

export function createAlertDialog(options: Omit<DialogOptions, 'role'> = {}) {
  return bindDialog(
    (onOpenChange) => createAlertDialogController({ ...options, onOpenChange }),
    options.onOpenChange,
  );
}

export function createMenu(options: MenuOptions = {}) {
  let state: SolidBinding<boolean> | undefined;
  const controller = createMenuController({
    ...options,
    onOpenChange: (next) => { state?.setValue(() => next); options.onOpenChange?.(next); },
  });
  state = bind(controller.open, () => controller.destroy());
  return {
    open: state.value,
    controller,
    destroy: state.destroy,
    openMenu: (edge?: 'first' | 'last') => controller.openMenu(edge),
    close: (restoreFocus?: boolean) => controller.close(restoreFocus),
    setTrigger: (element: HTMLElement | null) => controller.setTrigger(element),
    setContent: (element: HTMLElement | null) => controller.setContent(element),
    registerItem: controller.registerItem.bind(controller),
    getTriggerProps: (contentId?: string) => controller.getTriggerProps(contentId),
    getContentProps: () => controller.getContentProps(),
    getItemProps: controller.getItemProps.bind(controller),
  };
}

export function createTabs(options: TabsOptions = {}) {
  let state: SolidBinding<string> | undefined;
  const controller = createTabsController({
    ...options,
    onValueChange: (next) => { state?.setValue(() => next); options.onValueChange?.(next); },
  });
  state = bind(controller.value);
  return {
    value: state.value,
    controller,
    destroy: state.destroy,
    select: (value: string) => controller.select(value),
    focus: (value: string) => controller.focus(value),
    register: controller.register.bind(controller),
    getTabProps: controller.getTabProps.bind(controller),
    getPanelProps: controller.getPanelProps.bind(controller),
  };
}

export function createTooltip(options: TooltipOptions = {}) {
  let state: SolidBinding<boolean> | undefined;
  const controller = createTooltipController({
    ...options,
    onOpenChange: (next) => { state?.setValue(() => next); options.onOpenChange?.(next); },
  });
  state = bind(controller.open, () => controller.destroy());
  return {
    open: state.value,
    controller,
    destroy: state.destroy,
    setOpen: (open: boolean) => controller.setOpen(open),
    setTrigger: (element: HTMLElement | null) => controller.setTrigger(element),
    setContent: (element: HTMLElement | null) => controller.setContent(element),
    getTriggerProps: (id: string) => controller.getTriggerProps(id),
    getContentProps: (id: string) => controller.getContentProps(id),
  };
}

export function createSelect(options: SelectOptions = {}) {
  let valueState: SolidBinding<SelectValue> | undefined;
  let openState: SolidBinding<boolean> | undefined;
  const controller = createSelectController({
    ...options,
    onValueChange: (next) => { valueState?.setValue(() => next); options.onValueChange?.(next); },
    onOpenChange: (next) => { openState?.setValue(() => next); options.onOpenChange?.(next); },
  });
  valueState = bind<SelectValue>(controller.value, () => controller.destroy());
  openState = bind(controller.open);
  return {
    value: valueState.value,
    open: openState.value,
    controller,
    destroy: valueState.destroy,
    show: () => controller.show(),
    hide: () => controller.hide(),
    select: (value: string) => controller.select(value),
    setTrigger: (element: HTMLElement | null) => controller.setTrigger(element),
    setListbox: (element: HTMLElement | null) => controller.setListbox(element),
    getTriggerProps: (listboxId: string, labelId?: string, describedBy?: string) =>
      controller.getTriggerProps(listboxId, labelId, describedBy),
    getListboxProps: (id: string, labelId?: string) => controller.getListboxProps(id, labelId),
    getOptionProps: (option: SelectOption, index: number, listboxId?: string) =>
      controller.getOptionProps(option, index, listboxId),
  };
}

export function createMultiSelect(options: Omit<SelectOptions, 'multiple'> = {}) {
  const result = createSelect({ ...options, multiple: true });
  return {
    ...result,
    value: result.value as Accessor<string[]>,
  };
}

export function createCombobox(options: ComboboxOptions) {
  let valueState: SolidBinding<string> | undefined;
  let inputState: SolidBinding<string> | undefined;
  let openState: SolidBinding<boolean> | undefined;
  const [revision, setRevision] = createSignal(0);
  const bump = () => setRevision((n) => n + 1);
  const controller = createComboboxController({
    ...options,
    onValueChange: (next) => { valueState?.setValue(() => next); bump(); options.onValueChange?.(next); },
    onInputValueChange: (next) => { inputState?.setValue(() => next); bump(); options.onInputValueChange?.(next); },
    onOpenChange: (next) => { openState?.setValue(() => next); bump(); options.onOpenChange?.(next); },
  });
  valueState = bind(controller.value);
  inputState = bind(controller.inputValue);
  openState = bind(controller.open);
  return {
    value: valueState.value,
    inputValue: inputState.value,
    open: openState.value,
    revision,
    activeOption: () => { revision(); return controller.activeOption; },
    controller,
    destroy: valueState.destroy,
    setOpen: (next: boolean) => { controller.setOpen(next); bump(); },
    setInputValue: (next: string) => { controller.setInputValue(next); bump(); },
    select: (next: string) => { controller.select(next); bump(); },
    getInputProps: (listboxId = 'forma-combobox-listbox') => {
      const inputProps = controller.getInputProps(listboxId);
      return {
        ...inputProps,
        onKeyDown: (event: KeyboardEvent) => { inputProps.onKeyDown(event); bump(); },
      };
    },
    getListboxProps: (id = 'forma-combobox-listbox') => controller.getListboxProps(id),
    getOptionProps: (option: ComboboxOption, listboxId = 'forma-combobox-listbox') => {
      const optionProps = controller.getOptionProps(option, listboxId);
      return {
        ...optionProps,
        onPointerMove: () => { optionProps.onPointerMove(); bump(); },
      };
    },
  };
}

export function createAccordion(options: AccordionOptions = {}) {
  let state: SolidBinding<string | string[]> | undefined;
  const controller = createAccordionController({
    ...options,
    onValueChange: (next) => { state?.setValue(() => next); options.onValueChange?.(next); },
  });
  state = bind<string | string[]>(controller.value);
  return {
    value: state.value,
    controller,
    destroy: state.destroy,
    toggle: (value: string) => controller.toggle(value),
    isOpen: (value: string) => controller.isOpen(value),
    register: (value: string, disabled?: boolean) => controller.register(value, disabled),
    getItemProps: (value: string) => controller.getItemProps(value),
  };
}

export function createToasts(options: { duration?: number; max?: number } = {}) {
  const store = createToastStore(options);
  const toasts = fromFormaStore<readonly ToastRecord[]>(store);
  onCleanup(() => store.clear());
  return {
    toasts,
    store,
    add: (input: ToastInput) => store.add(input),
    update: (id: string, patch: Partial<ToastInput>) => store.update(id, patch),
    dismiss: (id: string) => store.dismiss(id),
    clear: () => store.clear(),
    pause: (id: string) => store.pause(id),
    resume: (id: string) => store.resume(id),
  };
}

export function createListbox<T = unknown>(options: ListboxOptions<T>) {
  let state: SolidBinding<ListboxValue> | undefined;
  const [revision, setRevision] = createSignal(0);
  const bump = () => setRevision((n) => n + 1);
  const controller = createListboxController<T>({
    ...options,
    onValueChange: (next) => { state?.setValue(() => next); bump(); options.onValueChange?.(next); },
  });
  const initial: ListboxValue =
    controller.mode === 'multiple' ? controller.selectedKeys : controller.selectedKeys[0] ?? '';
  state = bind<ListboxValue>(initial);
  return {
    value: state.value,
    revision,
    selectedKeys: () => { state.value(); return controller.selectedKeys; },
    activeOption: () => { revision(); return controller.activeOption; },
    controller,
    destroy: state.destroy,
    setActiveKey: (key: string) => { controller.setActiveKey(key); bump(); },
    select: (key: string) => { controller.select(key); bump(); },
    selectAll: () => { controller.selectAll(); bump(); },
    getRootProps: (id = 'forma-listbox') => {
      const rootProps = controller.getRootProps(id);
      return {
        ...rootProps,
        onKeyDown: (event: KeyboardEvent) => { rootProps.onKeyDown(event); bump(); },
      };
    },
    getOptionProps: (key: string) => {
      const itemProps = controller.getOptionProps(key);
      return {
        ...itemProps,
        onPointerMove: () => { itemProps.onPointerMove(); bump(); },
        onClick: () => { itemProps.onClick(); bump(); },
      };
    },
  };
}

export function createTreeView<T = unknown>(options: TreeViewOptions<T>) {
  let expandedState: SolidBinding<ReadonlySet<string>> | undefined;
  let selectedState: SolidBinding<ReadonlySet<string>> | undefined;
  const [focusedKey, setFocusedKey] = createSignal<string | undefined>(undefined);
  const controller = createTreeViewController<T>({
    ...options,
    onExpandedChange: (keys) => {
      expandedState?.setValue(() => keys);
      setFocusedKey(() => controller.focusedKeyValue);
      options.onExpandedChange?.(keys);
    },
    onSelectedChange: (keys) => {
      selectedState?.setValue(() => keys);
      setFocusedKey(() => controller.focusedKeyValue);
      options.onSelectedChange?.(keys);
    },
  });
  expandedState = bind(controller.expandedKeys, () => controller.destroy());
  selectedState = bind(controller.selectedKeys);
  setFocusedKey(() => controller.focusedKeyValue);
  return {
    expandedKeys: expandedState.value,
    selectedKeys: selectedState.value,
    focusedKey,
    visibleNodes: () => { expandedState.value(); return controller.visibleNodes; },
    controller,
    destroy: expandedState.destroy,
    focus: (key: string) => { controller.focus(key); setFocusedKey(() => controller.focusedKeyValue); },
    toggleExpanded: (key: string) => {
      controller.toggleExpanded(key);
      setFocusedKey(() => controller.focusedKeyValue);
    },
    select: (key: string, additive?: boolean) => controller.select(key, additive),
    registerItem: (key: string, element: HTMLElement | null) =>
      controller.registerItem(key, element),
    getRootProps: (label?: string) => {
      const rootProps = controller.getRootProps(label);
      return {
        ...rootProps,
        onKeyDown: (event: KeyboardEvent) => {
          rootProps.onKeyDown(event);
          setFocusedKey(() => controller.focusedKeyValue);
        },
      };
    },
    getItemProps: (key: string) => {
      const itemProps = controller.getItemProps(key);
      return {
        ...itemProps,
        onFocus: () => {
          itemProps.onFocus();
          setFocusedKey(() => controller.focusedKeyValue);
        },
      };
    },
  };
}

export function createNumberField(options: NumberFieldOptions = {}) {
  let state: SolidBinding<number> | undefined;
  const controller = createNumberFieldController({
    ...options,
    onValueChange: (next) => { state?.setValue(() => next); options.onValueChange?.(next); },
  });
  state = bind(controller.value);
  return {
    value: state.value,
    controller,
    destroy: state.destroy,
    setValue: (next: number) => controller.setValue(next),
    increment: (multiplier?: number) => controller.increment(multiplier),
    decrement: (multiplier?: number) => controller.decrement(multiplier),
    format: () => controller.format(),
    getInputProps: () => controller.getInputProps(),
    getIncrementButtonProps: () => controller.getIncrementButtonProps(),
    getDecrementButtonProps: () => controller.getDecrementButtonProps(),
  };
}

export function createSearchField(options: SearchFieldOptions = {}) {
  let state: SolidBinding<string> | undefined;
  const controller = createSearchFieldController({
    ...options,
    onValueChange: (next) => { state?.setValue(() => next); options.onValueChange?.(next); },
  });
  state = bind(controller.value);
  return {
    value: state.value,
    controller,
    destroy: state.destroy,
    setValue: (next: string) => controller.setValue(next),
    clear: () => controller.clear(),
    submit: () => controller.submit(),
    getInputProps: () => controller.getInputProps(),
    getClearButtonProps: () => controller.getClearButtonProps(),
  };
}

export function createToggleGroup(options: ToggleGroupOptions = {}) {
  let state: SolidBinding<string | string[]> | undefined;
  const [revision, setRevision] = createSignal(0);
  const bump = () => setRevision((n) => n + 1);
  const controller = createToggleGroupController({
    ...options,
    onValueChange: (next) => { state?.setValue(() => next); bump(); options.onValueChange?.(next); },
  });
  state = bind<string | string[]>(controller.value);
  return {
    value: state.value,
    revision,
    controller,
    destroy: state.destroy,
    toggle: (itemValue: string) => controller.toggle(itemValue),
    register: (item: ToggleItem) => controller.register(item),
    getRootProps: (label?: string) => {
      const rootProps = controller.getRootProps(label);
      return {
        ...rootProps,
        onKeyDown: (event: KeyboardEvent) => { rootProps.onKeyDown(event); bump(); },
      };
    },
    getItemProps: (itemValue: string) => {
      const itemProps = controller.getItemProps(itemValue);
      return {
        ...itemProps,
        onFocus: () => { itemProps.onFocus(); bump(); },
      };
    },
  };
}

export function createRadioGroup(options: RadioGroupOptions = {}) {
  let state: SolidBinding<string> | undefined;
  const controller = createRadioGroupController({
    ...options,
    onValueChange: (next) => { state?.setValue(() => next); options.onValueChange?.(next); },
  });
  state = bind(controller.value);
  return {
    value: state.value,
    controller,
    destroy: state.destroy,
    select: (next: string) => controller.select(next),
    register: (item: RadioItem) => controller.register(item),
    getRootProps: () => controller.getRootProps(),
    getItemProps: (itemValue: string) => controller.getItemProps(itemValue),
  };
}

export function createPinInput(options: PinInputOptions = {}) {
  let state: SolidBinding<string> | undefined;
  const [focusedIndex, setFocusedIndex] = createSignal(0);
  const controller = createPinInputController({
    ...options,
    onValueChange: (next) => { state?.setValue(() => next); options.onValueChange?.(next); },
  });
  state = bind(controller.value, () => controller.destroy());
  return {
    value: state.value,
    focusedIndex,
    length: controller.length,
    controller,
    destroy: state.destroy,
    setValue: (next: string) => controller.setValue(next),
    paste: (text: string) => controller.paste(text),
    focus: (index: number) => {
      controller.focus(index);
      setFocusedIndex(() => controller.focusedIndexValue);
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
          setFocusedIndex(() => controller.focusedIndexValue);
        },
      };
    },
  };
}

export function createRatingGroup(options: RatingGroupOptions = {}) {
  let state: SolidBinding<number> | undefined;
  const [revision, setRevision] = createSignal(0);
  const bump = () => setRevision((n) => n + 1);
  const controller = createRatingGroupController({
    ...options,
    onValueChange: (next) => { state?.setValue(() => next); bump(); options.onValueChange?.(next); },
  });
  state = bind(controller.value);
  return {
    value: state.value,
    revision,
    count: controller.count,
    controller,
    destroy: state.destroy,
    setValue: (next: number) => controller.setValue(next),
    getRootProps: (label?: string) => controller.getRootProps(label),
    getItemProps: (itemValue: number) => {
      const itemProps = controller.getItemProps(itemValue);
      return {
        ...itemProps,
        onFocus: () => { itemProps.onFocus(); bump(); },
        onKeyDown: (event: KeyboardEvent) => { itemProps.onKeyDown(event); bump(); },
      };
    },
  };
}

export function createAvatar(options: AvatarOptions = {}) {
  let state: SolidBinding<AvatarImageState> | undefined;
  const controller = createAvatarController({
    ...options,
    onLoad: () => { state?.setValue(() => controller.imageState); options.onLoad?.(); },
    onError: () => { state?.setValue(() => controller.imageState); options.onError?.(); },
  });
  state = bind<AvatarImageState>(controller.imageState);
  return {
    imageState: state.value,
    controller,
    destroy: state.destroy,
    getImageProps: () => controller.getImageProps(),
    getFallbackProps: () => controller.getFallbackProps(),
  };
}

export function createToolbar(options: ToolbarOptions = {}) {
  const controller = createToolbarController(options);
  return {
    controller,
    register: (item: { id: string; element: HTMLElement; disabled?: boolean }) =>
      controller.register(item),
    setCurrent: (id: string, focus?: boolean) => controller.setCurrent(id, focus),
    getRootProps: () => controller.getRootProps(),
  };
}

export * from './overlays-and-layout';
export * from './inputs-and-navigation';
export * from './enterprise-and-boards';
export * from './workbench-and-media';
