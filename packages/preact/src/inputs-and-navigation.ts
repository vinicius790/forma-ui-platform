import { useEffect, useReducer, useRef } from 'preact/hooks';
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

function useLazyPreact<C extends { destroy(): void }>(factory: () => C): C {
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
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const ctrl = useLazyPreact(() =>
    createContextMenuController({ ...options, onOpenChange: (n) => { bump(undefined); options.onOpenChange?.(n); } }),
  );
  ctrl.updateOptions({ ...options, onOpenChange: (n) => { bump(undefined); options.onOpenChange?.(n); } });
  return ctrl;
}

export function useStepper(options: StepperOptions) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  return useLazyPreact(() =>
    createStepperController({ ...options, onStepChange: (n) => { bump(undefined); options.onStepChange?.(n); } }),
  );
}

export function useFileUpload<F extends FileLike = FileLike>(options: FileUploadOptions<F> = {}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  return useLazyPreact(() =>
    createFileUploadController<F>({ ...options, onFilesChange: (a, r) => { bump(undefined); options.onFilesChange?.(a, r); } }),
  );
}

export function useCarousel(options: CarouselOptions) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  return useLazyPreact(() =>
    createCarouselController({ ...options, onIndexChange: (n) => { bump(undefined); options.onIndexChange?.(n); } }),
  );
}

export function useColorPicker(options: ColorPickerOptions = {}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  return useLazyPreact(() =>
    createColorPickerController({ ...options, onValueChange: (n) => { bump(undefined); options.onValueChange?.(n); } }),
  );
}

export function useTagsInput(options: TagsInputOptions = {}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const ctrl = useLazyPreact(() =>
    createTagsInputController({ ...options, onValueChange: (n) => { bump(undefined); options.onValueChange?.(n); } }),
  );
  ctrl.updateOptions({ ...options, onValueChange: (n) => { bump(undefined); options.onValueChange?.(n); } });
  return ctrl;
}

export function useEditable(options: EditableOptions = {}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  return useLazyPreact(() =>
    createEditableController({
      ...options,
      onValueChange: (n) => { bump(undefined); options.onValueChange?.(n); },
      onEditChange: (n) => { bump(undefined); options.onEditChange?.(n); },
    }),
  );
}

export function useTour(options: TourOptions) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  return useLazyPreact(() =>
    createTourController({
      ...options,
      onOpenChange: (n) => { bump(undefined); options.onOpenChange?.(n); },
      onStepChange: (i, s) => { bump(undefined); options.onStepChange?.(i, s); },
    }),
  );
}

export function useScrollArea(options: ScrollAreaOptions = {}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  return useLazyPreact(() =>
    createScrollAreaController({ ...options, onVisibilityChange: (n) => { bump(undefined); options.onVisibilityChange?.(n); } }),
  );
}

export function useSegmentGroup(options: SegmentGroupOptions) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const ctrl = useLazyPreact(() =>
    createSegmentGroupController({ ...options, onValueChange: (n) => { bump(undefined); options.onValueChange?.(n); } }),
  );
  ctrl.updateOptions({ ...options, onValueChange: (n) => { bump(undefined); options.onValueChange?.(n); } });
  return ctrl;
}

export function useHotkeys(bindings: readonly HotkeyBinding[], target?: EventTarget | null): void {
  useEffect(() => registerHotkeys(bindings, target), [target, bindings.length]);
}
