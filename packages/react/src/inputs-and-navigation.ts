import { useEffect, useRef, useState } from 'react';
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
  type CarouselController,
  type CarouselOptions,
  type ColorPickerController,
  type ColorPickerOptions,
  type ContextMenuController,
  type ContextMenuOptions,
  type EditableController,
  type EditableOptions,
  type FileLike,
  type FileUploadController,
  type FileUploadOptions,
  type HotkeyBinding,
  type ScrollAreaController,
  type ScrollAreaOptions,
  type SegmentGroupController,
  type SegmentGroupOptions,
  type StepperController,
  type StepperOptions,
  type TagsInputController,
  type TagsInputOptions,
  type TourController,
  type TourOptions,
} from '@forma-ui/core';

function useLazyV10<C extends { destroy(): void }>(factory: () => C): C {
  const ref = useRef<C | null>(null);
  if (!ref.current) ref.current = factory();
  useEffect(() => {
    const current = ref.current;
    return () => {
      current?.destroy();
      ref.current = null;
    };
  }, []);
  return ref.current;
}

export function useContextMenu(options: ContextMenuOptions = {}) {
  const [, bump] = useState(0);
  const onOpenChange = (open: boolean) => {
    bump((n) => n + 1);
    options.onOpenChange?.(open);
  };
  const controller = useLazyV10<ContextMenuController>(() => createContextMenuController({ ...options, onOpenChange }));
  controller.updateOptions({ ...options, onOpenChange });
  return {
    open: controller.open,
    point: controller.point,
    openAt: (x: number, y: number) => controller.openAt(x, y),
    close: () => controller.close(),
    attachMenu: (el: HTMLElement | null) => controller.attachMenu(el),
    triggerProps: controller.getTriggerProps(),
    menuProps: controller.getMenuProps(),
    controller,
  };
}

export function useStepper(options: StepperOptions) {
  const [, bump] = useState(0);
  const controller = useLazyV10<StepperController>(() =>
    createStepperController({
      ...options,
      onStepChange: (step) => {
        bump((n) => n + 1);
        options.onStepChange?.(step);
      },
    }),
  );
  return {
    step: controller.step,
    isFirst: controller.isFirst,
    isLast: controller.isLast,
    next: () => controller.next(),
    prev: () => controller.prev(),
    goTo: (index: number) => controller.goTo(index),
    getStepTriggerProps: (index: number) => controller.getStepTriggerProps(index),
    getPanelProps: (index: number) => controller.getPanelProps(index),
    controller,
  };
}

export function useFileUpload<F extends FileLike = FileLike>(options: FileUploadOptions<F> = {}) {
  const [, bump] = useState(0);
  const controller = useLazyV10<FileUploadController<F>>(() =>
    createFileUploadController<F>({
      ...options,
      onFilesChange: (accepted, rejected) => {
        bump((n) => n + 1);
        options.onFilesChange?.(accepted, rejected);
      },
    }),
  );
  return {
    acceptedFiles: controller.acceptedFiles,
    rejectedFiles: controller.rejectedFiles,
    isDragging: controller.isDragging,
    addFiles: (files: readonly F[]) => controller.addFiles(files),
    removeFile: (index: number) => controller.removeFile(index),
    clear: () => controller.clear(),
    dropzoneProps: controller.getDropzoneProps(),
    inputProps: controller.getInputProps(),
    controller,
  };
}

export function useCarousel(options: CarouselOptions) {
  const [, bump] = useState(0);
  const controller = useLazyV10<CarouselController>(() =>
    createCarouselController({
      ...options,
      onIndexChange: (index) => {
        bump((n) => n + 1);
        options.onIndexChange?.(index);
      },
    }),
  );
  return {
    index: controller.index,
    isPlaying: controller.isPlaying,
    next: () => controller.next(),
    prev: () => controller.prev(),
    goTo: (idx: number) => controller.goTo(idx),
    rootProps: controller.getRootProps(),
    getSlideProps: (idx: number) => controller.getSlideProps(idx),
    controller,
  };
}

