import { afterEach, describe, expect, it, vi } from 'vitest';
import { createToastStore } from '../components/toast';

afterEach(() => vi.useRealTimers());
describe('toast store', () => {
  it('adds, updates and dismisses notifications', () => { const store = createToastStore(); const id = store.add({ title: 'Saved' }); expect(store.getSnapshot()).toHaveLength(1); store.update(id, { description: 'Done' }); expect(store.getSnapshot()[0]?.description).toBe('Done'); store.dismiss(id); expect(store.getSnapshot()).toHaveLength(0); });
  it('pauses and resumes timeout while users interact', () => { vi.useFakeTimers(); const store = createToastStore(); const id = store.add({ title: 'Message', duration: 1000 }); vi.advanceTimersByTime(400); store.pause(id); vi.advanceTimersByTime(2000); expect(store.getSnapshot()).toHaveLength(1); store.resume(id); vi.advanceTimersByTime(600); expect(store.getSnapshot()).toHaveLength(0); });
  it('supports persistent messages and bounded stacks', () => { const store = createToastStore({ max: 2 }); store.add({ title: 'A', duration: 0 }); store.add({ title: 'B', duration: 0 }); store.add({ title: 'C', duration: 0 }); expect(store.getSnapshot().map((x) => x.title)).toEqual(['B','C']); });
  it('restarts the timeout when the duration is updated', () => { vi.useFakeTimers(); const store = createToastStore(); const id = store.add({ title: 'Message', duration: 1000 }); vi.advanceTimersByTime(300); store.update(id, { duration: 500 }); vi.advanceTimersByTime(499); expect(store.getSnapshot()).toHaveLength(1); vi.advanceTimersByTime(1); expect(store.getSnapshot()).toHaveLength(0); });
});
