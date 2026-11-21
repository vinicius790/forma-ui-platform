import { describe, expect, it, vi } from 'vitest';
import {
  createCollapsibleController,
  createPopoverController,
  createDrawerController,
  createSplitterController,
  createHoverCardController,
  createClipboardController,
  matchMediaQuery,
  observeMediaQuery,
} from '../index';

describe('Forma UI 1.0 core controllers & primitives', () => {
  it('Collapsible handles controlled/uncontrolled, disabled, ARIA and cleanup', () => {
    const onOpenChange = vi.fn();
    const ctrl = createCollapsibleController({ id: 'col-1', onOpenChange });
    expect(ctrl.open).toBe(false);
    expect(ctrl.getTriggerProps()['aria-expanded']).toBe(false);
    expect(ctrl.getTriggerProps()['aria-controls']).toBe('col-1-content');
    ctrl.toggle();
    expect(ctrl.open).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    ctrl.updateOptions({ disabled: true });
    ctrl.toggle();
    expect(ctrl.open).toBe(true);
    ctrl.destroy();
    ctrl.destroy();
  });

  it('Popover exposes dialog ARIA props, toggles and cleans up idempotently', () => {
    const onOpenChange = vi.fn();
    const ctrl = createPopoverController({ id: 'pop-1', modal: true, onOpenChange });
    expect(ctrl.getTriggerProps()['aria-haspopup']).toBe('dialog');
    expect(ctrl.getContentProps().role).toBe('dialog');
    expect(ctrl.getContentProps()['aria-modal']).toBe('true');
    ctrl.toggle();
    expect(ctrl.open).toBe(true);
    ctrl.close();
    expect(ctrl.open).toBe(false);
    ctrl.destroy();
    ctrl.setOpen(true);
    expect(ctrl.open).toBe(false);
  });

  it('Drawer exposes placement, title/description IDs and modal cleanup', () => {
    const ctrl = createDrawerController({ id: 'drw-1', placement: 'left' });
    expect(ctrl.placement).toBe('left');
    expect(ctrl.getContentProps()['data-placement']).toBe('left');
    expect(ctrl.getContentProps()['aria-labelledby']).toBe(ctrl.getTitleProps().id);
    expect(ctrl.getContentProps()['aria-describedby']).toBe(ctrl.getDescriptionProps().id);
    ctrl.setOpen(true);
    expect(ctrl.open).toBe(true);
    ctrl.getCloseProps().onClick();
    expect(ctrl.open).toBe(false);
    ctrl.destroy();
  });

  it('Splitter handles keyboard navigation, clamping, shift largeStep and Enter collapse', () => {
    const onValueChange = vi.fn();
    const ctrl = createSplitterController({
      id: 'spl-1',
      defaultValue: 50,
      min: 10,
      max: 90,
      step: 5,
      largeStep: 20,
      onValueChange,
    });
    const preventDefault = vi.fn();
    ctrl.handleKeyDown({ key: 'ArrowRight', shiftKey: false, preventDefault });
    expect(ctrl.value).toBe(55);
    ctrl.handleKeyDown({ key: 'ArrowLeft', shiftKey: true, preventDefault });
    expect(ctrl.value).toBe(35);
    ctrl.handleKeyDown({ key: 'Home', shiftKey: false, preventDefault });
    expect(ctrl.value).toBe(10);
    ctrl.handleKeyDown({ key: 'End', shiftKey: false, preventDefault });
    expect(ctrl.value).toBe(90);
    ctrl.handleKeyDown({ key: 'Enter', shiftKey: false, preventDefault });
    expect(ctrl.value).toBe(10);
    ctrl.handleKeyDown({ key: 'Enter', shiftKey: false, preventDefault });
    expect(ctrl.value).toBe(90);
    expect(ctrl.getHandleProps().role).toBe('separator');
    expect(ctrl.getHandleProps()['aria-valuenow']).toBe(90);
    ctrl.destroy();
  });

  it('HoverCard schedules open/close timers, handles Escape and cancels timers on destroy', () => {
    vi.useFakeTimers();
    const ctrl = createHoverCardController({ id: 'hc-1', openDelay: 100, closeDelay: 50 });
    ctrl.scheduleOpen();
    expect(ctrl.open).toBe(false);
    vi.advanceTimersByTime(100);
    expect(ctrl.open).toBe(true);
    ctrl.getTriggerProps().onKeyDown({ key: 'Escape' });
    expect(ctrl.open).toBe(false);
    ctrl.scheduleOpen();
    ctrl.destroy();
    vi.advanceTimersByTime(200);
    expect(ctrl.open).toBe(false);
    vi.useRealTimers();
  });

  it('Clipboard and MediaQuery primitives are SSR-safe and idempotent', () => {
    const clip = createClipboardController({ timeout: 50 });
    expect(clip.status).toBe('idle');
    clip.reset();
    clip.destroy();
    expect(matchMediaQuery('(min-width: 768px)', undefined)).toBeTypeOf('boolean');
    const sub = observeMediaQuery('(prefers-reduced-motion: reduce)', () => {});
    sub.destroy();
    sub.destroy();
  });
});
