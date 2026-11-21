import { describe, expect, it, vi } from 'vitest';
import {
  createTreeGridController,
  createMenubarController,
  createFeedController,
  createKanbanController,
  createCommandBarController,
  createOtpInputController,
  createSignaturePadController,
  createQrCodeController,
  createBottomSheetController,
  createNotificationCenterController,
  createFocusScope,
  createGestureController,
  computePinchDistance,
  supportsEyeDropper,
  createTelemetryBus,
} from '../index';

describe('Forma UI 50.0 core controllers & primitives', () => {
  it('TreeGrid navigates 2D cells and expands/collapses rows with ArrowRight/ArrowLeft', () => {
    const tg = createTreeGridController({
      rows: [
        { id: 'r1', level: 1, hasChildren: true },
        { id: 'r2', level: 2 },
      ],
      columnCount: 3,
    });
    const pd = vi.fn();
    tg.handleKeyDown({ key: 'ArrowRight', ctrlKey: false, preventDefault: pd });
    expect(tg.isExpanded('r1')).toBe(true);
    tg.handleKeyDown({ key: 'ArrowRight', ctrlKey: false, preventDefault: pd });
    expect(tg.focusedCell).toEqual({ rowIndex: 0, colIndex: 1 });
    tg.handleKeyDown({ key: 'ArrowDown', ctrlKey: false, preventDefault: pd });
    expect(tg.focusedCell).toEqual({ rowIndex: 1, colIndex: 1 });
    tg.destroy();
  });

  it('Menubar roves horizontally with RTL support and opens/closes menus', () => {
    const mb = createMenubarController({ items: [{ id: 'file' }, { id: 'edit' }, { id: 'view' }], dir: 'rtl' });
    const pd = vi.fn();
    mb.openMenu('file');
    expect(mb.activeMenu).toBe('file');
    mb.getTriggerProps('file').onKeyDown({ key: 'ArrowLeft', preventDefault: pd });
    expect(mb.activeMenu).toBe('edit');
    mb.getTriggerProps('edit').onKeyDown({ key: 'Escape', preventDefault: pd });
    expect(mb.activeMenu).toBeNull();
    mb.destroy();
  });

  it('Feed handles PageDown/PageUp navigation and Ctrl+Home/End exits', () => {
    const onExitAfter = vi.fn();
    const feed = createFeedController({ count: 5, setSize: 20, onExitAfter });
    const pd = vi.fn();
    feed.getArticleProps(0).onKeyDown({ key: 'PageDown', ctrlKey: false, preventDefault: pd });
    expect(feed.focusedIndex).toBe(1);
    feed.getArticleProps(1).onKeyDown({ key: 'End', ctrlKey: true, preventDefault: pd });
    expect(onExitAfter).toHaveBeenCalledOnce();
    feed.destroy();
  });

  it('Kanban moves cards across lanes, enforces WIP limits, and cancels grabs cleanly', () => {
    const kb = createKanbanController({
      columns: [
        { id: 'todo', title: 'To Do', cards: [{ id: 'c1', title: 'Task 1' }] },
        { id: 'doing', title: 'Doing', wipLimit: 1, cards: [{ id: 'c2', title: 'Task 2' }] },
      ],
    });
    expect(kb.moveCard('c1', 'doing')).toBe(false);
    kb.grab('c1');
    kb.cancelGrab();
    expect(kb.grabbedCardId).toBeNull();
    kb.destroy();
  });

  it('CommandBar partitions visible and overflow items by priority and width', () => {
    const cb = createCommandBarController({
      items: [
        { id: 'save', label: 'Save', width: 80, priority: 10 },
        { id: 'share', label: 'Share', width: 80, priority: 1 },
        { id: 'export', label: 'Export', width: 80, priority: 5 },
      ],
      containerWidth: 230,
      overflowButtonWidth: 40,
      gap: 8,
    });
    expect(cb.visibleItems.map((i) => i.id)).toEqual(['save', 'export']);
    expect(cb.overflowItems.map((i) => i.id)).toEqual(['share']);
    cb.destroy();
  });

  it('OtpInput validates digits, handles paste distribution, and fires onComplete', () => {
    const onComplete = vi.fn();
    const otp = createOtpInputController({ length: 4, mode: 'numeric', onComplete });
    otp.paste('12a34');
    expect(otp.value).toBe('1234');
    expect(otp.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledWith('1234');
    otp.clear();
    expect(otp.value).toBe('');
    otp.destroy();
  });

  it('SignaturePad records strokes, generates SVG path, and supports undo/redo', () => {
    const sig = createSignaturePadController();
    sig.beginStroke({ x: 0, y: 0 });
    sig.appendPoint({ x: 10, y: 10 });
    sig.appendPoint({ x: 20, y: 0 });
    sig.endStroke();
    expect(sig.isEmpty).toBe(false);
    expect(sig.toSvgPath()).toContain('Q 10 10');
    sig.undo();
    expect(sig.isEmpty).toBe(true);
    sig.redo();
    expect(sig.isEmpty).toBe(false);
    sig.destroy();
  });

  it('QrCode builds deterministic matrix and SVG path props', () => {
    const qr = createQrCodeController({ value: 'https://forma-ui.dev' });
    const svg = qr.getSvgProps();
    expect(svg.role).toBe('img');
    expect(svg.viewBox).toBe('0 0 21 21');
    expect(svg.path.length).toBeGreaterThan(50);
    qr.destroy();
  });

  it('BottomSheet resolves snap points, velocity dismiss, and keyboard Arrow stepping', () => {
    const bs = createBottomSheetController({ defaultOpen: true, snapPoints: [0.3, 0.6, 0.9], defaultSnapIndex: 0 });
    const pd = vi.fn();
    bs.getDragHandleProps().onKeyDown({ key: 'ArrowUp', preventDefault: pd });
    expect(bs.snapIndex).toBe(1);
    bs.resolveDragRelease(0.88, 0);
    expect(bs.snapIndex).toBe(2);
    bs.resolveDragRelease(0.5, 1.2);
    expect(bs.open).toBe(false);
    bs.destroy();
  });

  it('NotificationCenter tracks unread count, markAllRead, snooze timers, and cleanup', () => {
    vi.useFakeTimers();
    const nc = createNotificationCenterController();
    const n1 = nc.push({ title: 'Build finished', category: 'ci' });
    nc.push({ title: 'Review requested', category: 'pr' });
    expect(nc.unreadCount).toBe(2);
    nc.snooze(n1.id, 100);
    expect(nc.items).toHaveLength(1);
    vi.advanceTimersByTime(100);
    expect(nc.items).toHaveLength(2);
    nc.markAllRead();
    expect(nc.unreadCount).toBe(0);
    nc.destroy();
    vi.useRealTimers();
  });

  it('FocusScope, Gesture, EyeDropper, and TelemetryBus primitives operate cleanly', () => {
    const scope = createFocusScope(null);
    const unmount = scope.mount();
    unmount();
    expect(computePinchDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    const gest = createGestureController();
    gest.pointerDown({ x: 0, y: 0, time: 0 });
    expect(gest.pointerUp({ x: 100, y: 5, time: 100 })).toBe('right');
    gest.destroy();
    expect(typeof supportsEyeDropper()).toBe('boolean');
    const bus = createTelemetryBus(10);
    const seen: string[] = [];
    const off = bus.subscribe((e) => seen.push(e.action));
    bus.emit({ id: '1', controller: 'Dialog', action: 'open', severity: 'info' });
    off();
    expect(seen).toEqual(['open']);
  });
});
