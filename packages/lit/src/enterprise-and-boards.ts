import type { ReactiveControllerHost } from 'lit';
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
  type TreeGridController,
  type TreeGridOptions,
} from '@forma-ui/core';
import { FormaCallbackBridge } from './index';

export function createLitTreeGrid(
  host: ReactiveControllerHost,
  options: TreeGridOptions,
): FormaCallbackBridge<TreeGridController> {
  return new FormaCallbackBridge(host, (notify) =>
    createTreeGridController({
      ...options,
      onExpandedChange: (ids) => {
        notify();
        options.onExpandedChange?.(ids);
      },
      onFocusChange: (cell) => {
        notify();
        options.onFocusChange?.(cell);
      },
    }),
  );
}

export function createLitMenubar(
  host: ReactiveControllerHost,
  options: MenubarOptions,
): FormaCallbackBridge<MenubarController> {
  return new FormaCallbackBridge(host, (notify) =>
    createMenubarController({
      ...options,
      onActiveMenuChange: (menuId) => {
        notify();
        options.onActiveMenuChange?.(menuId);
      },
    }),
  );
}

export function createLitFeed(
  host: ReactiveControllerHost,
  options: FeedOptions,
): FormaCallbackBridge<FeedController> {
  return new FormaCallbackBridge(host, (notify) =>
    createFeedController({
      ...options,
      onFocusedIndexChange: (index) => {
        notify();
        options.onFocusedIndexChange?.(index);
      },
    }),
  );
}

export function createLitKanban<T = unknown>(
  host: ReactiveControllerHost,
  options: KanbanOptions<T>,
): FormaCallbackBridge<KanbanController<T>> {
  return new FormaCallbackBridge(host, (notify) =>
    createKanbanController<T>({
      ...options,
      onColumnsChange: (columns) => {
        notify();
        options.onColumnsChange?.(columns);
      },
      onAnnounce: (message) => {
        notify();
        options.onAnnounce?.(message);
      },
    }),
  );
}

export function createLitCommandBar(
  host: ReactiveControllerHost,
  options: CommandBarOptions,
): FormaCallbackBridge<CommandBarController> {
  return new FormaCallbackBridge(host, (notify) =>
    createCommandBarController({
      ...options,
      onOverflowChange: (visibleIds, overflowIds) => {
        notify();
        options.onOverflowChange?.(visibleIds, overflowIds);
      },
    }),
  );
}

export function createLitOtpInput(
  host: ReactiveControllerHost,
  options: OtpInputOptions = {},
): FormaCallbackBridge<OtpInputController> {
  return new FormaCallbackBridge(host, (notify) =>
    createOtpInputController({
      ...options,
      onValueChange: (value) => {
        notify();
        options.onValueChange?.(value);
      },
    }),
  );
}

export function createLitSignaturePad(
  host: ReactiveControllerHost,
  options: SignaturePadOptions = {},
): FormaCallbackBridge<SignaturePadController> {
  return new FormaCallbackBridge(host, (notify) =>
    createSignaturePadController({
      ...options,
      onStrokesChange: (strokes) => {
        notify();
        options.onStrokesChange?.(strokes);
      },
    }),
  );
}

export function createLitQrCode(
  host: ReactiveControllerHost,
  options: QrCodeOptions,
): FormaCallbackBridge<QrCodeController> {
  return new FormaCallbackBridge(host, (notify) =>
    createQrCodeController({
      ...options,
      onValueChange: (value) => {
        notify();
        options.onValueChange?.(value);
      },
    }),
  );
}

export function createLitBottomSheet(
  host: ReactiveControllerHost,
  options: BottomSheetOptions = {},
): FormaCallbackBridge<BottomSheetController> {
  return new FormaCallbackBridge(host, (notify) =>
    createBottomSheetController({
      ...options,
      onOpenChange: (open) => {
        notify();
        options.onOpenChange?.(open);
      },
      onSnapIndexChange: (index, point) => {
        notify();
        options.onSnapIndexChange?.(index, point);
      },
    }),
  );
}

export function createLitNotificationCenter(
  host: ReactiveControllerHost,
  options: NotificationCenterOptions = {},
): FormaCallbackBridge<NotificationCenterController> {
  return new FormaCallbackBridge(host, (notify) =>
    createNotificationCenterController({
      ...options,
      onChange: (items) => {
        notify();
        options.onChange?.(items);
      },
    }),
  );
}
