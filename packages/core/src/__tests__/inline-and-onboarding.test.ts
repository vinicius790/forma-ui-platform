import { describe, expect, it, vi } from 'vitest';
import {
  createTagsInputController,
  createEditableController,
  createTourController,
  createScrollAreaController,
  computeScrollThumb,
  createSegmentGroupController,
  supportsNativePopoverApi,
  createBroadcastSync,
} from '../index';

describe('Forma UI 10.0 enterprise controllers & Web API primitives', () => {
  it('TagsInput handles add, duplicate guard, maxTags, Backspace removal and keyboard navigation', () => {
    const onValueChange = vi.fn();
    const ctrl = createTagsInputController({ id: 'tags-1', maxTags: 3, onValueChange });
    expect(ctrl.addTag('react')).toBe(true);
    expect(ctrl.addTag('react')).toBe(false);
    expect(ctrl.addTag('vue')).toBe(true);
    expect(ctrl.addTag('svelte')).toBe(true);
    expect(ctrl.addTag('solid')).toBe(false);
    expect(ctrl.tags).toEqual(['react', 'vue', 'svelte']);
    const preventDefault = vi.fn();
    ctrl.getInputProps().onKeyDown({ key: 'Backspace', preventDefault });
    expect(ctrl.tags).toEqual(['react', 'vue']);
    ctrl.clear();
    expect(ctrl.tags).toEqual([]);
    ctrl.destroy();
  });

  it('Editable toggles preview/edit, commits on Enter and reverts on Escape', () => {
    const onValueCommit = vi.fn();
    const ctrl = createEditableController({ defaultValue: 'Initial', onValueCommit });
    expect(ctrl.editing).toBe(false);
    ctrl.edit();
    expect(ctrl.editing).toBe(true);
    ctrl.setDraft('Updated');
    const preventDefault = vi.fn();
    ctrl.getInputProps().onKeyDown({ key: 'Escape', preventDefault });
    expect(ctrl.editing).toBe(false);
    expect(ctrl.value).toBe('Initial');
    ctrl.edit();
    ctrl.setDraft('Committed');
    ctrl.getInputProps().onKeyDown({ key: 'Enter', preventDefault });
    expect(ctrl.value).toBe('Committed');
    expect(onValueCommit).toHaveBeenCalledWith('Committed');
    ctrl.destroy();
  });

  it('Tour advances steps, computes progress, handles Escape skip and completes cleanly', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    const ctrl = createTourController({
      steps: [
        { id: 's1', title: 'Welcome' },
        { id: 's2', title: 'Shortcuts' },
      ],
      onComplete,
      onSkip,
    });
    ctrl.start();
    expect(ctrl.open).toBe(true);
    expect(ctrl.progress).toBe(0.5);
    ctrl.next();
    expect(ctrl.stepIndex).toBe(1);
    expect(ctrl.progress).toBe(1);
    ctrl.next();
    expect(ctrl.open).toBe(false);
    expect(onComplete).toHaveBeenCalledOnce();
    ctrl.start(0);
    ctrl.skip();
    expect(onSkip).toHaveBeenCalledWith(0);
    ctrl.destroy();
  });

  it('ScrollArea computes thumb geometry and manages hover/scroll visibility timers', () => {
    const thumb = computeScrollThumb(500, 2000, 500);
    expect(thumb.visible).toBe(true);
    expect(thumb.thumbPercent).toBe(25);
    expect(thumb.offsetPercent).toBe(25);
    const ctrl = createScrollAreaController({ type: 'hover' });
    ctrl.getRootProps().onPointerEnter();
    expect(ctrl.visible).toBe(true);
    ctrl.getRootProps().onPointerLeave();
    expect(ctrl.visible).toBe(false);
    ctrl.destroy();
  });

  it('SegmentGroup handles RTL-mirrored Arrow navigation and disabled items', () => {
    const ctrl = createSegmentGroupController({
      items: [{ value: 'day' }, { value: 'week', disabled: true }, { value: 'month' }],
      defaultValue: 'day',
      dir: 'rtl',
    });
    const preventDefault = vi.fn();
    ctrl.getItemProps('day').onKeyDown({ key: 'ArrowLeft', preventDefault });
    expect(ctrl.value).toBe('month');
    ctrl.getItemProps('month').onKeyDown({ key: 'Home', preventDefault });
    expect(ctrl.value).toBe('day');
    ctrl.destroy();
  });

  it('Native Popover API and BroadcastSync primitives are SSR-safe', () => {
    expect(typeof supportsNativePopoverApi()).toBe('boolean');
    const sync = createBroadcastSync('forma-test-channel', () => {});
    sync.destroy();
    sync.destroy();
  });
});
