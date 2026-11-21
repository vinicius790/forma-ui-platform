import { onBeforeUnmount, ref } from 'vue';
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

export function useContextMenu(options: ContextMenuOptions = {}) {
  const open = ref(options.open ?? options.defaultOpen ?? false);
  const controller = createContextMenuController({
    ...options,
    onOpenChange: (next) => { open.value = next; options.onOpenChange?.(next); },
  });
  onBeforeUnmount(() => controller.destroy());
  return { open, controller };
}

export function useStepper(options: StepperOptions) {
  const step = ref(options.step ?? options.defaultStep ?? 0);
  const controller = createStepperController({
    ...options,
    onStepChange: (next) => { step.value = next; options.onStepChange?.(next); },
  });
  onBeforeUnmount(() => controller.destroy());
  return { step, controller };
}

export function useFileUpload<F extends FileLike = FileLike>(options: FileUploadOptions<F> = {}) {
  const files = ref<F[]>([]);
  const controller = createFileUploadController<F>({
    ...options,
    onFilesChange: (accepted, rejected) => {
      files.value = accepted as unknown as typeof files.value;
      options.onFilesChange?.(accepted, rejected);
    },
  });
  onBeforeUnmount(() => controller.destroy());
  return { files, controller };
}

export function useCarousel(options: CarouselOptions) {
  const index = ref(options.index ?? options.defaultIndex ?? 0);
  const controller = createCarouselController({
    ...options,
    onIndexChange: (next) => { index.value = next; options.onIndexChange?.(next); },
  });
  onBeforeUnmount(() => controller.destroy());
  return { index, controller };
}

export function useColorPicker(options: ColorPickerOptions = {}) {
  const value = ref({ h: options.defaultValue?.h ?? 220, s: options.defaultValue?.s ?? 80, l: options.defaultValue?.l ?? 50, a: options.defaultValue?.a ?? 1 });
  const controller = createColorPickerController({
    ...options,
    onValueChange: (next) => { value.value = next; options.onValueChange?.(next); },
  });
  value.value = controller.value;
  onBeforeUnmount(() => controller.destroy());
  return { value, controller };
}

export function useTagsInput(options: TagsInputOptions = {}) {
  const tags = ref<string[]>([...(options.value ?? options.defaultValue ?? [])]);
  const controller = createTagsInputController({
    ...options,
    onValueChange: (next) => { tags.value = next; options.onValueChange?.(next); },
  });
  onBeforeUnmount(() => controller.destroy());
  return { tags, controller };
}

export function useEditable(options: EditableOptions = {}) {
  const value = ref(options.value ?? options.defaultValue ?? '');
  const editing = ref(false);
  const controller = createEditableController({
    ...options,
    onValueChange: (next) => { value.value = next; options.onValueChange?.(next); },
    onEditChange: (next) => { editing.value = next; options.onEditChange?.(next); },
  });
  onBeforeUnmount(() => controller.destroy());
  return { value, editing, controller };
}

export function useTour(options: TourOptions) {
  const open = ref(options.open ?? options.defaultOpen ?? false);
  const stepIndex = ref(options.stepIndex ?? options.defaultStepIndex ?? 0);
  const controller = createTourController({
    ...options,
    onOpenChange: (next) => { open.value = next; options.onOpenChange?.(next); },
    onStepChange: (next, step) => { stepIndex.value = next; options.onStepChange?.(next, step); },
  });
  onBeforeUnmount(() => controller.destroy());
  return { open, stepIndex, controller };
}

export function useScrollArea(options: ScrollAreaOptions = {}) {
  const visible = ref(options.type === 'always' || options.type === 'auto');
  const controller = createScrollAreaController({
    ...options,
    onVisibilityChange: (next) => { visible.value = next; options.onVisibilityChange?.(next); },
  });
  onBeforeUnmount(() => controller.destroy());
  return { visible, controller };
}

export function useSegmentGroup(options: SegmentGroupOptions) {
  const value = ref(options.value ?? options.defaultValue ?? '');
  const controller = createSegmentGroupController({
    ...options,
    onValueChange: (next) => { value.value = next; options.onValueChange?.(next); },
  });
  value.value = controller.value;
  onBeforeUnmount(() => controller.destroy());
  return { value, controller };
}

export function useHotkeys(bindings: readonly HotkeyBinding[], target?: EventTarget | null): void {
  const stop = registerHotkeys(bindings, target);
  onBeforeUnmount(() => stop());
}
