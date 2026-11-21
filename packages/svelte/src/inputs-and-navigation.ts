import { writable } from 'svelte/store';
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
  type CarouselOptions,
  type ColorPickerOptions,
  type ContextMenuOptions,
  type EditableOptions,
  type FileLike,
  type FileUploadOptions,
  type ScrollAreaOptions,
  type SegmentGroupOptions,
  type StepperOptions,
  type TagsInputOptions,
  type TourOptions,
} from '@forma-ui/core';

export function createContextMenuStore(options: ContextMenuOptions = {}) {
  const open = writable(options.open ?? options.defaultOpen ?? false);
  const controller = createContextMenuController({
    ...options,
    onOpenChange: (next) => { open.set(next); options.onOpenChange?.(next); },
  });
  return { open, controller, destroy: () => controller.destroy() };
}

export function createStepperStore(options: StepperOptions) {
  const step = writable(options.step ?? options.defaultStep ?? 0);
  const controller = createStepperController({
    ...options,
    onStepChange: (next) => { step.set(next); options.onStepChange?.(next); },
  });
  return { step, controller, destroy: () => controller.destroy() };
}

export function createFileUploadStore<F extends FileLike = FileLike>(options: FileUploadOptions<F> = {}) {
  const files = writable<F[]>([]);
  const controller = createFileUploadController<F>({
    ...options,
    onFilesChange: (accepted, rejected) => { files.set(accepted); options.onFilesChange?.(accepted, rejected); },
  });
  return { files, controller, destroy: () => controller.destroy() };
}

export function createCarouselStore(options: CarouselOptions) {
  const index = writable(options.index ?? options.defaultIndex ?? 0);
  const controller = createCarouselController({
    ...options,
    onIndexChange: (next) => { index.set(next); options.onIndexChange?.(next); },
  });
  return { index, controller, destroy: () => controller.destroy() };
}

export function createColorPickerStore(options: ColorPickerOptions = {}) {
  const value = writable({ h: options.defaultValue?.h ?? 220, s: options.defaultValue?.s ?? 80, l: options.defaultValue?.l ?? 50, a: options.defaultValue?.a ?? 1 });
  const controller = createColorPickerController({
    ...options,
    onValueChange: (next) => { value.set(next); options.onValueChange?.(next); },
  });
  value.set(controller.value);
  return { value, controller, destroy: () => controller.destroy() };
}

export function createTagsInputStore(options: TagsInputOptions = {}) {
  const tags = writable<string[]>([...(options.value ?? options.defaultValue ?? [])]);
  const controller = createTagsInputController({
    ...options,
    onValueChange: (next) => { tags.set(next); options.onValueChange?.(next); },
  });
  return { tags, controller, destroy: () => controller.destroy() };
}

export function createEditableStore(options: EditableOptions = {}) {
  const value = writable(options.value ?? options.defaultValue ?? '');
  const editing = writable(false);
  const controller = createEditableController({
    ...options,
    onValueChange: (next) => { value.set(next); options.onValueChange?.(next); },
    onEditChange: (next) => { editing.set(next); options.onEditChange?.(next); },
  });
  return { value, editing, controller, destroy: () => controller.destroy() };
}

export function createTourStore(options: TourOptions) {
  const open = writable(options.open ?? options.defaultOpen ?? false);
  const stepIndex = writable(options.stepIndex ?? options.defaultStepIndex ?? 0);
  const controller = createTourController({
    ...options,
    onOpenChange: (next) => { open.set(next); options.onOpenChange?.(next); },
    onStepChange: (next, step) => { stepIndex.set(next); options.onStepChange?.(next, step); },
  });
  return { open, stepIndex, controller, destroy: () => controller.destroy() };
}

export function createScrollAreaStore(options: ScrollAreaOptions = {}) {
  const visible = writable(options.type === 'always' || options.type === 'auto');
  const controller = createScrollAreaController({
    ...options,
    onVisibilityChange: (next) => { visible.set(next); options.onVisibilityChange?.(next); },
  });
  return { visible, controller, destroy: () => controller.destroy() };
}

export function createSegmentGroupStore(options: SegmentGroupOptions) {
  const value = writable(options.value ?? options.defaultValue ?? '');
  const controller = createSegmentGroupController({
    ...options,
    onValueChange: (next) => { value.set(next); options.onValueChange?.(next); },
  });
  value.set(controller.value);
  return { value, controller, destroy: () => controller.destroy() };
}
