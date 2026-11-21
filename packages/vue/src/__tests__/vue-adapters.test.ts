import { afterEach, describe, expect, it } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import {
  useAlertDialog,
  useAvatar,
  useCombobox,
  useDialog,
  useListbox,
  useMultiSelect,
  useNumberField,
  usePinInput,
  useRadioGroup,
  useRatingGroup,
  useSearchField,
  useTabs,
  useToggleGroup,
  useToolbar,
  useTreeView,
  FDialog,
} from '../index';

describe('Vue 3 adapters', () => {
  let app: ReturnType<typeof createApp> | undefined; let host: HTMLDivElement;
  afterEach(() => { app?.unmount(); host?.remove(); });
  it('exposes reactive dialog state and semantics', async () => {
    const Component = defineComponent({ setup() { const dialog = useDialog(); return () => h('div', [h('button', dialog.triggerProps.value, 'Open'), dialog.open.value ? h('div', dialog.contentProps.value, 'Content') : null]); } });
    host = document.createElement('div'); document.body.append(host); app = createApp(Component); app.mount(host); const trigger = host.querySelector('button')!; trigger.click(); await nextTick(); expect(host.querySelector('[role="dialog"]')).not.toBeNull();
  });
  it('exposes alertdialog semantics through a dedicated composable', async () => {
    const Component = defineComponent({ setup() { const dialog = useAlertDialog(); return () => h('section', dialog.contentProps.value, 'Alert'); } });
    host = document.createElement('div'); document.body.append(host); app = createApp(Component); app.mount(host);
    await nextTick();
    expect(host.querySelector('[role="alertdialog"]')).not.toBeNull();
  });
  it('exposes a multiple Select composable with array values and connected ARIA props', async () => {
    const Component = defineComponent({ setup() { const select = useMultiSelect({ options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], defaultValue: ['a'] }); return () => h('div', [h('button', { ...select.getTriggerProps('list', 'label') }, 'Choose'), h('span', { id: 'label' }, 'Choose a value'), h('ul', select.getListboxProps('list', 'label'), [h('li', select.getOptionProps({ value: 'a', label: 'A' }, 0, 'list'), 'A')]), h('button', { onClick: () => select.select('b') }, JSON.stringify(select.value.value))]); } });
    host = document.createElement('div'); document.body.append(host); app = createApp(Component); app.mount(host); host.querySelectorAll('button')[1]!.click(); await nextTick();
    expect(host.querySelectorAll('button')[1]?.textContent).toBe('["a","b"]');
    expect(host.querySelector('[role="listbox"]')?.getAttribute('aria-multiselectable')).toBe('true');
    expect(host.querySelector('[role="option"]')?.id).toBe('list-option-0');
  });
  it('keeps tabs value reactive', async () => {
    const Component = defineComponent({ setup() { const tabs = useTabs({ defaultValue: 'a' }); return () => h('div', [h('button', { onClick: () => tabs.select('b') }, 'Select'), h('output', tabs.value.value)]); } });
    host = document.createElement('div'); document.body.append(host); app = createApp(Component); app.mount(host); host.querySelector('button')!.click(); await nextTick(); expect(host.querySelector('output')?.textContent).toBe('b');
  });
  it('renders the dialog backdrop inside the modal isolation boundary', async () => {
    const Component = defineComponent({ setup() { return () => h(FDialog, { open: true, title: 'Confirm action' }); } });
    host = document.createElement('div'); document.body.append(host); app = createApp(Component); app.mount(host); await nextTick();
    const overlay = document.querySelector('[data-forma-overlay]') as HTMLElement;
    expect(overlay.closest('[role="dialog"]')).not.toBeNull();
    expect(overlay.inert).toBe(false);
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
  });
  it('exports the Teleport dialog component', () => { expect(FDialog).toBeDefined(); });
  it('exposes reactive extended composables for collections and inputs', async () => {
    const Component = defineComponent({
      setup() {
        const listbox = useListbox({ options: [{ key: 'a', value: 'a' }, { key: 'b', value: 'b' }] });
        const combobox = useCombobox({ options: [{ value: 'a', label: 'Alpha' }] });
        const numberField = useNumberField({ defaultValue: 4 });
        const searchField = useSearchField();
        const radioGroup = useRadioGroup({ defaultValue: 'r1' });
        const toggleGroup = useToggleGroup({ defaultValue: 't1' });
        const tree = useTreeView({ nodes: [{ key: 'root', value: 'Root' }] });
        const pin = usePinInput({ length: 4 });
        const rating = useRatingGroup({ defaultValue: 2 });
        const avatar = useAvatar({ src: 'https://example.com/a.png' });
        const toolbar = useToolbar({ label: 'Tools' });
        return () =>
          h('div', [
            h('button', { id: 'inc', onClick: () => numberField.increment() }, String(numberField.value.value)),
            h('button', { id: 'pick', onClick: () => combobox.select('a') }, combobox.value.value),
            h('output', { id: 'meta' }, `${listbox.selectedKeys.value.length}:${tree.visibleNodes.value.length}:${searchField.value.value}:${radioGroup.value.value}:${toggleGroup.value.value}:${pin.length}:${rating.value.value}:${avatar.imageState.value}:${toolbar.rootProps.value.role}`),
          ]);
      },
    });
    host = document.createElement('div');
    document.body.append(host);
    app = createApp(Component);
    app.mount(host);
    (host.querySelector('#inc') as HTMLButtonElement).click();
    (host.querySelector('#pick') as HTMLButtonElement).click();
    await nextTick();
    expect(host.querySelector('#inc')?.textContent).toBe('5');
    expect(host.querySelector('#pick')?.textContent).toBe('a');
    expect(host.querySelector('#meta')?.textContent).toBe('0:1::r1:t1:4:2:loading:toolbar');
  });
});
