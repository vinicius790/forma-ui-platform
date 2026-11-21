import { describe, it, expect, vi } from 'vitest';
import { createTooltipMachine } from '../components/tooltip.js';

describe('Component 5: Tooltip (@forma-ui/core/tooltip)', () => {
  it('supports warmup instant open after recent close and respects disabled flag', () => {
    vi.useFakeTimers();
    const tip1 = createTooltipMachine({ openDelay: 400, closeDelay: 0 });
    tip1.open(true);
    expect(tip1.getState().open).toBe(true);
    tip1.close(true);
    expect(tip1.getState().open).toBe(false);

    // Second tooltip opened within warmup window opens immediately on hover
    const tip2 = createTooltipMachine({ openDelay: 400 });
    tip2.getTriggerProps().onMouseEnter();
    expect(tip2.getState().open).toBe(true);

    const disabledTip = createTooltipMachine({ disabled: true });
    disabledTip.open(true);
    expect(disabledTip.getState().open).toBe(false);

    tip1.destroy();
    tip2.destroy();
    disabledTip.destroy();
    vi.useRealTimers();
  });
});
