import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import { createPortal } from 'react-dom';
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
  type MenuItemConfig,
  type TabsOptions,
  type TooltipOptions,
  type SelectOptions,
  type SelectOptionItem,
  type ToastStoreOptions,
  type ToastStore,
  type AccordionOptions,
  type FormaMessages,
  type Direction
} from '@forma-ui/core';

/* ---------------- I18n & RTL Provider ---------------- */
const I18nContext = createContext<ReturnType<typeof createI18nManager> | null>(null);

export interface FormaProviderProps {
  locale?: string;
  dir?: Direction;
  messages?: Partial<FormaMessages>;
  children: React.ReactNode;
}

export function FormaProvider({
  locale = 'pt-BR',
  dir,
  messages,
  children
}: FormaProviderProps): React.ReactElement {
  const manager = useMemo(() => createI18nManager(locale, messages), []);
  useEffect(() => {
    manager.setLocale(locale, messages);
    if (dir) manager.setDirection(dir);
  }, [locale, dir, messages, manager]);

  return React.createElement(I18nContext.Provider, { value: manager }, children);
}

export function useFormaI18n() {
  const ctx = useContext(I18nContext);
  const fallback = useMemo(() => createI18nManager('pt-BR'), []);
  const manager = ctx ?? fallback;
  const state = useSyncExternalStore(manager.subscribe, manager.getState, manager.getState);
  return { ...state, t: manager.t, setLocale: manager.setLocale, setDirection: manager.setDirection };
}

/* ---------------- 1. Button ---------------- */
export interface ButtonPropsReact
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'onKeyDown'>,
    Omit<ButtonOptions, 'onPress'> {
  onPress?: (event: MouseEvent | KeyboardEvent) => void;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
}

export function Button({
  elementType = 'button',
  type = 'button',
  disabled,
  loading,
  pressed,
  onPress,
  onClick,
  onKeyDown,
  children,
  ...rest
}: ButtonPropsReact): React.ReactElement {
  const props = getButtonProps(
    { elementType, type, disabled, loading, pressed, onPress },
    {
      onClick: onClick as unknown as (e: MouseEvent) => void,
      onKeyDown: onKeyDown as unknown as (e: KeyboardEvent) => void
    }
  );
  return React.createElement(
    elementType,
    { ...rest, ...(props as unknown as Record<string, unknown>) },
    children
  );
}

/* ---------------- 2. Dialog ---------------- */
const DialogContext = createContext<ReturnType<typeof createDialogMachine> | null>(null);

export function Dialog({
  children,
  ...options
}: DialogOptions & { children: React.ReactNode }): React.ReactElement {
  const machine = useMemo(() => createDialogMachine(options), []);
  useEffect(() => {
    if (options.open !== undefined) machine.setOpen(options.open);
  }, [options.open, machine]);
  useEffect(() => () => machine.destroy(), [machine]);

  return React.createElement(DialogContext.Provider, { value: machine }, children);
}

export function DialogTrigger({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>): React.ReactElement {
  const machine = useContext(DialogContext)!;
  useSyncExternalStore(machine.subscribe, machine.getState, machine.getState);
  return React.createElement(
    'button',
    { ...rest, ...machine.getTriggerProps() },
    children
  );
}

export function DialogPortal({
  children,
  container
}: {
  children: React.ReactNode;
  container?: Element | null;
}): React.ReactPortal | null {
  const machine = useContext(DialogContext)!;
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState);
  if (!state.open || typeof document === 'undefined') return null;
  return createPortal(children, container ?? document.body);
}

export function DialogOverlay(
  props: React.HTMLAttributes<HTMLDivElement>
): React.ReactElement | null {
  const machine = useContext(DialogContext)!;
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState);
  if (!state.open) return null;
  const overlayProps = machine.getOverlayProps();
  return React.createElement('div', {
    ...props,
    ...(overlayProps as unknown as Record<string, unknown>)
  });
}

