import { describe, it, expect } from 'vitest';
import { createAccordionMachine } from '../components/accordion.js';

describe('Component 8: Accordion (@forma-ui/core/accordion)', () => {
  it('enforces non-collapsible single mode when collapsible=false and expandAll in multiple mode', () => {
    const nonCollapsible = createAccordionMachine({
      type: 'single',
      collapsible: false,
      defaultValue: ['sec-1'],
      items: [{ value: 'sec-1' }, { value: 'sec-2' }]
    });

    nonCollapsible.toggleItem('sec-1');
    expect(nonCollapsible.isItemOpen('sec-1')).toBe(true);

    const multi = createAccordionMachine({
      type: 'multiple',
      items: [{ value: 'a' }, { value: 'b' }, { value: 'c', disabled: true }]
    });
    multi.expandAll();
    expect(multi.getState().openValues).toEqual(['a', 'b']);
    multi.collapseAll();
    expect(multi.getState().openValues).toEqual([]);
  });
});
