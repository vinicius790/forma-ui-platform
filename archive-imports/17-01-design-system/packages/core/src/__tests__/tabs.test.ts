import { describe, it, expect, vi } from 'vitest';
import { createTabsMachine } from '../components/tabs.js';

describe('Component 4: Tabs (@forma-ui/core/tabs)', () => {
  it('distinguishes automatic vs manual keyboard activation modes', () => {
    const onChange = vi.fn();
    const manualTabs = createTabsMachine({
      items: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      defaultValue: 'a',
      activationMode: 'manual',
      onValueChange: onChange
    });

    manualTabs.getTabProps('a').onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    // Focus moves to 'b', but selected value remains 'a' until Enter/Space
    expect(manualTabs.getState().focusedValue).toBe('b');
    expect(manualTabs.getState().value).toBe('a');

    manualTabs.getTabProps('b').onKeyDown(new KeyboardEvent('keydown', { key: ' ' }));
    expect(manualTabs.getState().value).toBe('b');
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
