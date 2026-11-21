import { createSignal, onCleanup } from 'solid-js';
import {
  createCarouselController,
  createColorPickerController,
  createContextMenuController,
  createEditableController,
  createFileUploadController,
  createScrollAreaController,
  createSegmentGroupController,
  createStepperController,
  createTagsInputController,
  createTourController,
  registerHotkeys,
  type CarouselOptions,
  type ColorPickerOptions,
  type ContextMenuOptions,
  type EditableOptions,
  type FileLike,
  type FileUploadOptions,
  type HotkeyBinding,
  type ScrollAreaOptions,
  type SegmentGroupOptions,
  type StepperOptions,
  type TagsInputOptions,
  type TourOptions,
} from '@forma-ui/core';

export function createContextMenu(options: ContextMenuOptions = {}) {
  const [open, setOpen] = createSignal(options.open ?? options.defaultOpen ?? false);
  const controller = createContextMenuController({
    ...options,
    onOpenChange: (next) => { setOpen(next); options.onOpenChange?.(next); },
  });
  onCleanup(() => controller.destroy());
  return { open, controller };
}

export function createStepper(options: StepperOptions) {
  const [step, setStep] = createSignal(options.step ?? options.defaultStep ?? 0);
  const controller = createStepperController({
    ...options,
    onStepChange: (next) => { setStep(next); options.onStepChange?.(next); },
  });
  onCleanup(() => controller.destroy());
  return { step, controller };
}

export function createFileUpload<F extends FileLike = FileLike>(options: FileUploadOptions<F> = {}) {
  const [files, setFiles] = createSignal<F[]>([]);
  const controller = createFileUploadController<F>({
    ...options,
    onFilesChange: (accepted, rejected) => { setFiles(accepted); options.onFilesChange?.(accepted, rejected); },
  });
  onCleanup(() => controller.destroy());
  return { files, controller };
}

export function createCarousel(options: CarouselOptions) {
  const [index, setIndex] = createSignal(options.index ?? options.defaultIndex ?? 0);
  const controller = createCarouselController({
    ...options,
    onIndexChange: (next) => { setIndex(next); options.onIndexChange?.(next); },
  });
  onCleanup(() => controller.destroy());
  return { index, controller };
}

export function createColorPicker(options: ColorPickerOptions = {}) {
  const [value, setValue] = createSignal({ h: options.defaultValue?.h ?? 220, s: options.defaultValue?.s ?? 80, l: options.defaultValue?.l ?? 50, a: options.defaultValue?.a ?? 1 });
  const controller = createColorPickerController({
    ...options,
    onValueChange: (next) => { setValue(next); options.onValueChange?.(next); },
  });
  setValue(controller.value);
  onCleanup(() => controller.destroy());
  return { value, controller };
}

export function createTagsInput(options: TagsInputOptions = {}) {
  const [tags, setTags] = createSignal<string[]>([...(options.value ?? options.defaultValue ?? [])]);
  const controller = createTagsInputController({
    ...options,
    onValueChange: (next) => { setTags(next); options.onValueChange?.(next); },
  });
  onCleanup(() => controller.destroy());
  return { tags, controller };
}

export function createEditable(options: EditableOptions = {}) {
  const [value, setValue] = createSignal(options.value ?? options.defaultValue ?? '');
  const [editing, setEditing] = createSignal(false);
  const controller = createEditableController({
    ...options,
    onValueChange: (next) => { setValue(next); options.onValueChange?.(next); },
    onEditChange: (next) => { setEditing(next); options.onEditChange?.(next); },
  });
  onCleanup(() => controller.destroy());
  return { value, editing, controller };
}

export function createTour(options: TourOptions) {
  const [open, setOpen] = createSignal(options.open ?? options.defaultOpen ?? false);
  const [stepIndex, setStepIndex] = createSignal(options.stepIndex ?? options.defaultStepIndex ?? 0);
  const controller = createTourController({
    ...options,
    onOpenChange: (next) => { setOpen(next); options.onOpenChange?.(next); },
    onStepChange: (next, step) => { setStepIndex(next); options.onStepChange?.(next, step); },
  });
  onCleanup(() => controller.destroy());
  return { open, stepIndex, controller };
}

export function createScrollArea(options: ScrollAreaOptions = {}) {
  const [visible, setVisible] = createSignal(options.type === 'always' || options.type === 'auto');
  const controller = createScrollAreaController({
    ...options,
    onVisibilityChange: (next) => { setVisible(next); options.onVisibilityChange?.(next); },
  });
  onCleanup(() => controller.destroy());
  return { visible, controller };
}

export function createSegmentGroup(options: SegmentGroupOptions) {
  const [value, setValue] = createSignal(options.value ?? options.defaultValue ?? '');
  const controller = createSegmentGroupController({
    ...options,
    onValueChange: (next) => { setValue(next); options.onValueChange?.(next); },
  });
  setValue(controller.value);
  onCleanup(() => controller.destroy());
  return { value, controller };
}

export function createHotkeys(bindings: readonly HotkeyBinding[], target?: EventTarget | null): void {
  const stop = registerHotkeys(bindings, target);
  onCleanup(() => stop());
}