export function useColorPicker(options: ColorPickerOptions = {}) {
  const [, bump] = useState(0);
  const controller = useLazyV10<ColorPickerController>(() =>
    createColorPickerController({
      ...options,
      onValueChange: (val) => {
        bump((n) => n + 1);
        options.onValueChange?.(val);
      },
    }),
  );
  return {
    value: controller.value,
    hex: controller.hex,
    setChannel: controller.setChannel.bind(controller),
    areaProps: controller.getAreaProps(),
    controller,
  };
}

export function useTagsInput(options: TagsInputOptions = {}) {
  const [, bump] = useState(0);
  const onValueChange = (tags: string[]) => {
    bump((n) => n + 1);
    options.onValueChange?.(tags);
  };
  const controller = useLazyV10<TagsInputController>(() => createTagsInputController({ ...options, onValueChange }));
  controller.updateOptions({ ...options, onValueChange });
  return {
    tags: controller.tags,
    inputValue: controller.inputValue,
    addTag: (tag: string) => controller.addTag(tag),
    removeTag: (index: number) => controller.removeTag(index),
    clear: () => controller.clear(),
    inputProps: controller.getInputProps(),
    listProps: controller.getListProps(),
    getTagProps: (index: number) => controller.getTagProps(index),
    getTagRemoveProps: (index: number) => controller.getTagRemoveProps(index),
    controller,
  };
}

export function useEditable(options: EditableOptions = {}) {
  const [, bump] = useState(0);
  const controller = useLazyV10<EditableController>(() =>
    createEditableController({
      ...options,
      onValueChange: (v) => { bump((n) => n + 1); options.onValueChange?.(v); },
      onEditChange: (e) => { bump((n) => n + 1); options.onEditChange?.(e); },
    }),
  );
  return {
    value: controller.value,
    draft: controller.draft,
    editing: controller.editing,
    edit: () => controller.edit(),
    submit: () => controller.submit(),
    cancel: () => controller.cancel(),
    previewProps: controller.getPreviewProps(),
    inputProps: controller.getInputProps(),
    controller,
  };
}

export function useTour(options: TourOptions) {
  const [, bump] = useState(0);
  const controller = useLazyV10<TourController>(() =>
    createTourController({
      ...options,
      onOpenChange: (o) => { bump((n) => n + 1); options.onOpenChange?.(o); },
      onStepChange: (i, s) => { bump((n) => n + 1); options.onStepChange?.(i, s); },
    }),
  );
  return {
    open: controller.open,
    stepIndex: controller.stepIndex,
    currentStep: controller.currentStep,
    progress: controller.progress,
    start: (idx?: number) => controller.start(idx),
    next: () => controller.next(),
    prev: () => controller.prev(),
    skip: () => controller.skip(),
    dialogProps: controller.getDialogProps(),
    titleProps: controller.getTitleProps(),
    descriptionProps: controller.getDescriptionProps(),
    controller,
  };
}

export function useScrollArea(options: ScrollAreaOptions = {}) {
  const [, bump] = useState(0);
  const controller = useLazyV10<ScrollAreaController>(() =>
    createScrollAreaController({
      ...options,
      onVisibilityChange: (v) => { bump((n) => n + 1); options.onVisibilityChange?.(v); },
    }),
  );
  return {
    visible: controller.visible,
    verticalThumb: controller.verticalThumb,
    horizontalThumb: controller.horizontalThumb,
    rootProps: controller.getRootProps(),
    viewportProps: controller.getViewportProps(),
    controller,
  };
}

export function useSegmentGroup(options: SegmentGroupOptions) {
  const [, bump] = useState(0);
  const onValueChange = (val: string) => {
    bump((n) => n + 1);
    options.onValueChange?.(val);
  };
  const controller = useLazyV10<SegmentGroupController>(() => createSegmentGroupController({ ...options, onValueChange }));
  controller.updateOptions({ ...options, onValueChange });
  return {
    value: controller.value,
    select: (val: string) => controller.select(val),
    rootProps: controller.getRootProps(),
    getItemProps: (val: string) => controller.getItemProps(val),
    controller,
  };
}

export function useHotkeys(bindings: readonly HotkeyBinding[], target?: EventTarget | null): void {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;
  useEffect(() => registerHotkeys(bindingsRef.current, target), [target, bindings.length]);
}
