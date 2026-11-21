import { onBeforeUnmount, ref, type Ref } from 'vue';
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

export function useTreeGrid(options: TreeGridOptions) {
  const focusedCell = ref<TreeGridCellCoord>(options.focusedCell ?? { rowIndex: 0, colIndex: 0 });
  const expandedIds = ref<string[]>([...(options.expandedIds ?? options.defaultExpandedIds ?? [])]);
  const controller: TreeGridController = createTreeGridController({
    ...options,
    onFocusChange: (next) => {
      focusedCell.value = next;
      options.onFocusChange?.(next);
    },
    onExpandedChange: (next) => {
      expandedIds.value = next;
      options.onExpandedChange?.(next);
    },
  });
  focusedCell.value = controller.focusedCell;
  expandedIds.value = controller.expandedIds;
  onBeforeUnmount(() => controller.destroy());
  return { focusedCell, expandedIds, controller };
}

export function useMenubar(options: MenubarOptions) {
  const activeMenu = ref<string | null>(options.activeMenu ?? options.defaultActiveMenu ?? null);
  const controller: MenubarController = createMenubarController({
    ...options,
    onActiveMenuChange: (next) => {
      activeMenu.value = next;
      options.onActiveMenuChange?.(next);
    },
  });
  activeMenu.value = controller.activeMenu;
  onBeforeUnmount(() => controller.destroy());
  return { activeMenu, controller };
}

export function useFeed(options: FeedOptions) {
  const focusedIndex = ref(options.defaultFocusedIndex ?? 0);
  const busy = ref(Boolean(options.busy));
  const controller: FeedController = createFeedController({
    ...options,
    onFocusedIndexChange: (next) => {
      focusedIndex.value = next;
      options.onFocusedIndexChange?.(next);
    },
  });
  focusedIndex.value = controller.focusedIndex;
  onBeforeUnmount(() => controller.destroy());
  return { focusedIndex, busy, controller };
}

export function useKanban<T = unknown>(options: KanbanOptions<T>) {
  const columns = ref<readonly KanbanColumn<T>[]>(options.columns) as unknown as Ref<readonly KanbanColumn<T>[]>;
  const grabbedCardId = ref<string | null>(null);
  const announcement = ref('');
  const controller: KanbanController<T> = createKanbanController<T>({
    ...options,
    onColumnsChange: (next) => {
      columns.value = next;
      options.onColumnsChange?.(next);
    },
    onAnnounce: (msg) => {
      announcement.value = msg;
      grabbedCardId.value = controller.grabbedCardId;
      options.onAnnounce?.(msg);
    },
  });
  columns.value = controller.columns;
  onBeforeUnmount(() => controller.destroy());
  return { columns, grabbedCardId, announcement, controller };
}

export function useCommandBar(options: CommandBarOptions) {
  const visibleItems = ref<readonly CommandBarItem[]>([]) as unknown as Ref<readonly CommandBarItem[]>;
  const overflowItems = ref<readonly CommandBarItem[]>([]) as unknown as Ref<readonly CommandBarItem[]>;
  const controller: CommandBarController = createCommandBarController({
    ...options,
    onOverflowChange: (visibleIds, overflowIds) => {
      visibleItems.value = controller.visibleItems;
      overflowItems.value = controller.overflowItems;
      options.onOverflowChange?.(visibleIds, overflowIds);
    },
  });
  visibleItems.value = controller.visibleItems;
  overflowItems.value = controller.overflowItems;
  onBeforeUnmount(() => controller.destroy());
  return { visibleItems, overflowItems, controller };
}

export function useOtpInput(options: OtpInputOptions = {}) {
  const value = ref(options.value ?? options.defaultValue ?? '');
  const values = ref<string[]>([]);
  const isComplete = ref(false);
  const controller: OtpInputController = createOtpInputController({
    ...options,
    onValueChange: (next) => {
      value.value = next;
      values.value = controller.values;
      isComplete.value = controller.isComplete;
      options.onValueChange?.(next);
    },
  });
  value.value = controller.value;
  values.value = controller.values;
  isComplete.value = controller.isComplete;
  onBeforeUnmount(() => controller.destroy());
  return { value, values, isComplete, controller };
}

export function useSignaturePad(options: SignaturePadOptions = {}) {
  const strokes = ref<readonly SignatureStroke[]>([]) as unknown as Ref<readonly SignatureStroke[]>;
  const isEmpty = ref(true);
  const controller: SignaturePadController = createSignaturePadController({
    ...options,
    onStrokesChange: (next) => {
      strokes.value = next;
      isEmpty.value = next.length === 0;
      options.onStrokesChange?.(next);
    },
  });
  onBeforeUnmount(() => controller.destroy());
  return { strokes, isEmpty, controller };
}

export function useQrCode(options: QrCodeOptions) {
  const value = ref(options.value);
  const matrix = ref<boolean[][]>([]);
  const controller: QrCodeController = createQrCodeController({
    ...options,
    onValueChange: (next) => {
      value.value = next;
      matrix.value = controller.matrix;
      options.onValueChange?.(next);
    },
  });
  matrix.value = controller.matrix;
  onBeforeUnmount(() => controller.destroy());
  return { value, matrix, controller };
}

export function useBottomSheet(options: BottomSheetOptions = {}) {
  const open = ref(options.open ?? options.defaultOpen ?? false);
  const snapIndex = ref(options.snapIndex ?? options.defaultSnapIndex ?? 0);
  const snapPoint = ref(0.35);
  const controller: BottomSheetController = createBottomSheetController({
    ...options,
    onOpenChange: (next) => {
      open.value = next;
      options.onOpenChange?.(next);
    },
    onSnapIndexChange: (index, point) => {
      snapIndex.value = index;
      snapPoint.value = point;
      options.onSnapIndexChange?.(index, point);
    },
  });
  open.value = controller.open;
  snapIndex.value = controller.snapIndex;
  snapPoint.value = controller.snapPoint;
  onBeforeUnmount(() => controller.destroy());
  return { open, snapIndex, snapPoint, controller };
}

export function useNotificationCenter(options: NotificationCenterOptions = {}) {
  const items = ref<readonly NotificationItem[]>([]) as unknown as Ref<readonly NotificationItem[]>;
  const unreadCount = ref(0);
  const controller: NotificationCenterController = createNotificationCenterController({
    ...options,
    onChange: (next) => {
      items.value = next;
      unreadCount.value = controller.unreadCount;
      options.onChange?.(next);
    },
  });
  items.value = controller.items;
  unreadCount.value = controller.unreadCount;
  onBeforeUnmount(() => controller.destroy());
  return { items, unreadCount, controller };
}
