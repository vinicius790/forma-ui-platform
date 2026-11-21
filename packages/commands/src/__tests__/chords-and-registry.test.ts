import { describe, expect, it, vi } from 'vitest';
import {
  createChordSequenceTracker,
  createCommandHistory,
  createCommandRegistry,
} from '../index';

describe('commands v50 extensions', () => {
  it('tracks multi-key chords with prefix status, timeout reset, and idempotent destroy', () => {
    vi.useFakeTimers();
    try {
      const onInbox = vi.fn();
      const onReset = vi.fn();
      const tracker = createChordSequenceTracker(
        [
          { id: 'inbox', sequence: ['g', 'i'], onMatch: onInbox },
          { id: 'sent', sequence: ['g', 's'] },
        ],
        { timeoutMs: 250, onReset },
      );

      const first = tracker.feed('g');
      expect(first.status).toBe('pending');
      expect(tracker.isPending).toBe(true);

      const second = tracker.feed('i');
      expect(second.status).toBe('matched');
      expect(onInbox).toHaveBeenCalledTimes(1);
      expect(tracker.isPending).toBe(false);

      tracker.feed('g');
      vi.advanceTimersByTime(300);
      expect(tracker.isPending).toBe(false);
      expect(onReset).toHaveBeenCalledTimes(1);

      tracker.feed('g');
      tracker.destroy();
      tracker.destroy();
      vi.advanceTimersByTime(300);
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(tracker.feed('g').status).toBe('none');
    } finally {
      vi.useRealTimers();
    }
  });

  it('merges prioritized command sources with deduplication and abort safety', async () => {
    const registry = createCommandRegistry();
    const unregisterLow = registry.register({
      name: 'low',
      priority: 1,
      getItems: () => [
        { id: 'dup', label: 'Low' },
        { id: 'low-cmd', label: 'Low Cmd' },
      ],
    });
    registry.register({
      name: 'high',
      priority: 10,
      getItems: async () => [
        { id: 'dup', label: 'High' },
        { id: 'high-cmd', label: 'High Cmd' },
      ],
    });

    const items = await registry.resolveAll('');
    expect(items.map((item) => `${item.id}:${item.label}`)).toEqual([
      'dup:High',
      'high-cmd:High Cmd',
      'low-cmd:Low Cmd',
    ]);

    const controller = new AbortController();
    controller.abort();
    expect(await registry.resolveAll('query', controller.signal)).toEqual([]);

    unregisterLow();
    expect(registry.getSourceNames()).toEqual(['high']);
  });

  it('maintains MRU command history bounded by maxSize', () => {
    const history = createCommandHistory(3);
    history.record('a');
    history.record('b');
    history.record('c');
    history.record('a');
    expect(history.recent).toEqual(['a', 'c', 'b']);
    history.record('d');
    expect(history.recent).toEqual(['d', 'a', 'c']);
    history.clear();
    expect(history.size).toBe(0);
  });
});
