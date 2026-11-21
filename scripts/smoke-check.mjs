import assert from 'node:assert/strict';
import {
  createAccordionController,
  createCheckboxController,
  createComboboxController,
  createDisclosureController,
  createPaginationController,
  createRadioGroupController,
  createSliderController,
  createSwitchController,
  createFormFieldIds,
  getFormControlProps,
  getProgressProps,
  getSeparatorProps,
  createAlertDialogController,
  createI18n,
  createMenuController,
  createMultiSelectController,
  createSelectController,
  createTabsController,
  createToastStore,
  computePosition,
  getButtonProps,
  normalizeSearchText,
} from '../packages/core/dist/index.js';
import { contrastRatio, meetsWCAG } from '../packages/tokens/dist/index.js';

const button = getButtonProps({ loading: true, disabled: true });
assert.equal(button.type, 'button');
assert.equal(button.disabled, true);
assert.equal(button['aria-busy'], true);

const select = createSelectController({
  options: [
    { value: 'alpha', label: 'Alpha' },
    { value: 'beta', label: 'Beta' },
    { value: 'gamma', label: 'Gamma', disabled: true },
  ],
});
select.show();
const keyEvent = (key) => ({
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  isComposing: false,
  preventDefault() { this.defaultPrevented = true; },
});
select.onKeyDown(keyEvent('ArrowDown'));
assert.equal(select.activeOptionIndex, 1);
select.onKeyDown(keyEvent('Enter'));
assert.equal(select.value, 'beta');
assert.equal(select.open, false);
select.destroy();

const multiSelect = createMultiSelectController({
  options: [{ value: 'alpha', label: 'Alpha' }, { value: 'beta', label: 'Beta' }],
  defaultValue: ['alpha'],
});
multiSelect.show();
multiSelect.select('beta');
assert.deepEqual(multiSelect.value, ['alpha', 'beta']);
assert.equal(multiSelect.open, true);
assert.equal(multiSelect.getListboxProps('multi')['aria-multiselectable'], true);
multiSelect.destroy();

const alertDialog = createAlertDialogController();
assert.equal(alertDialog.getContentProps().role, 'alertdialog');

const menu = createMenuController();
let checked = false;
const checkbox = menu.getCheckboxItemProps({ id: 'check', element: {}, checked, closeOnSelect: false, onCheckedChange: (next) => { checked = next; } });
checkbox.onClick();
assert.equal(checked, true);
assert.equal(checkbox.role, 'menuitemcheckbox');
menu.destroy();

const tabs = createTabsController({ defaultValue: 'overview', activationMode: 'manual' });
tabs.register({ value: 'overview', id: 'tab-overview', panelId: 'panel-overview' });
tabs.register({ value: 'settings', id: 'tab-settings', panelId: 'panel-settings' });
tabs.select('settings');
assert.equal(tabs.value, 'settings');
assert.equal(tabs.getTabProps({ value: 'settings', id: 'tab-settings', panelId: 'panel-settings' })['aria-selected'], true);

const accordion = createAccordionController({ multiple: true, defaultValue: ['intro'] });
accordion.register('intro');
accordion.register('details');
accordion.toggle('details');
assert.deepEqual(accordion.value, ['intro', 'details']);

const toasts = createToastStore({ max: 1, duration: 0 });
toasts.add({ id: 'first', title: 'First', duration: 0 });
toasts.add({ id: 'second', title: 'Second', duration: 0 });
assert.deepEqual(toasts.getSnapshot().map((toast) => toast.id), ['second']);
toasts.clear();

assert.equal(createI18n({ locale: 'ar-EG' }).direction, 'rtl');
assert.equal(normalizeSearchText('Café'), 'cafe');
assert.equal(contrastRatio('#000000', '#ffffff'), 21);

assert.equal(meetsWCAG('#000000', '#ffffff', 'AAA'), true);

const checkboxState = createCheckboxController({ defaultChecked: 'indeterminate' });
assert.equal(checkboxState.getInputProps()['aria-checked'], 'mixed');
checkboxState.toggle(); assert.equal(checkboxState.checked, true);
const switchState = createSwitchController({ defaultChecked: true });
switchState.toggle(); assert.equal(switchState.checked, false);
const disclosure = createDisclosureController(); disclosure.toggle(); assert.equal(disclosure.open, true);
const slider = createSliderController({ min: 0, max: 20, step: 2, defaultValue: 6 });
slider.setValue(100); assert.deepEqual(slider.values, [20]);
const pagination = createPaginationController({ pageCount: 12, defaultPage: 6 });
pagination.next(); assert.equal(pagination.page, 7);
assert.equal(pagination.getPageItems().includes('ellipsis'), true);
const radio = createRadioGroupController({ defaultValue: 'first', orientation: 'horizontal' });
const radioOne = { tabIndex: -1, focus() { this.focused = true; } };
radio.register({ value: 'first', element: radioOne });
assert.equal(radioOne.tabIndex, 0);
const combo = createComboboxController({ options: [{ value: 'x', label: 'X' }, { value: 'y', label: 'Y' }] });
combo.setOpen(true); combo.move(1); assert.equal(combo.activeOption?.value, 'x'); combo.select('x'); assert.equal(combo.value, 'x');
assert.equal(getProgressProps({ value: null })['aria-valuenow'], undefined);
assert.equal(getSeparatorProps({ decorative: false }).role, 'separator');
const fieldIds = createFormFieldIds('email');
assert.equal(getFormControlProps({ ...fieldIds, invalid: true })['aria-describedby'], 'email-error');

const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
const positioned = computePosition(rect(10, 5, 30, 20), rect(0, 0, 50, 80), { placement: 'top', viewportWidth: 100, viewportHeight: 200 });
assert.equal(positioned.placement, 'bottom');

process.stdout.write('Smoke check aprovado: controles base e avançados, estados de formulário, Combobox, Slider, Pagination, RTL, typeahead, posicionamento e tokens.\n');
