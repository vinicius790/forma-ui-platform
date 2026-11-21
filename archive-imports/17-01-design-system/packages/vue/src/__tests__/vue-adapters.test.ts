import { describe, it, expect } from 'vitest';
import {
  useButton,
  useDialog,
  useMenu,
  useTabs,
  useTooltip,
  useSelect,
  useToast,
  useAccordion
} from '../index.js';

describe('@forma-ui/vue composables & reactive adapters', () => {
  it('exposes reactive Vue refs synchronized with @forma-ui/core state machines', () => {
    const btnProps = useButton({ pressed: true });
    expect(btnProps['aria-pressed']).toBe(true);

    const { machine: dlgMachine, state: dlgState } = useDialog({ defaultOpen: false });
    expect(dlgState.value.open).toBe(false);
    dlgMachine.open();
    expect(dlgState.value.open).toBe(true);

    const { machine: tabsMachine, state: tabsState } = useTabs({
      items: [{ value: 'tab1' }, { value: 'tab2' }],
      defaultValue: 'tab1'
    });
    tabsMachine.selectTab('tab2');
    expect(tabsState.value.value).toBe('tab2');

    const { machine: selectMachine, state: selectState } = useSelect({
      options: [
        { value: 'br', label: 'Brasil' },
        { value: 'pt', label: 'Portugal' }
      ]
    });
    selectMachine.selectValue('br');
    expect(selectState.value.selectedValues).toEqual(['br']);

    const { store: toastStore, toasts } = useToast();
    toastStore.info('Notificação Vue');
    expect(toasts.value.length).toBe(1);
    toastStore.dismissAll();

    const { machine: menuMachine, state: menuState } = useMenu({
      items: [{ id: '1', label: 'Item 1' }]
    });
    menuMachine.open();
    expect(menuState.value.open).toBe(true);

    const { machine: tipMachine, state: tipState } = useTooltip();
    tipMachine.open(true);
    expect(tipState.value.open).toBe(true);

    const { machine: accMachine, state: accState } = useAccordion({
      items: [{ value: 'a' }]
    });
    accMachine.toggleItem('a');
    expect(accState.value.openValues).toEqual(['a']);
  });
});
