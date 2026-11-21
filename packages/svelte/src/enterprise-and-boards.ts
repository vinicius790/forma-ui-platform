import { writable } from 'svelte/store';
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

export function createTreeGridStore(options: TreeGridOptions) {
  const focusedCell = writable<TreeGridCellCoord>(options.focusedCell ?? { rowIndex: 0, colIndex: 0 });
  const expandedIds = writable<string[]>([...(options.expandedIds ?? options.defaultExpandedIds ?? [])]);
  const controller: TreeGridController = createTreeGridController({
    ...options,
    onFocusChange: (next) => {
      focusedCell.set(next);
      options.onFocusChange?.(next);
    },
    onExpandedChange: (next) => {
      expandedIds.set(next);
      options.onExpandedChange?.(next);
    },
  });
  focusedCell.set(controller.focusedCell);
  expandedIds.set(controller.expandedIds);
  return { focusedCell, expandedIds, controller, destroy: () => controller.destroy() };
}

export function createMenubarStore(options: MenubarOptions) {
  const activeMenu = writable<string | null>(options.activeMenu ?? options.defaultActiveMenu ?? null);
  const controller: MenubarController = createMenubarController({
    ...options,
    onActiveMenuChange: (next) => {
      activeMenu.set(next);
      options.onActiveMenuChange?.(next);
    },
  });
  activeMenu.set(controller.activeMenu);
  return { activeMenu, controller, destroy: () => controller.destroy() };
}

export function createFeedStore(options: FeedOptions) {
  const focusedIndex = writable(options.defaultFocusedIndex ?? 0);
  const busy = writable(Boolean(options.busy));
  const controller: FeedController = createFeedController({
    ...options,
    onFocusedIndexChange: (next) => {
      focusedIndex.set(next);
      options.onFocusedIndexChange?.(next);
    },
  });
  focusedIndex.set(controller.focusedIndex);
  return { focusedIndex, busy, controller, destroy: () => controller.destroy() };
}

export function createKanbanStore<T = unknown>(options: KanbanOptions<T>) {
  const columns = writable<readonly KanbanColumn<T>[]>(options.columns);
  const grabbedCardId = writable<string | null>(null);
  const announcement = writable('');
  const controller: KanbanController<T> = createKanbanController<T>({
    ...options,
    onColumnsChange: (next) => {
      columns.set(next);
      options.onColumnsChange?.(next);
    },
    onAnnounce: (msg) => {
      announcement.set(msg);
      grabbedCardId.set(controller.grabbedCardId);
      options.onAnnounce?.(msg);
    },
  });
  columns.set(controller.columns);
  return { columns, grabbedCardId, announcement, controller, destroy: () => controller.destroy() };
}

export function createCommandBarStore(options: CommandBarOptions) {
  const visibleItems = writable<readonly CommandBarItem[]>([]);
  const overflowItems = writable<readonly CommandBarItem[]>([]);
  const controller: CommandBarController = createCommandBarController({
    ...options,
    onOverflowChange: (visibleIds, overflowIds) => {
      visibleItems.set(controller.visibleItems);
      overflowItems.set(controller.overflowItems);
      options.onOverflowChange?.(visibleIds, overflowIds);
    },
  });
  visibleItems.set(controller.visibleItems);
  overflowItems.set(controller.overflowItems);
  return { visibleItems, overflowItems, controller, destroy: () => controller.destroy() };
}

export function createOtpInputStore(options: OtpInputOptions = {}) {
  const value = writable(options.value ?? options.defaultValue ?? '');
  const values = writable<string[]>([]);
  const isComplete = writable(false);
  const controller: OtpInputController = createOtpInputController({
    ...options,
    onValueChange: (next) => {
      value.set(next);
      values.set(controller.values);
      isComplete.set(controller.isComplete);
      options.onValueChange?.(next);
    },
  });
  value.set(controller.value);
  values.set(controller.values);
  isComplete.set(controller.isComplete);
  return { value, values, isComplete, controller, destroy: () => controller.destroy() };
}

export function createSignaturePadStore(options: SignaturePadOptions = {}) {
  const strokes = writable<readonly SignatureStroke[]>([]);
  const isEmpty = writable(true);
  const controller: SignaturePadController = createSignaturePadController({
    ...options,
    onStrokesChange: (next) => {
      strokes.set(next);
      isEmpty.set(next.length === 0);
      options.onStrokesChange?.(next);
    },
  });
  return { strokes, isEmpty, controller, destroy: () => controller.destroy() };
}

export function createQrCodeStore(options: QrCodeOptions) {
  const value = writable(options.value);
  const matrix = writable<boolean[][]>([]);
  const controller: QrCodeController = createQrCodeController({
    ...options,
    onValueChange: (next) => {
      value.set(next);
      matrix.set(controller.matrix);
      options.onValueChange?.(next);
    },
  });
  matrix.set(controller.matrix);
  return { value, matrix, controller, destroy: () => controller.destroy() };
}

export function createBottomSheetStore(options: BottomSheetOptions = {}) {
  const open = writable(options.open ?? options.defaultOpen ?? false);
  const snapIndex = writable(options.snapIndex ?? options.defaultSnapIndex ?? 0);
  const snapPoint = writable(0.35);
  const controller: BottomSheetController = createBottomSheetController({
    ...options,
    onOpenChange: (next) => {
      open.set(next);
      options.onOpenChange?.(next);
    },
    onSnapIndexChange: (index, point) => {
      snapIndex.set(index);
      snapPoint.set(point);
      options.onSnapIndexChange?.(index, point);
    },
  });
  open.set(controller.open);
  snapIndex.set(controller.snapIndex);
  snapPoint.set(controller.snapPoint);
  return { open, snapIndex, snapPoint, controller, destroy: () => controller.destroy() };
}

export function createNotificationCenterStore(options: NotificationCenterOptions = {}) {
  const items = writable<readonly NotificationItem[]>([]);
  const unreadCount = writable(0);
  const controller: NotificationCenterController = createNotificationCenterController({
    ...options,
    onChange: (next) => {
      items.set(next);
      unreadCount.set(controller.unreadCount);
      options.onChange?.(next);
    },
  });
  items.set(controller.items);
  unreadCount.set(controller.unreadCount);
  return { items, unreadCount, controller, destroy: () => controller.destroy() };
}
