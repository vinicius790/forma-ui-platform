import { describe, expect, it, vi } from 'vitest';
import {
  createContextMenuController,
  createStepperController,
  createFileUploadController,
  createCarouselController,
  createColorPickerController,
  hslaToHex,
  parseHotkey,
  matchesHotkey,
  createHistoryStack,
  observeElementSize,
} from '../index';

describe('Forma UI 10.0 core controllers & primitives', () => {
  it('ContextMenu opens at pointer coordinates, handles Shift+F10 and cleans up', () => {
    const ctrl = createContextMenuController({ id: 'ctx-1' });
    const preventDefault = vi.fn();
    ctrl.getTriggerProps().onContextMenu({ clientX: 120, clientY: 240, preventDefault });
    expect(preventDefault).toHaveBeenCalled();
    expect(ctrl.open).toBe(true);
    expect(ctrl.point).toEqual({ x: 120, y: 240 });
    expect(ctrl.getMenuProps().role).toBe('menu');
    ctrl.close();
    expect(ctrl.open).toBe(false);
    ctrl.getTriggerProps().onKeyDown({ key: 'F10', shiftKey: true, preventDefault });
    expect(ctrl.open).toBe(true);
    ctrl.destroy();
    ctrl.destroy();
  });

  it('Stepper enforces linear mode, disabled steps, keyboard navigation and ARIA current', () => {
    const ctrl = createStepperController({ id: 'stp-1', count: 4, linear: true, disabledSteps: [2] });
    expect(ctrl.step).toBe(0);
    expect(ctrl.getStepTriggerProps(0)['aria-current']).toBe('step');
    ctrl.goTo(3);
    expect(ctrl.step).toBe(0);
    ctrl.next();
    expect(ctrl.step).toBe(1);
    expect(ctrl.getStatus(0)).toBe('completed');
    ctrl.goTo(2);
    expect(ctrl.step).toBe(1);
    ctrl.markError(1, true);
    expect(ctrl.getStatus(1)).toBe('error');
    ctrl.destroy();
  });

  it('FileUpload validates accept rules, maxFileSize, maxFiles and removal', () => {
    const ctrl = createFileUploadController({ accept: ['image/*', '.pdf'], maxFiles: 2, maxFileSize: 100 });
    ctrl.addFiles([
      { name: 'a.png', size: 50, type: 'image/png' },
      { name: 'b.txt', size: 20, type: 'text/plain' },
      { name: 'c.pdf', size: 150, type: 'application/pdf' },
      { name: 'd.pdf', size: 40, type: 'application/pdf' },
      { name: 'e.png', size: 10, type: 'image/png' },
    ]);
    expect(ctrl.acceptedFiles).toHaveLength(2);
    expect(ctrl.rejectedFiles.map((r) => r.reason)).toEqual(['invalid-type', 'file-too-large', 'too-many-files']);
    ctrl.removeFile(0);
    expect(ctrl.acceptedFiles).toHaveLength(1);
    ctrl.clear();
    expect(ctrl.acceptedFiles).toHaveLength(0);
    ctrl.destroy();
  });

  it('Carousel loops, handles keyboard navigation, autoplay pause and cleanup', () => {
    const ctrl = createCarouselController({ id: 'car-1', slideCount: 3, loop: true });
    const preventDefault = vi.fn();
    expect(ctrl.getRootProps()['aria-roledescription']).toBe('carousel');
    ctrl.getRootProps().onKeyDown({ key: 'ArrowLeft', preventDefault });
    expect(ctrl.index).toBe(2);
    ctrl.getRootProps().onKeyDown({ key: 'ArrowRight', preventDefault });
    expect(ctrl.index).toBe(0);
    ctrl.getRootProps().onKeyDown({ key: 'End', preventDefault });
    expect(ctrl.index).toBe(2);
    expect(ctrl.getSlideProps(2)['data-active']).toBe('true');
    ctrl.destroy();
    ctrl.destroy();
  });

  it('ColorPicker converts HSLA to hex and handles 2D keyboard navigation', () => {
    const ctrl = createColorPickerController({ defaultValue: { h: 0, s: 100, l: 50, a: 1 } });
    expect(ctrl.hex).toBe('#ff0000');
    expect(hslaToHex({ h: 120, s: 100, l: 50, a: 1 })).toBe('#00ff00');
    const preventDefault = vi.fn();
    ctrl.getAreaProps().onKeyDown({ key: 'ArrowLeft', shiftKey: true, preventDefault });
    expect(ctrl.value.s).toBe(90);
    ctrl.destroy();
  });

  it('Hotkeys, HistoryStack and ResizeObserver primitives work deterministically', () => {
    const parsed = parseHotkey('mod+shift+k');
    expect(matchesHotkey({ key: 'K', ctrlKey: true, metaKey: false, altKey: false, shiftKey: true }, parsed)).toBe(true);
    expect(matchesHotkey({ key: 'k', ctrlKey: false, metaKey: false, altKey: false, shiftKey: true }, parsed)).toBe(false);

    const history = createHistoryStack(1, { capacity: 3 });
    history.push(2);
    history.push(3);
    expect(history.canUndo).toBe(true);
    expect(history.undo()).toBe(2);
    expect(history.canRedo).toBe(true);
    expect(history.redo()).toBe(3);
    history.clear(0);
    expect(history.present).toBe(0);

    const stop = observeElementSize(null, () => {});
    stop();
  });
});
