import { describe, expect, it, vi } from 'vitest';
import { createTabsController } from '../components/tabs';

describe('tabs controller', () => {
  it('associates tab and panel and exposes selected state', () => { const tabs = createTabsController({ defaultValue: 'a' }); tabs.register({ value: 'a', id: 'tab-a', panelId: 'panel-a' }); const props = tabs.getTabProps({ value: 'a', id: 'tab-a', panelId: 'panel-a' }); expect(props['aria-selected']).toBe(true); expect(props['aria-controls']).toBe('panel-a'); });
  it('supports manual activation and RTL logical keys', () => { const tabs = createTabsController({ defaultValue: 'a', direction: 'rtl', activationMode: 'manual' }); const a = document.createElement('button'); const b = document.createElement('button'); tabs.register({ value: 'a', id: 'a', panelId: 'pa', element: a }); tabs.register({ value: 'b', id: 'b', panelId: 'pb', element: b }); tabs.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }), 'a'); expect(tabs.focused).toBe('b'); expect(tabs.value).toBe('a'); });
  it('skips disabled tabs', () => { const tabs = createTabsController({ defaultValue: 'a' }); const b = document.createElement('button'); tabs.register({ value: 'a', id: 'a', panelId: 'pa' }); tabs.register({ value: 'b', id: 'b', panelId: 'pb', disabled: true, element: b }); expect(tabs.getTabProps({ value: 'b', id: 'b', panelId: 'pb', disabled: true })['aria-disabled']).toBe(true); });
  it('preserves defaultValue when earlier tabs register first', () => {
    const onValueChange = vi.fn();
    const tabs = createTabsController({ defaultValue: 'b', onValueChange });
    tabs.register({ value: 'a', id: 'a', panelId: 'pa' });
    tabs.register({ value: 'b', id: 'b', panelId: 'pb' });
    expect(tabs.value).toBe('b');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
