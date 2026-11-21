import { DestroyRef, signal, type Signal, type WritableSignal, inject } from '@angular/core';
import {
  createCarouselController,
  createCollapsibleController,
  createColorPickerController,
  createContextMenuController,
  createDrawerController,
  createEditableController,
  createFileUploadController,
  createHoverCardController,
  createPopoverController,
  createSegmentGroupController,
  createSplitterController,
  createStepperController,
  createTagsInputController,
  createTourController,
  registerHotkeys,
  type CarouselOptions,
  type CollapsibleOptions,
  type ColorPickerOptions,
  type ContextMenuOptions,
  type DrawerOptions,
  type EditableOptions,
  type FileLike,
  type FileUploadOptions,
  type HotkeyBinding,
  type HoverCardOptions,
  type PopoverOptions,
  type SegmentGroupOptions,
  type SplitterOptions,
  type StepperOptions,
  type TagsInputOptions,
  type TourOptions,
} from '@forma-ui/core';

export interface FormaAngularBinding<T> {
  value: Signal<T>;
  setValue: (value: T) => void;
}

export function createFormaSignal<T>(initial: T, onChange?: (value: T) => void): FormaAngularBinding<T> {
  const state: WritableSignal<T> = signal(initial);
  return {
    value: state.asReadonly(),
    setValue: (value) => {
      state.set(value);
      onChange?.(value);
    },
  };
}

/** Register a controller's cleanup with the current Angular injection context. */
export function ownFormaController<T extends { destroy?: () => void }>(
  factory: () => T,
  destroyRef: DestroyRef = inject(DestroyRef),
): T {
  const controller = factory();
  destroyRef.onDestroy(() => controller.destroy?.());
  return controller;
}

export function createFormaControllerBinding<T, C extends { destroy?: () => void }>(
  factory: () => C,
  read: (controller: C) => T,
  destroyRef: DestroyRef = inject(DestroyRef),
) {
  const controller = ownFormaController(factory, destroyRef);
  const state = createFormaSignal(read(controller));
  return { controller, ...state, refresh: () => state.setValue(read(controller)) };
}

/** Bind a Forma-compatible external store to an Angular readonly signal. */
export function fromFormaStore<T>(
  store: { subscribe(listener: () => void): () => void; getSnapshot(): T },
  destroyRef: DestroyRef = inject(DestroyRef),
): Signal<T> {
  const state: WritableSignal<T> = signal(store.getSnapshot());
  const unsubscribe = store.subscribe(() => state.set(store.getSnapshot()));
  destroyRef.onDestroy(unsubscribe);
  return state.asReadonly();
}

export function injectCollapsible(options: CollapsibleOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const open = signal(options.open ?? options.defaultOpen ?? false);
  const controller = ownFormaController(
    () => createCollapsibleController({ ...options, onOpenChange: (n) => { open.set(n); options.onOpenChange?.(n); } }),
    destroyRef,
  );
  return { open: open.asReadonly(), controller };
}

export function injectPopover(options: PopoverOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const open = signal(options.open ?? options.defaultOpen ?? false);
  const controller = ownFormaController(
    () => createPopoverController({ ...options, onOpenChange: (n) => { open.set(n); options.onOpenChange?.(n); } }),
    destroyRef,
  );
  return { open: open.asReadonly(), controller };
}

export function injectDrawer(options: DrawerOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const open = signal(options.open ?? options.defaultOpen ?? false);
  const controller = ownFormaController(
    () => createDrawerController({ ...options, onOpenChange: (n) => { open.set(n); options.onOpenChange?.(n); } }),
    destroyRef,
  );
  return { open: open.asReadonly(), controller };
}

export function injectSplitter(options: SplitterOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const value = signal(options.value ?? options.defaultValue ?? 50);
  const controller = ownFormaController(
    () => createSplitterController({ ...options, onValueChange: (n) => { value.set(n); options.onValueChange?.(n); } }),
    destroyRef,
  );
  return { value: value.asReadonly(), controller };
}

export function injectHoverCard(options: HoverCardOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const open = signal(options.open ?? options.defaultOpen ?? false);
  const controller = ownFormaController(
    () => createHoverCardController({ ...options, onOpenChange: (n) => { open.set(n); options.onOpenChange?.(n); } }),
    destroyRef,
  );
  return { open: open.asReadonly(), controller };
}

