import {
  ref,
  onUnmounted,
  provide,
  inject,
  defineComponent,
  h,
  Teleport,
  type InjectionKey
} from 'vue';
import {
  getButtonProps,
  createDialogMachine,
  createMenuMachine,
  createTabsMachine,
  createTooltipMachine,
  createSelectMachine,
  createToastStore,
  createAccordionMachine,
  createI18nManager,
  type ButtonOptions,
  type DialogOptions,
  type MenuOptions,
  type TabsOptions,
  type TooltipOptions,
  type SelectOptions,
  type ToastStoreOptions,
  type AccordionOptions,
  type I18nManager
} from '@forma-ui/core';

const FormaI18nKey: InjectionKey<I18nManager> = Symbol('FormaI18n');

export function provideFormaI18n(locale = 'pt-BR') {
  const manager = createI18nManager(locale);
  provide(FormaI18nKey, manager);
  return manager;
}

export function useFormaI18n(): I18nManager {
  return inject(FormaI18nKey, createI18nManager('pt-BR'));
}

export function useButton(options: ButtonOptions = {}) {
  return getButtonProps(options);
}

export function useDialog(options: DialogOptions = {}) {
  const machine = createDialogMachine(options);
  const state = ref(machine.getState());
  const unsubscribe = machine.subscribe((next) => {
    state.value = next;
  });
  onUnmounted(() => {
    unsubscribe();
    machine.destroy();
  });
  return { machine, state };
}

export function useMenu(options: MenuOptions) {
  const machine = createMenuMachine(options);
  const state = ref(machine.getState());
  const unsubscribe = machine.subscribe((next) => {
    state.value = next;
  });
  onUnmounted(unsubscribe);
  return { machine, state };
}

export function useTabs(options: TabsOptions) {
  const machine = createTabsMachine(options);
  const state = ref(machine.getState());
  const unsubscribe = machine.subscribe((next) => {
    state.value = next;
  });
  onUnmounted(unsubscribe);
  return { machine, state };
}

export function useTooltip(options: TooltipOptions = {}) {
  const machine = createTooltipMachine(options);
  const state = ref(machine.getState());
  const unsubscribe = machine.subscribe((next) => {
    state.value = next;
  });
  onUnmounted(() => {
    unsubscribe();
    machine.destroy();
  });
  return { machine, state };
}

export function useSelect(options: SelectOptions) {
  const machine = createSelectMachine(options);
  const state = ref(machine.getState());
  const unsubscribe = machine.subscribe((next) => {
    state.value = next;
  });
  onUnmounted(unsubscribe);
  return { machine, state };
}

export function useToast(options: ToastStoreOptions = {}) {
  const store = createToastStore(options);
  const toasts = ref(store.getToasts());
  const unsubscribe = store.subscribe((next) => {
    toasts.value = next;
  });
  onUnmounted(unsubscribe);
  return { store, toasts };
}

export function useAccordion(options: AccordionOptions) {
  const machine = createAccordionMachine(options);
  const state = ref(machine.getState());
  const unsubscribe = machine.subscribe((next) => {
    state.value = next;
  });
  onUnmounted(unsubscribe);
  return { machine, state };
}

export const FDialog = defineComponent({
  name: 'FDialog',
  props: {
    modal: { type: Boolean, default: true },
    defaultOpen: { type: Boolean, default: false }
  },
  setup(props, { slots }) {
    const { machine, state } = useDialog({ modal: props.modal, defaultOpen: props.defaultOpen });
    return () => [
      slots.trigger?.({ triggerProps: machine.getTriggerProps(), open: state.value.open }),
      state.value.open
        ? h(Teleport, { to: 'body' }, [
            h('div', machine.getOverlayProps()),
            h('div', machine.getContentProps(), slots.default?.({ close: machine.close }))
          ])
        : null
    ];
  }
});
