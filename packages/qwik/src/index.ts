import {
  createBottomSheetController,
  createCollapsibleController,
  createDialogController,
  createDrawerController,
  createOtpInputController,
  createPopoverController,
  createStepperController,
  createTabsController,
  type BottomSheetOptions,
  type CollapsibleOptions,
  type DialogOptions,
  type DrawerOptions,
  type OtpInputOptions,
  type PopoverOptions,
  type StepperOptions,
  type TabsOptions,
} from '@forma-ui/core';

export interface SignalLike<T> {
  value: T;
}

export interface ResumableBinding<TState, TController extends { destroy?: () => void }> {
  readonly state: TState;
  resume(): TController;
  dispose(): void;
}

/**
 * Creates a Qwik-resumable lazy binding: holds a pure serializable state snapshot on SSR
 * and only instantiates the live `@forma-ui/core` controller when `resume()` is triggered on interaction.
 */
export function createResumableBinding<TState extends Record<string, unknown>, TController extends { destroy?: () => void }>(
  initialState: TState,
  hydrate: (state: TState) => TController,
): ResumableBinding<TState, TController> {
  let instance: TController | null = null;
  return {
    state: initialState,
    resume() {
      if (!instance) instance = hydrate(initialState);
      return instance;
    },
    dispose() {
      instance?.destroy?.();
      instance = null;
    },
  };
}

/** Syncs a Forma external store into a Qwik `SignalLike<T>` and returns an idempotent cleanup. */
export function bindStoreToQwikSignal<T>(
  store: { subscribe(listener: () => void): () => void; getSnapshot(): T },
  signal: SignalLike<T>,
): () => void {
  signal.value = store.getSnapshot();
  return store.subscribe(() => {
    signal.value = store.getSnapshot();
  });
}

export function createQwikDialog(options: DialogOptions = {}) {
  return createResumableBinding({ open: options.open ?? options.defaultOpen ?? false }, (s) =>
    createDialogController({ ...options, defaultOpen: s.open, onOpenChange: (o) => { s.open = o; options.onOpenChange?.(o); } }),
  );
}

export function createQwikPopover(options: PopoverOptions = {}) {
  return createResumableBinding({ open: options.open ?? options.defaultOpen ?? false }, (s) =>
    createPopoverController({ ...options, defaultOpen: s.open, onOpenChange: (o) => { s.open = o; options.onOpenChange?.(o); } }),
  );
}

export function createQwikDrawer(options: DrawerOptions = {}) {
  return createResumableBinding({ open: options.open ?? options.defaultOpen ?? false }, (s) =>
    createDrawerController({ ...options, defaultOpen: s.open, onOpenChange: (o) => { s.open = o; options.onOpenChange?.(o); } }),
  );
}

export function createQwikCollapsible(options: CollapsibleOptions = {}) {
  return createResumableBinding({ open: options.open ?? options.defaultOpen ?? false }, (s) =>
    createCollapsibleController({ ...options, defaultOpen: s.open, onOpenChange: (o) => { s.open = o; options.onOpenChange?.(o); } }),
  );
}

export function createQwikTabs(options: TabsOptions = {}) {
  return createResumableBinding({ value: options.value ?? options.defaultValue ?? '' }, (s) =>
    createTabsController({ ...options, defaultValue: s.value, onValueChange: (v) => { s.value = v; options.onValueChange?.(v); } }),
  );
}

export function createQwikStepper(options: StepperOptions) {
  return createResumableBinding({ step: options.step ?? options.defaultStep ?? 0 }, (s) =>
    createStepperController({ ...options, defaultStep: s.step, onStepChange: (v) => { s.step = v; options.onStepChange?.(v); } }),
  );
}

export function createQwikOtpInput(options: OtpInputOptions = {}) {
  return createResumableBinding({ value: options.value ?? options.defaultValue ?? '' }, (s) =>
    createOtpInputController({ ...options, defaultValue: s.value, onValueChange: (v) => { s.value = v; options.onValueChange?.(v); } }),
  );
}

export function createQwikBottomSheet(options: BottomSheetOptions = {}) {
  return createResumableBinding(
    { open: options.open ?? options.defaultOpen ?? false, snapIndex: options.snapIndex ?? options.defaultSnapIndex ?? 0 },
    (s) =>
      createBottomSheetController({
        ...options,
        defaultOpen: s.open,
        defaultSnapIndex: s.snapIndex,
        onOpenChange: (o) => { s.open = o; options.onOpenChange?.(o); },
        onSnapIndexChange: (i, pt) => { s.snapIndex = i; options.onSnapIndexChange?.(i, pt); },
      }),
  );
}

export * from './workbench-and-media';
