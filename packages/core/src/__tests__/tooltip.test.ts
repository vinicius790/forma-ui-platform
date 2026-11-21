import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTooltipController } from '../components/tooltip';

afterEach(() => vi.useRealTimers());
describe('tooltip controller', () => {
  it('opens on focus and closes on Escape', () => { const tip = createTooltipController(); tip.focus(); expect(tip.open).toBe(true); tip.keyDown(new KeyboardEvent('keydown', { key: 'Escape' })); expect(tip.open).toBe(false); });
  it('delays pointer opening and can be disabled', () => { vi.useFakeTimers(); const tip = createTooltipController({ delayDuration: 100 }); tip.pointerEnter(); expect(tip.open).toBe(false); vi.advanceTimersByTime(100); expect(tip.open).toBe(true); const disabled = createTooltipController({ disabled: true }); disabled.focus(); expect(disabled.open).toBe(false); });
  it('exposes tooltip semantics without receiving focus', () => { const tip = createTooltipController(); expect(tip.getContentProps('tip').role).toBe('tooltip'); expect('tabIndex' in tip.getContentProps('tip')).toBe(false); });
});
