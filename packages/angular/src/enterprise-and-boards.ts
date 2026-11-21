import { DestroyRef, inject, signal } from '@angular/core';
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
import { ownFormaController } from './index';

export function injectTreeGrid(options: TreeGridOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  const focusedCell = signal<TreeGridCellCoord>(options.focusedCell ?? { rowIndex: 0, colIndex: 0 });
  const expandedIds = signal<string[]>([...(options.expandedIds ?? options.defaultExpandedIds ?? [])]);
  const controller: TreeGridController = ownFormaController(
    () =>
      createTreeGridController({
        ...options,
        onFocusChange: (next) => {
          focusedCell.set(next);
          options.onFocusChange?.(next);
        },
        onExpandedChange: (next) => {
          expandedIds.set(next);
          options.onExpandedChange?.(next);
        },
      }),
    destroyRef,
  );
  focusedCell.set(controller.focusedCell);
  expandedIds.set(controller.expandedIds);
  return { focusedCell: focusedCell.asReadonly(), expandedIds: expandedIds.asReadonly(), controller };
}

export function injectMenubar(options: MenubarOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  const activeMenu = signal<string | null>(options.activeMenu ?? options.defaultActiveMenu ?? null);
  const controller: MenubarController = ownFormaController(
    () =>
      createMenubarController({
        ...options,
        onActiveMenuChange: (next) => {
          activeMenu.set(next);
          options.onActiveMenuChange?.(next);
        },
      }),
    destroyRef,
  );
  activeMenu.set(controller.activeMenu);
  return { activeMenu: activeMenu.asReadonly(), controller };
}

export function injectFeed(options: FeedOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  const focusedIndex = signal(options.defaultFocusedIndex ?? 0);
  const busy = signal(Boolean(options.busy));
  const controller: FeedController = ownFormaController(
    () =>
      createFeedController({
        ...options,
        onFocusedIndexChange: (next) => {
          focusedIndex.set(next);
          options.onFocusedIndexChange?.(next);
        },
      }),
    destroyRef,
  );
  focusedIndex.set(controller.focusedIndex);
  return { focusedIndex: focusedIndex.asReadonly(), busy: busy.asReadonly(), controller };
}

export function injectKanban<T = unknown>(options: KanbanOptions<T>, destroyRef: DestroyRef = inject(DestroyRef)) {
  const columns = signal<readonly KanbanColumn<T>[]>(options.columns);
  const grabbedCardId = signal<string | null>(null);
  const announcement = signal('');
  const controller: KanbanController<T> = ownFormaController<KanbanController<T>>(
    () =>
      createKanbanController<T>({
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
      }),
    destroyRef,
  );
  columns.set(controller.columns);
  return {
    columns: columns.asReadonly(),
    grabbedCardId: grabbedCardId.asReadonly(),
    announcement: announcement.asReadonly(),
    controller,
  };
}

export function injectCommandBar(options: CommandBarOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  const visibleItems = signal<readonly CommandBarItem[]>([]);
  const overflowItems = signal<readonly CommandBarItem[]>([]);
  const controller: CommandBarController = ownFormaController<CommandBarController>(
    () =>
      createCommandBarController({
        ...options,
        onOverflowChange: (visibleIds, overflowIds) => {
          visibleItems.set(controller.visibleItems);
          overflowItems.set(controller.overflowItems);
          options.onOverflowChange?.(visibleIds, overflowIds);
        },
      }),
    destroyRef,
  );
  visibleItems.set(controller.visibleItems);
  overflowItems.set(controller.overflowItems);
  return {
    visibleItems: visibleItems.asReadonly(),
    overflowItems: overflowItems.asReadonly(),
    controller,
  };
}

export function injectOtpInput(options: OtpInputOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const value = signal(options.value ?? options.defaultValue ?? '');
  const values = signal<string[]>([]);
  const isComplete = signal(false);
  const controller: OtpInputController = ownFormaController<OtpInputController>(
    () =>
      createOtpInputController({
        ...options,
        onValueChange: (next) => {
          value.set(next);
          values.set(controller.values);
          isComplete.set(controller.isComplete);
          options.onValueChange?.(next);
        },
      }),
    destroyRef,
  );
  value.set(controller.value);
  values.set(controller.values);
  isComplete.set(controller.isComplete);
  return {
    value: value.asReadonly(),
    values: values.asReadonly(),
    isComplete: isComplete.asReadonly(),
    controller,
  };
}

export function injectSignaturePad(options: SignaturePadOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const strokes = signal<readonly SignatureStroke[]>([]);
  const isEmpty = signal(true);
  const controller: SignaturePadController = ownFormaController(
    () =>
      createSignaturePadController({
        ...options,
        onStrokesChange: (next) => {
          strokes.set(next);
          isEmpty.set(next.length === 0);
          options.onStrokesChange?.(next);
        },
      }),
    destroyRef,
  );
  return { strokes: strokes.asReadonly(), isEmpty: isEmpty.asReadonly(), controller };
}

export function injectQrCode(options: QrCodeOptions, destroyRef: DestroyRef = inject(DestroyRef)) {
  const value = signal(options.value);
  const matrix = signal<boolean[][]>([]);
  const controller: QrCodeController = ownFormaController<QrCodeController>(
    () =>
      createQrCodeController({
        ...options,
        onValueChange: (next) => {
          value.set(next);
          matrix.set(controller.matrix);
          options.onValueChange?.(next);
        },
      }),
    destroyRef,
  );
  matrix.set(controller.matrix);
  return { value: value.asReadonly(), matrix: matrix.asReadonly(), controller };
}

export function injectBottomSheet(options: BottomSheetOptions = {}, destroyRef: DestroyRef = inject(DestroyRef)) {
  const open = signal(options.open ?? options.defaultOpen ?? false);
  const snapIndex = signal(options.snapIndex ?? options.defaultSnapIndex ?? 0);
  const snapPoint = signal(0.35);
  const controller: BottomSheetController = ownFormaController(
    () =>
      createBottomSheetController({
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
      }),
    destroyRef,
  );
  open.set(controller.open);
  snapIndex.set(controller.snapIndex);
  snapPoint.set(controller.snapPoint);
  return {
    open: open.asReadonly(),
    snapIndex: snapIndex.asReadonly(),
    snapPoint: snapPoint.asReadonly(),
    controller,
  };
}

export function injectNotificationCenter(
  options: NotificationCenterOptions = {},
  destroyRef: DestroyRef = inject(DestroyRef),
) {
  const items = signal<readonly NotificationItem[]>([]);
  const unreadCount = signal(0);
  const controller: NotificationCenterController = ownFormaController<NotificationCenterController>(
    () =>
      createNotificationCenterController({
        ...options,
        onChange: (next) => {
          items.set(next);
          unreadCount.set(controller.unreadCount);
          options.onChange?.(next);
        },
      }),
    destroyRef,
  );
  items.set(controller.items);
  unreadCount.set(controller.unreadCount);
  return { items: items.asReadonly(), unreadCount: unreadCount.asReadonly(), controller };
}
