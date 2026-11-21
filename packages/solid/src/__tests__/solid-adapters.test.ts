import { describe, expect, it } from 'vitest';
import { createRoot } from 'solid-js';
import {
  createAccordion,
  createAlertDialog,
  createAvatar,
  createCheckbox,
  createCombobox,
  createDialog,
  createDisclosure,
  createListbox,
  createMenu,
  createMultiSelect,
  createNumberField,
  createPagination,
  createPinInput,
  createRadioGroup,
  createRatingGroup,
  createSearchField,
  createSelect,
  createSlider,
  createSwitch,
  createTabs,
  createToasts,
  createToggleGroup,
  createToolbar,
  createTooltip,
  createTreeView,
} from '../index';

describe('Solid adapters', () => {
  it('synchronizes signal state and cleans up core controllers inside createRoot', () => {
    createRoot((dispose) => {
      const dialog = createDialog();
      expect(dialog.open()).toBe(false);
      dialog.show();
      expect(dialog.open()).toBe(true);

      const alertDialog = createAlertDialog();
      expect(alertDialog.getContentProps().role).toBe('alertdialog');

      const menu = createMenu();
      menu.openMenu();
      expect(menu.open()).toBe(true);

      const tabs = createTabs({ defaultValue: 'a' });
      tabs.select('b');
      expect(tabs.value()).toBe('b');

      const tooltip = createTooltip({ delayDuration: 0 });
      tooltip.setOpen(true);
      expect(tooltip.open()).toBe(true);

      const select = createSelect({ options: [{ value: 'one', label: 'One' }] });
      select.select('one');
      expect(select.value()).toBe('one');

      const multi = createMultiSelect({ options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] });
      multi.select('a');
      multi.select('b');
      expect(multi.value()).toEqual(['a', 'b']);

      const combobox = createCombobox({ options: [{ value: 'x', label: 'X' }] });
      combobox.select('x');
      expect(combobox.value()).toBe('x');

      const accordion = createAccordion({ defaultValue: 'p1' });
      accordion.toggle('p2');
      expect(accordion.value()).toBe('p2');

      const toasts = createToasts();
      toasts.add({ title: 'Done', duration: 0 });
      expect(toasts.toasts().length).toBe(1);

      const checkbox = createCheckbox();
      checkbox.toggle();
      expect(checkbox.value()).toBe(true);

      const sw = createSwitch();
      sw.toggle();
      expect(sw.value()).toBe(true);

      const disclosure = createDisclosure();
      disclosure.toggle();
      expect(disclosure.value()).toBe(true);

      const pagination = createPagination({ pageCount: 5 });
      pagination.next();
      expect(pagination.value()).toBe(2);

      const slider = createSlider({ defaultValue: 25 });
      slider.setValue(40);
      expect(slider.value()).toBe(40);

      const listbox = createListbox({ options: [{ key: 'k1', value: 'k1' }] });
      listbox.select('k1');
      expect(listbox.value()).toBe('k1');

      const tree = createTreeView({ nodes: [{ key: 'n1', value: 'N1', children: [{ key: 'n2', value: 'N2' }] }] });
      tree.toggleExpanded('n1');
      expect(tree.expandedKeys().has('n1')).toBe(true);

      const num = createNumberField({ defaultValue: 3 });
      num.increment();
      expect(num.value()).toBe(4);

      const search = createSearchField({ defaultValue: 'abc' });
      search.clear();
      expect(search.value()).toBe('');

      const toggleGroup = createToggleGroup();
      const itemEl = document.createElement('button');
      toggleGroup.register({ value: 'bold', element: itemEl });
      toggleGroup.toggle('bold');
      expect(toggleGroup.value()).toBe('bold');

      const radio = createRadioGroup();
      const rEl = document.createElement('button');
      radio.register({ value: 'r1', element: rEl });
      radio.select('r1');
      expect(radio.value()).toBe('r1');

      const pin = createPinInput({ length: 4 });
      pin.paste('1234');
      expect(pin.value()).toBe('1234');

      const rating = createRatingGroup();
      rating.setValue(4);
      expect(rating.value()).toBe(4);

      const avatar = createAvatar({ src: 'https://example.com/avatar.png' });
      avatar.controller.imageLoaded();
      expect(avatar.imageState()).toBe('loaded');

      const toolbar = createToolbar({ label: 'Actions' });
      expect(toolbar.getRootProps().role).toBe('toolbar');

      dispose();
    });
  });
});
