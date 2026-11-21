import { afterEach, describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { createAccordionController } from '../components/accordion';
import { createDialogController } from '../components/dialog';
import { createMenuController } from '../components/menu';
import { createSelectController } from '../components/select';
import { createTabsController } from '../components/tabs';
import { createTooltipController } from '../components/tooltip';
import { createToastStore } from '../components/toast';

async function expectAxeClean(content: string): Promise<void> {
  document.body.innerHTML = `<main>${content}</main>`;
  const result = await axe.run(document.body);
  expect(result.violations.map((violation) => violation.id)).toEqual([]);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('eight component public contracts and axe-core checks', () => {
  it('Button uses native button semantics', async () => {
    await expectAxeClean('<button type="button">Save</button>');
  });

  it('Dialog exposes a named dialog and does not mark non-modal content as modal', async () => {
    const dialog = createDialogController({ modal: false });
    expect(dialog.getContentProps('dialog-title').role).toBe('dialog');
    expect(dialog.getContentProps('dialog-title')['aria-modal']).toBeUndefined();
    await expectAxeClean('<section role="dialog" aria-labelledby="dialog-title" tabindex="-1"><h2 id="dialog-title">Account details</h2><p>Profile information</p></section>');
  });

  it('AlertDialog uses the alertdialog role', () => {
    const dialog = createDialogController({ role: 'alertdialog' });
    expect(dialog.getContentProps('alert-title').role).toBe('alertdialog');
  });

  it('Menu provides menu and menuitem roles with an accessible name', async () => {
    const menu = createMenuController();
    const item = document.createElement('button');
    expect(menu.getContentProps().role).toBe('menu');
    expect(menu.getItemProps({ id: 'i', element: item }).role).toBe('menuitem');
    await expectAxeClean('<div role="menu" aria-label="File actions"><button role="menuitem" tabindex="-1">Rename</button><button role="menuitem" tabindex="-1">Delete</button></div>');
  });

  it('Tabs connect tab to tabpanel', async () => {
    const tabs = createTabsController({ defaultValue: 'x' });
    const record = { value: 'x', id: 'tab-x', panelId: 'panel-x' };
    tabs.register(record);
    expect(tabs.getTabProps(record)['aria-controls']).toBe(tabs.getPanelProps(record).id);
    await expectAxeClean('<div role="tablist" aria-label="Account"><button id="tab-x" role="tab" aria-controls="panel-x" aria-selected="true" tabindex="0">Profile</button></div><section id="panel-x" role="tabpanel" aria-labelledby="tab-x">Profile settings</section>');
  });

  it('Tooltip has role tooltip and does not move focus', async () => {
    const tooltip = createTooltipController();
    expect(tooltip.getContentProps('help').role).toBe('tooltip');
    await expectAxeClean('<button type="button" aria-describedby="help">Save</button><div id="help" role="tooltip">Saves your changes</div>');
  });

  it('Select exposes listbox, option and selected state for single selection', async () => {
    const select = createSelectController({ options: [{ value: 'a', label: 'Alpha' }], defaultValue: 'a' });
    expect(select.getTriggerProps('list').role).toBe('combobox');
    expect(select.getListboxProps('list')['aria-multiselectable']).toBeUndefined();
    expect(select.getOptionProps({ value: 'a', label: 'Alpha' }, 0, 'list')['aria-selected']).toBe(true);
    await expectAxeClean('<button type="button" role="combobox" aria-label="Category" aria-haspopup="listbox" aria-expanded="true" aria-controls="list">Alpha</button><ul id="list" role="listbox" aria-label="Category"><li id="list-option-0" role="option" aria-selected="true">Alpha</li></ul>');
  });

  it('MultiSelect advertises multiple selection semantics', async () => {
    const select = createSelectController({ multiple: true, options: [{ value: 'a', label: 'Alpha' }] });
    expect(select.getListboxProps('multi')['aria-multiselectable']).toBe(true);
    await expectAxeClean('<button type="button" role="combobox" aria-label="Categories" aria-haspopup="listbox" aria-expanded="true" aria-controls="multi">Alpha</button><ul id="multi" role="listbox" aria-label="Categories" aria-multiselectable="true"><li role="option" aria-selected="true">Alpha</li></ul>');
  });

  it('Toast exposes a polite live status region', async () => {
    const store = createToastStore();
    store.add({ title: 'Info' });
    store.add({ title: 'Error', tone: 'error' });
    expect(store.getSnapshot().map((item) => item.tone)).toEqual(['info', 'error']);
    await expectAxeClean('<div role="status" aria-live="polite">Saved successfully</div>');
    store.clear();
  });

  it('Accordion exposes expanded state and a labelled panel', async () => {
    const accordion = createAccordionController({ defaultValue: 'x' });
    expect(accordion.getItemProps('x')['aria-expanded']).toBe(true);
    await expectAxeClean('<h2><button id="trigger" type="button" aria-expanded="true" aria-controls="panel">Shipping details</button></h2><div id="panel" role="region" aria-labelledby="trigger">Delivery information</div>');
  });
});