export function DialogContent({
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement | null {
  const machine = useContext(DialogContext)!;
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!state.open) return;
    return machine.mountContent(ref.current);
  }, [state.open, machine]);

  if (!state.open) return null;
  return React.createElement(
    'div',
    { ref, ...rest, ...machine.getContentProps() },
    children
  );
}

export function DialogTitle({
  children,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>): React.ReactElement {
  const machine = useContext(DialogContext)!;
  return React.createElement('h2', { ...rest, ...machine.getTitleProps() }, children);
}

export function DialogDescription({
  children,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>): React.ReactElement {
  const machine = useContext(DialogContext)!;
  return React.createElement('p', { ...rest, ...machine.getDescriptionProps() }, children);
}

export function DialogClose({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>): React.ReactElement {
  const machine = useContext(DialogContext)!;
  return React.createElement('button', { ...rest, ...machine.getCloseProps() }, children);
}

/* ---------------- 3. Menu ---------------- */
export interface HeadlessMenuProps extends MenuOptions {
  triggerLabel: React.ReactNode;
  renderItem?: (item: MenuItemConfig, index: number) => React.ReactNode;
}

export function HeadlessMenu({
  triggerLabel,
  renderItem,
  ...options
}: HeadlessMenuProps): React.ReactElement {
  const machine = useMemo(() => createMenuMachine(options), []);
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState);
  const triggerProps = machine.getTriggerProps();
  const menuProps = machine.getMenuProps();

  return React.createElement(
    'div',
    { 'data-forma-menu-root': '' },
    React.createElement(
      'button',
      triggerProps as unknown as Record<string, unknown>,
      triggerLabel
    ),
    state.open
      ? React.createElement(
          'div',
          menuProps as unknown as Record<string, unknown>,
          options.items.map((item, idx) => {
            const itemProps = machine.getItemProps(item, idx);
            return React.createElement(
              'div',
              { key: item.id, ...(itemProps as unknown as Record<string, unknown>) },
              renderItem ? renderItem(item, idx) : item.label
            );
          })
        )
      : null
  );
}

/* ---------------- 4. Tabs ---------------- */
export interface HeadlessTabDefinition {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface HeadlessTabsProps extends Omit<TabsOptions, 'items'> {
  tabs: HeadlessTabDefinition[];
}

export function HeadlessTabs({ tabs, ...options }: HeadlessTabsProps): React.ReactElement {
  const machine = useMemo(
    () =>
      createTabsMachine({
        ...options,
        items: tabs.map((t) => ({ value: t.value, disabled: t.disabled }))
      }),
    []
  );
  useSyncExternalStore(machine.subscribe, machine.getState, machine.getState);

  const focusTab = (tabId: string) => {
    if (typeof document !== 'undefined') {
      document.getElementById(tabId)?.focus();
    }
  };

  return React.createElement(
    'div',
    { 'data-forma-tabs': '' },
    React.createElement(
      'div',
      machine.getTabListProps(),
      tabs.map((tab) => {
        const tp = machine.getTabProps(tab.value, focusTab);
        return React.createElement(
          'button',
          { key: tab.value, ...(tp as unknown as Record<string, unknown>) },
          tab.label
        );
      })
    ),
    tabs.map((tab) =>
      React.createElement(
        'div',
        { key: tab.value, ...machine.getPanelProps(tab.value) },
        tab.content
      )
    )
  );
}

/* ---------------- 5. Tooltip ---------------- */
export interface HeadlessTooltipProps extends TooltipOptions {
  content: React.ReactNode;
  children: React.ReactElement;
}

export function HeadlessTooltip({
  content,
  children,
  ...options
}: HeadlessTooltipProps): React.ReactElement {
  const machine = useMemo(() => createTooltipMachine(options), []);
  useSyncExternalStore(machine.subscribe, machine.getState, machine.getState);
  useEffect(() => () => machine.destroy(), [machine]);

  const triggerProps = machine.getTriggerProps();
  const tooltipProps = machine.getTooltipProps();

  return React.createElement(
    React.Fragment,
    null,
    React.cloneElement(children, triggerProps as unknown as Record<string, unknown>),
    React.createElement(
      'div',
      tooltipProps as unknown as Record<string, unknown>,
      content
    )
  );
}

/* ---------------- 6. Select ---------------- */
export interface HeadlessSelectProps extends SelectOptions {
  renderOption?: (option: SelectOptionItem, selected: boolean) => React.ReactNode;
}

export function HeadlessSelect({
  renderOption,
  ...options
}: HeadlessSelectProps): React.ReactElement {
  const machine = useMemo(() => createSelectMachine(options), []);
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState);
  const triggerProps = machine.getTriggerProps();
  const listboxProps = machine.getListboxProps();

  return React.createElement(
    'div',
    { 'data-forma-select': '' },
    React.createElement(
      'button',
      triggerProps as unknown as Record<string, unknown>,
      machine.getDisplayText()
    ),
    state.open
      ? React.createElement(
          'div',
          listboxProps as unknown as Record<string, unknown>,
          options.options.map((opt, idx) => {
            const op = machine.getOptionProps(opt, idx);
            const selected = state.selectedValues.includes(opt.value);
            return React.createElement(
              'div',
              { key: opt.value, ...(op as unknown as Record<string, unknown>) },
              renderOption ? renderOption(opt, selected) : opt.label
            );
          })
        )
      : null,
    options.name ? React.createElement('input', machine.getHiddenInputProps()) : null
  );
}

/* ---------------- 7. Toast ---------------- */
const ToastContext = createContext<ToastStore | null>(null);

export function ToastProvider({
  children,
  ...options
}: ToastStoreOptions & { children: React.ReactNode }): React.ReactElement {
  const store = useMemo(() => createToastStore(options), []);
  return React.createElement(ToastContext.Provider, { value: store }, children);
}

export function useToast(): ToastStore {
  const store = useContext(ToastContext);
  if (!store) {
    throw new Error('useToast deve ser utilizado dentro de um <ToastProvider>.');
  }
  return store;
}

export function ToastViewport(): React.ReactElement {
  const store = useToast();
  const toasts = useSyncExternalStore(store.subscribe, store.getToasts, store.getToasts);

  return React.createElement(
    'div',
    store.getRegionProps(),
    toasts.map((item) => {
      const tp = store.getToastProps(item);
      const cp = store.getCloseButtonProps(item.id);
      return React.createElement(
        'div',
        { key: item.id, ...(tp as unknown as Record<string, unknown>) },
        React.createElement('strong', null, item.title),
        item.description ? React.createElement('p', null, item.description) : null,
        React.createElement('button', cp as unknown as Record<string, unknown>, '×')
      );
    })
  );
}

/* ---------------- 8. Accordion ---------------- */
export interface HeadlessAccordionItemDef {
  value: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface HeadlessAccordionProps extends Omit<AccordionOptions, 'items'> {
  items: HeadlessAccordionItemDef[];
}

export function HeadlessAccordion({
  items,
  ...options
}: HeadlessAccordionProps): React.ReactElement {
  const machine = useMemo(
    () =>
      createAccordionMachine({
        ...options,
        items: items.map((i) => ({ value: i.value, disabled: i.disabled }))
      }),
    []
  );
  useSyncExternalStore(machine.subscribe, machine.getState, machine.getState);

  const focusTrigger = (id: string) => {
    if (typeof document !== 'undefined') {
      document.getElementById(id)?.focus();
    }
  };

  return React.createElement(
    'div',
    machine.getRootProps(),
    items.map((item) => {
      const itemProps = machine.getItemProps(item.value);
      const triggerProps = machine.getTriggerProps(item.value, focusTrigger);
      const panelProps = machine.getPanelProps(item.value);
      return React.createElement(
        'div',
        { key: item.value, ...itemProps },
        React.createElement(
          'h3',
          null,
          React.createElement(
            'button',
            triggerProps as unknown as Record<string, unknown>,
            item.title
          )
        ),
        React.createElement('div', panelProps, item.content)
      );
    })
  );
}
