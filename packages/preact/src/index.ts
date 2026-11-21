import { useCallback, useEffect, useReducer, useRef } from 'preact/hooks';
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
  type AccordionController,
  type AccordionOptions,
  type AvatarController,
  type AvatarOptions,
  type CheckboxController,
  type CheckboxOptions,
  type ComboboxController,
  type ComboboxOptions,
  type DialogController,
  type DialogOptions,
  type DisclosureController,
  type DisclosureOptions,
  type ListboxController,
  type ListboxOptions,
  type MenuController,
  type MenuOptions,
  type NumberFieldController,
  type NumberFieldOptions,
  type PaginationController,
  type PaginationOptions,
  type PinInputController,
  type PinInputOptions,
  type RadioGroupController,
  type RadioGroupOptions,
  type RatingGroupController,
  type RatingGroupOptions,
  type SearchFieldController,
  type SearchFieldOptions,
  type SelectController,
  type SelectOptions,
  type SliderController,
  type SliderOptions,
  type SwitchController,
  type SwitchOptions,
  type TabsController,
  type TabsOptions,
  type ToastInput,
  type ToastRecord,
  type ToggleGroupController,
  type ToggleGroupOptions,
  type ToolbarController,
  type ToolbarOptions,
  type TooltipController,
  type TooltipOptions,
  type TreeViewController,
  type TreeViewOptions,
} from '@forma-ui/core';

function useRevision(): () => void {
  const [, dispatch] = useReducer((revision: number) => revision + 1, 0);
  return useCallback(() => dispatch(undefined), []);
}

function useDispose(controller: object): void {
  useEffect(() => () => (controller as { destroy?: () => void }).destroy?.(), [controller]);
}

export interface PreactBinding<T> { controller: T; revision: number; notify: () => void }

/**
 * Framework bridge for user-defined core controllers. The factory receives a
 * notify callback; call it from controller callbacks whenever render state changes.
 */
export function useFormaController<T extends object>(
  factory: (notify: () => void) => T,
): PreactBinding<T> {
  const dispatchRevision = useRevision();
  const revision = useRef(0);
  const controllerRef = useRef<T | null>(null);
  const callbackRef = useRef(dispatchRevision);
  callbackRef.current = dispatchRevision;
  const notify = () => { revision.current += 1; callbackRef.current(); };
  if (!controllerRef.current) controllerRef.current = factory(notify);
  useDispose(controllerRef.current);
  return { controller: controllerRef.current, revision: revision.current, notify };
}

function useCallbackController<
  Opts extends object,
  Ctrl extends { updateOptions(patch: Partial<Opts>): void },
>(
  factory: (options: Opts) => Ctrl,
  options: Opts,
  callbackKeys: ReadonlyArray<keyof Opts>,
): PreactBinding<Ctrl> {
  const callbacksRef = useRef<Partial<Opts>>({});
  for (const key of callbackKeys) {
    callbacksRef.current[key] = options[key];
  }
  const wrapOptions = (notify: () => void): Opts => {
    const wrapped = { ...options };
    for (const key of callbackKeys) {
      wrapped[key] = ((...args: unknown[]) => {
        notify();
        const fn = callbacksRef.current[key] as ((...innerArgs: unknown[]) => void) | undefined;
        fn?.(...args);
      }) as Opts[keyof Opts];
    }
    return wrapped;
  };
  const binding = useFormaController((notify) => factory(wrapOptions(notify)));
  binding.controller.updateOptions(wrapOptions(binding.notify) as Partial<Opts>);
  return binding;
}

export function useCheckbox(options: CheckboxOptions = {}): PreactBinding<CheckboxController> {
  return useCallbackController(createCheckboxController, options, ['onCheckedChange']);
}

export function useListbox<T = unknown>(
  options: ListboxOptions<T>,
): PreactBinding<ListboxController<T>> {
  return useCallbackController(createListboxController<T>, options, ['onValueChange']);
}

export function useNumberField(
  options: NumberFieldOptions = {},
): PreactBinding<NumberFieldController> {
  return useCallbackController(createNumberFieldController, options, ['onValueChange']);
}

export function useSearchField(
  options: SearchFieldOptions = {},
): PreactBinding<SearchFieldController> {
  return useCallbackController(createSearchFieldController, options, ['onValueChange']);
}

export function useToggleGroup(
  options: ToggleGroupOptions = {},
): PreactBinding<ToggleGroupController> {
  return useCallbackController(createToggleGroupController, options, ['onValueChange']);
}

export function useTreeView<T = unknown>(
  options: TreeViewOptions<T>,
): PreactBinding<TreeViewController<T>> {
  return useCallbackController(createTreeViewController<T>, options, [
    'onExpandedChange',
    'onSelectedChange',
  ]);
}

export interface FormaPreactExternalStore<Snapshot> {
  subscribe(listener: () => void): () => void;
  getSnapshot(): Snapshot;
}

export function useFormaStore<Snapshot>(store: FormaPreactExternalStore<Snapshot>): Snapshot {
  const bump = useRevision();
  useEffect(() => store.subscribe(() => bump()), [store, bump]);
  return store.getSnapshot();
}