export function injectContextMenu(options: ContextMenuOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const open = signal(options.open ?? options.defaultOpen ?? false);
  const controller = ownFormaController(
    () => createContextMenuController({ ...options, onOpenChange: (n) => { open.set(n); options.onOpenChange?.(n); } }),
    destroyRef,
  );
  return { open: open.asReadonly(), controller };
}

export function injectStepper(options: StepperOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  const step = signal(options.step ?? options.defaultStep ?? 0);
  const controller = ownFormaController(
    () => createStepperController({ ...options, onStepChange: (n) => { step.set(n); options.onStepChange?.(n); } }),
    destroyRef,
  );
  return { step: step.asReadonly(), controller };
}

export function injectFileUpload<F extends FileLike = FileLike>(
  options: FileUploadOptions<F> = {},
  destroyRef: DestroyRef = inject(DestroyRef),
) {
  const files = signal<F[]>([]);
  const controller = ownFormaController(
    () => createFileUploadController<F>({ ...options, onFilesChange: (a, r) => { files.set(a); options.onFilesChange?.(a, r); } }),
    destroyRef,
  );
  return { files: files.asReadonly(), controller };
}

export function injectCarousel(options: CarouselOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  const index = signal(options.index ?? options.defaultIndex ?? 0);
  const controller = ownFormaController(
    () => createCarouselController({ ...options, onIndexChange: (n) => { index.set(n); options.onIndexChange?.(n); } }),
    destroyRef,
  );
  return { index: index.asReadonly(), controller };
}

export function injectColorPicker(options: ColorPickerOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const value = signal({ h: options.defaultValue?.h ?? 220, s: options.defaultValue?.s ?? 80, l: options.defaultValue?.l ?? 50, a: options.defaultValue?.a ?? 1 });
  const controller = ownFormaController(
    () => createColorPickerController({ ...options, onValueChange: (n) => { value.set(n); options.onValueChange?.(n); } }),
    destroyRef,
  );
  value.set(controller.value);
  return { value: value.asReadonly(), controller };
}

export function injectTagsInput(options: TagsInputOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const tags = signal<string[]>([...(options.value ?? options.defaultValue ?? [])]);
  const controller = ownFormaController(
    () => createTagsInputController({ ...options, onValueChange: (n) => { tags.set(n); options.onValueChange?.(n); } }),
    destroyRef,
  );
  return { tags: tags.asReadonly(), controller };
}

export function injectEditable(options: EditableOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const value = signal(options.value ?? options.defaultValue ?? '');
  const editing = signal(false);
  const controller = ownFormaController(
    () => createEditableController({
      ...options,
      onValueChange: (n) => { value.set(n); options.onValueChange?.(n); },
      onEditChange: (n) => { editing.set(n); options.onEditChange?.(n); },
    }),
    destroyRef,
  );
  return { value: value.asReadonly(), editing: editing.asReadonly(), controller };
}

export function injectTour(options: TourOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  const open = signal(options.open ?? options.defaultOpen ?? false);
  const stepIndex = signal(options.stepIndex ?? options.defaultStepIndex ?? 0);
  const controller = ownFormaController(
    () => createTourController({
      ...options,
      onOpenChange: (n) => { open.set(n); options.onOpenChange?.(n); },
      onStepChange: (i, s) => { stepIndex.set(i); options.onStepChange?.(i, s); },
    }),
    destroyRef,
  );
  return { open: open.asReadonly(), stepIndex: stepIndex.asReadonly(), controller };
}

export function injectSegmentGroup(options: SegmentGroupOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  const value = signal(options.value ?? options.defaultValue ?? '');
  const controller = ownFormaController(
    () => createSegmentGroupController({ ...options, onValueChange: (n) => { value.set(n); options.onValueChange?.(n); } }),
    destroyRef,
  );
  value.set(controller.value);
  return { value: value.asReadonly(), controller };
}

export function injectHotkeys(
  bindings: readonly HotkeyBinding[],
  target?: EventTarget | null,
  destroyRef: DestroyRef = inject(DestroyRef),
): void {
  const stop = registerHotkeys(bindings, target);
  destroyRef.onDestroy(stop);
}

export * from './enterprise-and-boards';
export * from './workbench-and-media';
