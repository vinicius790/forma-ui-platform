import { useEffect, useReducer, useRef } from 'preact/hooks';
import {
  createBottomSheetController,
  createCommandBarController,
  createFeedController,
  createKanbanController,
  createMenubarController,
  createNotificationCenterController,
  createOtpInputController,
  createQrCodeController,
  createSignaturePadController,
  createTreeGridController,
  type BottomSheetController,
  type BottomSheetOptions,
  type CommandBarController,
  type CommandBarOptions,
  type FeedController,
  type FeedOptions,
  type KanbanController,
  type KanbanOptions,
  type MenubarController,
  type MenubarOptions,
  type NotificationCenterController,
  type NotificationCenterOptions,
  type OtpInputController,
  type OtpInputOptions,
  type QrCodeController,
  type QrCodeOptions,
  type SignaturePadController,
  type SignaturePadOptions,
  type TreeGridCellCoord,
  type TreeGridController,
  type TreeGridOptions,
} from '@forma-ui/core';

function useLazyPreactV50<C extends { destroy(): void }>(factory: () => C, onRecreate: () => void): C {
  const ref = useRef<C | null>(null);
  const factoryRef = useRef(factory);
  factoryRef.current = factory;
  const recreateRef = useRef(onRecreate);
  recreateRef.current = onRecreate;
  if (!ref.current) ref.current = factory();
  useEffect(() => {
    if (!ref.current) {
      ref.current = factoryRef.current();
      recreateRef.current();
    }
    return () => {
      ref.current?.destroy();
      ref.current = null;
    };
  }, []);
  return ref.current;
}

export function useTreeGrid(options: TreeGridOptions): TreeGridController {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onExpandedChange = (ids: string[]) => {
    bump(undefined);
    optionsRef.current.onExpandedChange?.(ids);
  };
  const onFocusChange = (cell: TreeGridCellCoord) => {
    bump(undefined);
    optionsRef.current.onFocusChange?.(cell);
  };
  const ctrl = useLazyPreactV50(
    () => createTreeGridController({ ...optionsRef.current, onExpandedChange, onFocusChange }),
    () => bump(undefined),
  );
  ctrl.updateOptions({ ...options, onExpandedChange, onFocusChange });
  return ctrl;
}

export function useMenubar(options: MenubarOptions): MenubarController {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onActiveMenuChange = (id: string | null) => {
    bump(undefined);
    optionsRef.current.onActiveMenuChange?.(id);
  };
  const ctrl = useLazyPreactV50(
    () => createMenubarController({ ...optionsRef.current, onActiveMenuChange }),
    () => bump(undefined),
  );
  ctrl.updateOptions({ ...options, onActiveMenuChange });
  return ctrl;
}

export function useFeed(options: FeedOptions): FeedController {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onFocusedIndexChange = (index: number) => {
    bump(undefined);
    optionsRef.current.onFocusedIndexChange?.(index);
  };
  const ctrl = useLazyPreactV50(
    () => createFeedController({ ...optionsRef.current, onFocusedIndexChange }),
    () => bump(undefined),
  );
  ctrl.updateOptions({ ...options, onFocusedIndexChange });
  return ctrl;
}

export function useKanban<T = unknown>(options: KanbanOptions<T>): KanbanController<T> {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  return useLazyPreactV50(
    () =>
      createKanbanController<T>({
        ...optionsRef.current,
        onColumnsChange: (columns) => {
          bump(undefined);
          optionsRef.current.onColumnsChange?.(columns);
        },
        onAnnounce: (msg) => {
          bump(undefined);
          optionsRef.current.onAnnounce?.(msg);
        },
      }),
    () => bump(undefined),
  );
}

export function useCommandBar(options: CommandBarOptions): CommandBarController {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  return useLazyPreactV50(
    () =>
      createCommandBarController({
        ...optionsRef.current,
        onOverflowChange: (visibleIds, overflowIds) => {
          bump(undefined);
          optionsRef.current.onOverflowChange?.(visibleIds, overflowIds);
        },
      }),
    () => bump(undefined),
  );
}

export function useOtpInput(options: OtpInputOptions = {}): OtpInputController {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onValueChange = (val: string) => {
    bump(undefined);
    optionsRef.current.onValueChange?.(val);
  };
  const onComplete = (val: string) => {
    optionsRef.current.onComplete?.(val);
  };
  const ctrl = useLazyPreactV50(
    () => createOtpInputController({ ...optionsRef.current, onValueChange, onComplete }),
    () => bump(undefined),
  );
  ctrl.updateOptions({ ...options, onValueChange, onComplete });
  return ctrl;
}

export function useSignaturePad(options: SignaturePadOptions = {}): SignaturePadController {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  return useLazyPreactV50(
    () =>
      createSignaturePadController({
        ...optionsRef.current,
        onStrokesChange: (strokes) => {
          bump(undefined);
          optionsRef.current.onStrokesChange?.(strokes);
        },
      }),
    () => bump(undefined),
  );
}

export function useQrCode(options: QrCodeOptions): QrCodeController {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  return useLazyPreactV50(
    () =>
      createQrCodeController({
        ...optionsRef.current,
        onValueChange: (val) => {
          bump(undefined);
          optionsRef.current.onValueChange?.(val);
        },
      }),
    () => bump(undefined),
  );
}

export function useBottomSheet(options: BottomSheetOptions = {}): BottomSheetController {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  return useLazyPreactV50(
    () =>
      createBottomSheetController({
        ...optionsRef.current,
        onOpenChange: (open) => {
          bump(undefined);
          optionsRef.current.onOpenChange?.(open);
        },
        onSnapIndexChange: (index, point) => {
          bump(undefined);
          optionsRef.current.onSnapIndexChange?.(index, point);
        },
      }),
    () => bump(undefined),
  );
}

export function useNotificationCenter(options: NotificationCenterOptions = {}): NotificationCenterController {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  return useLazyPreactV50(
    () =>
      createNotificationCenterController({
        ...optionsRef.current,
        onChange: (items) => {
          bump(undefined);
          optionsRef.current.onChange?.(items);
        },
      }),
    () => bump(undefined),
  );
}
