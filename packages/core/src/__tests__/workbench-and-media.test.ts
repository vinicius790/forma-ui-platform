import { describe, expect, it, vi } from 'vitest';
import {
  createDockController,
  createTimelineController,
  createDiffViewerController,
  createMentionController,
  createSpatialCanvasController,
  createAudioPlayerController,
  createCodeGutterController,
  createWizardDialogController,
  findSpatialCandidate,
  runChunkedWork,
  createUrlStateCodec,
} from '../index';

describe('Forma UI 100.0 centennial controllers & primitives', () => {
  it('Dock manages panes, tabs, split, maximize and serialization', () => {
    const dock = createDockController({
      panes: [{ id: 'p1', tabs: [{ id: 't1', title: 'Main' }, { id: 't2', title: 'Logs' }], activeTabId: 't1' }],
    });
    dock.splitPane('p2', { id: 't3', title: 'Inspector' });
    expect(dock.panes).toHaveLength(2);
    expect(dock.closeTab('p1', 't1')).toBe(true);
    dock.toggleMaximize('p2');
    expect(dock.maximizedPane).toBe('p2');
    expect(dock.serialize()).toContain('Inspector');
    dock.destroy();
  });

  it('Timeline scrubs playhead with keyboard arrows and calculates percent', () => {
    const tl = createTimelineController({ items: [{ id: 'i1', label: 'Intro', start: 0, end: 50 }], minTime: 0, maxTime: 100, step: 5 });
    const pd = vi.fn();
    tl.getPlayheadProps().onKeyDown({ key: 'ArrowRight', shiftKey: true, preventDefault: pd });
    expect(tl.playhead).toBe(50);
    expect(tl.timeToPercent(50)).toBe(50);
    tl.destroy();
  });

  it('DiffViewer computes LCS line diffs and jumps across changes', () => {
    const diff = createDiffViewerController({ original: 'a\nb\nc', modified: 'a\nx\nc\nd' });
    expect(diff.stats).toEqual({ added: 2, removed: 1, unchanged: 2 });
    expect(diff.nextChangeLineIndex()).toBeGreaterThanOrEqual(0);
    diff.destroy();
  });

  it('MentionController extracts @trigger, filters candidates and inserts cleanly', () => {
    const m = createMentionController({ candidates: [{ id: '1', label: 'alice' }, { id: '2', label: 'bob' }] });
    m.updateText('Hello @al', 9);
    expect(m.open).toBe(true);
    const res = m.selectCandidate(0);
    expect(res?.text).toBe('Hello @alice ');
    m.destroy();
  });

  it('SpatialCanvas zooms around focal point and pans via keyboard', () => {
    const sc = createSpatialCanvasController({ panStep: 20 });
    sc.zoomAt(2, 100, 100);
    expect(sc.transform.zoom).toBe(2);
    sc.getCanvasProps().onKeyDown({ key: '0', preventDefault: vi.fn() });
    expect(sc.transform).toEqual({ x: 0, y: 0, zoom: 1 });
    sc.destroy();
  });

  it('AudioPlayer scrubs via arrows and number keys and formats time', () => {
    const ap = createAudioPlayerController({ duration: 100, seekStepSeconds: 10 });
    ap.getScrubberProps().onKeyDown({ key: '5', preventDefault: vi.fn() });
    expect(ap.state.currentTime).toBe(50);
    expect(ap.getScrubberProps()['aria-valuetext']).toBe('00:50 of 01:40');
    ap.destroy();
  });

  it('CodeGutter folds ranges and toggles breakpoints', () => {
    const cg = createCodeGutterController({ lineCount: 6, foldRanges: [{ startLine: 2, endLine: 4 }] });
    cg.toggleFold(2);
    expect(cg.getVisibleLines()).toEqual([1, 2, 5, 6]);
    cg.toggleBreakpoint(5);
    expect(cg.breakpoints).toEqual([5]);
    cg.destroy();
  });

  it('WizardDialog enforces dirty-close confirmation and async submit', async () => {
    const wd = createWizardDialogController({ dirty: true, onConfirm: async () => {} });
    wd.show();
    expect(wd.requestClose()).toBe(false);
    expect(wd.phase).toBe('confirming');
    expect(await wd.confirm()).toBe(true);
    expect(wd.open).toBe(false);
    wd.destroy();
  });

  it('SpatialNav, ChunkedScheduler and URL State Codec work deterministically', async () => {
    const hit = findSpatialCandidate(
      { id: 'a', x: 0, y: 0, width: 50, height: 50 },
      [{ id: 'b', x: 100, y: 0, width: 50, height: 50 }, { id: 'c', x: 100, y: 200, width: 50, height: 50 }],
      'right',
    );
    expect(hit?.id).toBe('b');
    expect(await runChunkedWork([1, 2, 3], () => {}, 2)).toBe(3);
    const codec = createUrlStateCodec({ page: 1, sort: 'asc', active: false });
    const qs = codec.encode({ page: 3, active: true });
    expect(codec.decode(qs)).toEqual({ page: 3, sort: 'asc', active: true });
  });
});
