import { beforeEach, describe, expect, it } from 'vitest';
import { assertAriaContract, auditAccessibility } from '@forma-ui/a11y-testing';
import { createTabsController } from '@forma-ui/core/components/tabs';

describe('documentation playground contracts', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  it('demonstrates tab relationships with unique ids', () => {
    const root = document.createElement('div'); root.innerHTML = '<div role="tablist"><button id="tab-a" role="tab" aria-controls="panel-a" aria-selected="true">A</button></div><section id="panel-a" role="tabpanel" aria-labelledby="tab-a">Content</section>'; document.body.append(root);
    assertAriaContract(root.querySelector('[role="tab"]')!, { role: 'tab', requiredAttributes: ['aria-controls','aria-selected'], nameRequired: true });
    expect(root.querySelector('[role="tabpanel"]')?.getAttribute('aria-labelledby')).toBe('tab-a');
  });
  it('controller supports logical arrow direction', () => {
    const tabs = createTabsController({ defaultValue: 'one', direction: 'rtl' });
    const first = document.createElement('button'); const second = document.createElement('button');
    tabs.register({ value: 'one', id: 'one', panelId: 'p1', element: first }); tabs.register({ value: 'two', id: 'two', panelId: 'p2', element: second });
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }); tabs.onKeyDown(event, 'one'); expect(tabs.value).toBe('two');
  });
  it('axe-core audit API returns structured results for basic semantic content', async () => {
    document.body.innerHTML = '<main><h1>Playground</h1><button type="button">Ação</button></main>';
    const result = await auditAccessibility(document.body); expect(result.violations).toBeInstanceOf(Array); expect(result.passes).toBeGreaterThan(0);
  });
});
