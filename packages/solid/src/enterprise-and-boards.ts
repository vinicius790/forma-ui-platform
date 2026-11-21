import { createSignal, onCleanup } from 'solid-js';
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
  type CommandBarItem,
  type CommandBarOptions,
  type FeedController,
  type FeedOptions,
  type KanbanColumn,
  type KanbanController,
  type KanbanOptions,
  type MenubarController,
  type MenubarOptions,
  type NotificationCenterController,
  type NotificationCenterOptions,
  type NotificationItem,
  type OtpInputController,
  type OtpInputOptions,
  type QrCodeController,
  type QrCodeOptions,
  type SignaturePadController,
  type SignaturePadOptions,
  type SignatureStroke,
  type TreeGridCellCoord,
  type TreeGridController,
  type TreeGridOptions,
} from '@forma-ui/core';

export function createTreeGrid(options: TreeGridOptions) {
  const [focusedCell, setFocusedCell] = createSignal<TreeGridCellCoord>(
    options.focusedCell ?? { rowIndex: 0, colIndex: 0 },
  );
  const [expandedIds, setExpandedIds] = createSignal<string[]>([
    ...(options.expandedIds ?? options.defaultExpandedIds ?? []),
  ]);
  const controller: TreeGridController = createTreeGridController({
    ...options,
    onFocusChange: (next) => {
      setFocusedCell(next);
      options.onFocusChange?.(next);
    },
    onExpandedChange: (next) => {
      setExpandedIds(next);
      options.onExpandedChange?.(next);
    },
  });
  setFocusedCell(controller.focusedCell);
  setExpandedIds(controller.expandedIds);
  onCleanup(() => controller.destroy());
  return { focusedCell, expandedIds, controller };
}

export function createMenubar(options: MenubarOptions) {
  const [activeMenu, setActiveMenu] = createSignal<string | null>(
    options.activeMenu ?? options.defaultActiveMenu ?? null,
  );
  const controller: MenubarController = createMenubarController({
    ...options,
    onActiveMenuChange: (next) => {
      setActiveMenu(next);
      options.onActiveMenuChange?.(next);
    },
  });
  setActiveMenu(controller.activeMenu);
  onCleanup(() => controller.destroy());
  return { activeMenu, controller };
}

export function createFeed(options: FeedOptions) {
  const [focusedIndex, setFocusedIndex] = createSignal(options.defaultFocusedIndex ?? 0);
  const [busy] = createSignal(Boolean(options.busy));
  const controller: FeedController = createFeedController({
    ...options,
    onFocusedIndexChange: (next) => {
      setFocusedIndex(next);
      options.onFocusedIndexChange?.(next);
    },
  });
  setFocusedIndex(controller.focusedIndex);
  onCleanup(() => controller.destroy());
  return { focusedIndex, busy, controller };
}

export function createKanban<T = unknown>(options: KanbanOptions<T>) {
  const [columns, setColumns] = createSignal<readonly KanbanColumn<T>[]>(options.columns);
  const [grabbedCardId, setGrabbedCardId] = createSignal<string | null>(null);
  const [announcement, setAnnouncement] = createSignal('');
  const controller: KanbanController<T> = createKanbanController<T>({
    ...options,
    onColumnsChange: (next) => {
      setColumns(() => next);
      options.onColumnsChange?.(next);
    },
    onAnnounce: (msg) => {
      setAnnouncement(msg);
      setGrabbedCardId(controller.grabbedCardId);
      options.onAnnounce?.(msg);
    },
  });
  setColumns(() => controller.columns);
  onCleanup(() => controller.destroy());
  return { columns, grabbedCardId, announcement, controller };
}

export function createCommandBar(options: CommandBarOptions) {
  const [visibleItems, setVisibleItems] = createSignal<readonly CommandBarItem[]>([]);
  const [overflowItems, setOverflowItems] = createSignal<readonly CommandBarItem[]>([]);
  const controller: CommandBarController = createCommandBarController({
    ...options,
    onOverflowChange: (visibleIds, overflowIds) => {
      setVisibleItems(() => controller.visibleItems);
      setOverflowItems(() => controller.overflowItems);
      options.onOverflowChange?.(visibleIds, overflowIds);
    },
  });
  setVisibleItems(() => controller.visibleItems);
  setOverflowItems(() => controller.overflowItems);
  onCleanup(() => controller.destroy());
  return { visibleItems, overflowItems, controller };
}

export function createOtpInput(options: OtpInputOptions = {}) {
  const [value, setValue] = createSignal(options.value ?? options.defaultValue ?? '');
  const [values, setValues] = createSignal<string[]>([]);
  const [isComplete, setIsComplete] = createSignal(false);
  const controller: OtpInputController = createOtpInputController({
    ...options,
    onValueChange: (next) => {
      setValue(next);
      setValues(controller.values);
      setIsComplete(controller.isComplete);
      options.onValueChange?.(next);
    },
  });
  setValue(controller.value);
  setValues(controller.values);
  setIsComplete(controller.isComplete);
  onCleanup(() => controller.destroy());
  return { value, values, isComplete, controller };
}

export function createSignaturePad(options: SignaturePadOptions = {}) {
  const [strokes, setStrokes] = createSignal<readonly SignatureStroke[]>([]);
  const [isEmpty, setIsEmpty] = createSignal(true);
  const controller: SignaturePadController = createSignaturePadController({
    ...options,
    onStrokesChange: (next) => {
      setStrokes(() => next);
      setIsEmpty(next.length === 0);
      options.onStrokesChange?.(next);
    },
  });
  onCleanup(() => controller.destroy());
  return { strokes, isEmpty, controller };
}

export function createQrCode(options: QrCodeOptions) {
  const [value, setValue] = createSignal(options.value);
  const [matrix, setMatrix] = createSignal<boolean[][]>([]);
  const controller: QrCodeController = createQrCodeController({
    ...options,
    onValueChange: (next) => {
      setValue(next);
      setMatrix(() => controller.matrix);
      options.onValueChange?.(next);
    },
  });
  setMatrix(() => controller.matrix);
  onCleanup(() => controller.destroy());
  return { value, matrix, controller };
}

export function createBottomSheet(options: BottomSheetOptions = {}) {
  const [open, setOpen] = createSignal(options.open ?? options.defaultOpen ?? false);
  const [snapIndex, setSnapIndex] = createSignal(options.snapIndex ?? options.defaultSnapIndex ?? 0);
  const [snapPoint, setSnapPoint] = createSignal(0.35);
  const controller: BottomSheetController = createBottomSheetController({
    ...options,
    onOpenChange: (next) => {
      setOpen(next);
      options.onOpenChange?.(next);
    },
    onSnapIndexChange: (index, point) => {
      setSnapIndex(index);
      setSnapPoint(point);
      options.onSnapIndexChange?.(index, point);
    },
  });
  setOpen(controller.open);
  setSnapIndex(controller.snapIndex);
  setSnapPoint(controller.snapPoint);
  onCleanup(() => controller.destroy());
  return { open, snapIndex, snapPoint, controller };
}

export function createNotificationCenter(options: NotificationCenterOptions = {}) {
  const [items, setItems] = createSignal<readonly NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = createSignal(0);
  const controller: NotificationCenterController = createNotificationCenterController({
    ...options,
    onChange: (next) => {
      setItems(() => next);
      setUnreadCount(controller.unreadCount);
      options.onChange?.(next);
    },
  });
  setItems(() => controller.items);
  setUnreadCount(controller.unreadCount);
  onCleanup(() => controller.destroy());
  return { items, unreadCount, controller };
}
