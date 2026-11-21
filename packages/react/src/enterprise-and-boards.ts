import { useEffect, useRef, useState } from 'react';
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
  type NotificationInput,
  type OtpInputController,
  type OtpInputOptions,
  type QrCodeController,
  type QrCodeOptions,
  type SignaturePadController,
  type SignaturePadOptions,
  type StrokePoint,
  type TreeGridCellCoord,
  type TreeGridController,
  type TreeGridOptions,
} from '@forma-ui/core';

function useLazyV50<C extends { destroy(): void }>(factory: () => C, onRecreate: () => void): C {
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

export function useTreeGrid(options: TreeGridOptions) {
  const [, bump] = useState(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onExpandedChange = (expandedIds: string[]) => {
    bump((n) => n + 1);
    optionsRef.current.onExpandedChange?.(expandedIds);
  };
  const onFocusChange = (cell: TreeGridCellCoord) => {
    bump((n) => n + 1);
    optionsRef.current.onFocusChange?.(cell);
  };
  const controller = useLazyV50<TreeGridController>(
    () => createTreeGridController({ ...optionsRef.current, onExpandedChange, onFocusChange }),
    () => bump((n) => n + 1),
  );
  controller.updateOptions({ ...options, onExpandedChange, onFocusChange });
  return {
    focusedCell: controller.focusedCell,
    expandedIds: controller.expandedIds,
    isExpanded: (rowId: string) => controller.isExpanded(rowId),
    toggleExpand: (rowId: string, force?: boolean) => controller.toggleExpand(rowId, force),
    focusCell: (rowIndex: number, colIndex: number) => controller.focusCell(rowIndex, colIndex),
    handleKeyDown: (event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'preventDefault'>) =>
      controller.handleKeyDown(event),
    getRootProps: (label?: string) => controller.getRootProps(label),
    getRowProps: (rowIndex: number) => controller.getRowProps(rowIndex),
    getCellProps: (rowIndex: number, colIndex: number) => controller.getCellProps(rowIndex, colIndex),
    controller,
  };
}

export function useMenubar(options: MenubarOptions) {
  const [, bump] = useState(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onActiveMenuChange = (menuId: string | null) => {
    bump((n) => n + 1);
    optionsRef.current.onActiveMenuChange?.(menuId);
  };
  const controller = useLazyV50<MenubarController>(
    () => createMenubarController({ ...optionsRef.current, onActiveMenuChange }),
    () => bump((n) => n + 1),
  );
  controller.updateOptions({ ...options, onActiveMenuChange });
  return {
    activeMenu: controller.activeMenu,
    focusedMenuId: controller.focusedMenuId,
    openMenu: (id: string | null) => controller.openMenu(id),
    closeAll: () => controller.closeAll(),
    getMenubarProps: (label?: string) => controller.getMenubarProps(label),
    getTriggerProps: (id: string) => controller.getTriggerProps(id),
    getMenuProps: (id: string) => controller.getMenuProps(id),
    controller,
  };
}

export function useFeed(options: FeedOptions) {
  const [, bump] = useState(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onFocusedIndexChange = (index: number) => {
    bump((n) => n + 1);
    optionsRef.current.onFocusedIndexChange?.(index);
  };
  const controller = useLazyV50<FeedController>(
    () => createFeedController({ ...optionsRef.current, onFocusedIndexChange }),
    () => bump((n) => n + 1),
  );
  controller.updateOptions({ ...options, onFocusedIndexChange });
  return {
    focusedIndex: controller.focusedIndex,
    busy: controller.busy,
    count: controller.count,
    focusIndex: (index: number) => controller.focusIndex(index),
    getFeedProps: (label?: string) => controller.getFeedProps(label),
    getArticleProps: (index: number) => controller.getArticleProps(index),
    controller,
  };
}

export function useKanban<T = unknown>(options: KanbanOptions<T>) {
  const [, bump] = useState(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controller = useLazyV50<KanbanController<T>>(
    () =>
      createKanbanController<T>({
        ...optionsRef.current,
        onColumnsChange: (columns) => {
          bump((n) => n + 1);
          optionsRef.current.onColumnsChange?.(columns);
        },
        onAnnounce: (message) => {
          bump((n) => n + 1);
          optionsRef.current.onAnnounce?.(message);
        },
      }),
    () => bump((n) => n + 1),
  );
  return {
    columns: controller.columns,
    grabbedCardId: controller.grabbedCardId,
    announcement: controller.announcement,
    moveCard: (cardId: string, targetColumnId: string, targetIndex?: number) =>
      controller.moveCard(cardId, targetColumnId, targetIndex),
    grab: (cardId: string) => controller.grab(cardId),
    drop: () => controller.drop(),
    cancelGrab: () => controller.cancelGrab(),
    getBoardProps: (label?: string) => controller.getBoardProps(label),
    getColumnProps: (columnId: string) => controller.getColumnProps(columnId),
    getCardProps: (cardId: string) => controller.getCardProps(cardId),
    controller,
  };
}

export function useCommandBar(options: CommandBarOptions) {
  const [, bump] = useState(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controller = useLazyV50<CommandBarController>(
    () =>
      createCommandBarController({
        ...optionsRef.current,
        onOverflowChange: (visibleIds, overflowIds) => {
          bump((n) => n + 1);
          optionsRef.current.onOverflowChange?.(visibleIds, overflowIds);
        },
      }),
    () => bump((n) => n + 1),
  );
  return {
    visibleItems: controller.visibleItems,
    overflowItems: controller.overflowItems,
    hasOverflow: controller.hasOverflow,
    setContainerWidth: (width: number) => controller.setContainerWidth(width),
    getRootProps: (label?: string) => controller.getRootProps(label),
    controller,
  };
}

export function useOtpInput(options: OtpInputOptions = {}) {
  const [, bump] = useState(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onValueChange = (value: string) => {
    bump((n) => n + 1);
    optionsRef.current.onValueChange?.(value);
  };
  const onComplete = (value: string) => {
    optionsRef.current.onComplete?.(value);
  };
  const controller = useLazyV50<OtpInputController>(
    () => createOtpInputController({ ...optionsRef.current, onValueChange, onComplete }),
    () => bump((n) => n + 1),
  );
  controller.updateOptions({ ...options, onValueChange, onComplete });
  return {
    value: controller.value,
    values: controller.values,
    isComplete: controller.isComplete,
    length: controller.length,
    focusedIndex: controller.focusedIndex,
    setDigit: (index: number, raw: string) => controller.setDigit(index, raw),
    paste: (raw: string, startIndex?: number) => controller.paste(raw, startIndex),
    clear: () => controller.clear(),
    getRootProps: (label?: string) => controller.getRootProps(label),
    getInputProps: (index: number) => controller.getInputProps(index),
    controller,
  };
}

export function useSignaturePad(options: SignaturePadOptions = {}) {
  const [, bump] = useState(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controller = useLazyV50<SignaturePadController>(
    () =>
      createSignaturePadController({
        ...optionsRef.current,
        onStrokesChange: (strokes) => {
          bump((n) => n + 1);
          optionsRef.current.onStrokesChange?.(strokes);
        },
      }),
    () => bump((n) => n + 1),
  );
  return {
    strokes: controller.strokes,
    isEmpty: controller.isEmpty,
    canUndo: controller.canUndo,
    canRedo: controller.canRedo,
    beginStroke: (point: StrokePoint) => controller.beginStroke(point),
    appendPoint: (point: StrokePoint) => controller.appendPoint(point),
    endStroke: () => controller.endStroke(),
    undo: () => controller.undo(),
    redo: () => controller.redo(),
    clear: () => controller.clear(),
    toSvgPath: () => controller.toSvgPath(),
    getSurfaceProps: (label?: string) => controller.getSurfaceProps(label),
    controller,
  };
}

export function useQrCode(options: QrCodeOptions) {
  const [, bump] = useState(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controller = useLazyV50<QrCodeController>(
    () =>
      createQrCodeController({
        ...optionsRef.current,
        onValueChange: (value) => {
          bump((n) => n + 1);
          optionsRef.current.onValueChange?.(value);
        },
      }),
    () => bump((n) => n + 1),
  );
  return {
    value: controller.value,
    matrix: controller.matrix,
    size: controller.size,
    setValue: (next: string) => controller.setValue(next),
    getSvgProps: () => controller.getSvgProps(),
    controller,
  };
}

export function useBottomSheet(options: BottomSheetOptions = {}) {
  const [, bump] = useState(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controller = useLazyV50<BottomSheetController>(
    () =>
      createBottomSheetController({
        ...optionsRef.current,
        onOpenChange: (open) => {
          bump((n) => n + 1);
          optionsRef.current.onOpenChange?.(open);
        },
        onSnapIndexChange: (index, snapPoint) => {
          bump((n) => n + 1);
          optionsRef.current.onSnapIndexChange?.(index, snapPoint);
        },
      }),
    () => bump((n) => n + 1),
  );
  return {
    open: controller.open,
    snapIndex: controller.snapIndex,
    snapPoint: controller.snapPoint,
    snapPoints: controller.snapPoints,
    setOpen: (next: boolean) => controller.setOpen(next),
    snapTo: (index: number) => controller.snapTo(index),
    close: () => controller.close(),
    resolveDragRelease: (currentRatio: number, velocityY?: number) =>
      controller.resolveDragRelease(currentRatio, velocityY),
    attachSheet: (element: HTMLElement | null) => controller.attachSheet(element),
    detach: () => controller.detach(),
    sheetProps: controller.getSheetProps(),
    dragHandleProps: controller.getDragHandleProps(),
    getSheetProps: () => controller.getSheetProps(),
    getDragHandleProps: () => controller.getDragHandleProps(),
    controller,
  };
}

export function useNotificationCenter(options: NotificationCenterOptions = {}) {
  const [, bump] = useState(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controller = useLazyV50<NotificationCenterController>(
    () =>
      createNotificationCenterController({
        ...optionsRef.current,
        onChange: (items) => {
          bump((n) => n + 1);
          optionsRef.current.onChange?.(items);
        },
      }),
    () => bump((n) => n + 1),
  );
  return {
    items: controller.items,
    allItems: controller.allItems,
    unreadCount: controller.unreadCount,
    push: (input: NotificationInput) => controller.push(input),
    markRead: (id: string, read?: boolean) => controller.markRead(id, read),
    markAllRead: () => controller.markAllRead(),
    archive: (id: string) => controller.archive(id),
    dismiss: (id: string) => controller.dismiss(id),
    snooze: (id: string, durationMs: number) => controller.snooze(id, durationMs),
    byCategory: (category: string) => controller.byCategory(category),
    controller,
  };
}