export function useDialog(options: DialogOptions = {}): PreactBinding<DialogController> & {
  open: boolean;
  show: () => void;
  close: (restoreFocus?: boolean) => void;
} {
  const binding = useCallbackController(createDialogController, options, ['onOpenChange']);
  return {
    ...binding,
    open: binding.controller.open,
    show: () => binding.controller.show(),
    close: (restoreFocus?: boolean) => binding.controller.close(restoreFocus),
  };
}

export function useAlertDialog(
  options: Omit<DialogOptions, 'role'> = {},
): PreactBinding<DialogController> & {
  open: boolean;
  show: () => void;
  close: (restoreFocus?: boolean) => void;
} {
  const binding = useCallbackController(createAlertDialogController, options, ['onOpenChange']);
  return {
    ...binding,
    open: binding.controller.open,
    show: () => binding.controller.show(),
    close: (restoreFocus?: boolean) => binding.controller.close(restoreFocus),
  };
}

export function useMenu(
  options: MenuOptions = {},
): PreactBinding<MenuController> & { open: boolean } {
  const binding = useCallbackController(createMenuController, options, ['onOpenChange']);
  return { ...binding, open: binding.controller.open };
}

export function useTabs(
  options: TabsOptions = {},
): PreactBinding<TabsController> & { value: string } {
  const binding = useCallbackController(createTabsController, options, ['onValueChange']);
  return { ...binding, value: binding.controller.value };
}

export function useTooltip(
  options: TooltipOptions = {},
): PreactBinding<TooltipController> & { open: boolean } {
  const binding = useCallbackController(createTooltipController, options, ['onOpenChange']);
  return { ...binding, open: binding.controller.open };
}

export function useSelect(options: SelectOptions = {}): PreactBinding<SelectController> {
  return useCallbackController(createSelectController, options, ['onOpenChange', 'onValueChange']);
}

export function useMultiSelect(
  options: Omit<SelectOptions, 'multiple'> = {},
): PreactBinding<SelectController> {
  return useSelect({ ...options, multiple: true });
}

export function useCombobox(options: ComboboxOptions): PreactBinding<ComboboxController> {
  return useCallbackController(createComboboxController, options, [
    'onValueChange',
    'onInputValueChange',
    'onOpenChange',
  ]);
}

export function useAccordion(options: AccordionOptions = {}): PreactBinding<AccordionController> {
  return useCallbackController(createAccordionController, options, ['onValueChange']);
}

export function useToasts(options: { duration?: number; max?: number } = {}) {
  const bump = useRevision();
  const storeRef = useRef<ReturnType<typeof createToastStore> | null>(null);
  if (!storeRef.current) storeRef.current = createToastStore(options);
  const store = storeRef.current;
  useEffect(() => {
    const unsubscribe = store.subscribe(() => bump());
    return () => {
      unsubscribe();
      store.clear();
    };
  }, [store, bump]);
  return {
    toasts: store.getSnapshot() as readonly ToastRecord[],
    store,
    add: (input: ToastInput) => store.add(input),
    update: (id: string, patch: Partial<ToastInput>) => store.update(id, patch),
    dismiss: (id: string) => store.dismiss(id),
    clear: () => store.clear(),
    pause: (id: string) => store.pause(id),
    resume: (id: string) => store.resume(id),
  };
}

export function useSwitch(options: SwitchOptions = {}): PreactBinding<SwitchController> {
  return useCallbackController(createSwitchController, options, ['onCheckedChange']);
}

export function useDisclosure(
  options: DisclosureOptions = {},
): PreactBinding<DisclosureController> {
  return useCallbackController(createDisclosureController, options, ['onOpenChange']);
}

export function usePagination(options: PaginationOptions): PreactBinding<PaginationController> {
  return useCallbackController(createPaginationController, options, ['onPageChange']);
}

export function useSlider(options: SliderOptions = {}): PreactBinding<SliderController> {
  return useCallbackController(createSliderController, options, ['onValueChange']);
}

export function useRadioGroup(
  options: RadioGroupOptions = {},
): PreactBinding<RadioGroupController> {
  return useCallbackController(createRadioGroupController, options, ['onValueChange']);
}

export function usePinInput(options: PinInputOptions = {}): PreactBinding<PinInputController> {
  return useCallbackController(createPinInputController, options, ['onValueChange']);
}

export function useRatingGroup(
  options: RatingGroupOptions = {},
): PreactBinding<RatingGroupController> {
  return useCallbackController(createRatingGroupController, options, ['onValueChange']);
}

export function useAvatar(options: AvatarOptions = {}): PreactBinding<AvatarController> {
  return useCallbackController(createAvatarController, options, ['onLoad', 'onError']);
}

export function useToolbar(options: ToolbarOptions = {}): PreactBinding<ToolbarController> {
  const binding = useFormaController(() => createToolbarController(options));
  binding.controller.updateOptions(options);
  return binding;
}

export * from './overlays-and-layout';
export * from './inputs-and-navigation';
export * from './enterprise-and-boards';
export * from './workbench-and-media';
