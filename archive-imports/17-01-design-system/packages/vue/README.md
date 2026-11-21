# @forma-ui/vue

Composables reativos e componentes headless para Vue 3 construídos sobre `@forma-ui/core`, integrando `ref`, `onUnmounted`, `provide`/`inject` e `Teleport`.

## Instalação

```bash
pnpm add @forma-ui/vue @forma-ui/core
```

## Composables e Componentes Exportados
- `provideFormaI18n(locale)` & `useFormaI18n()`: Provedor e consumidor reativo de tradução e direção `ltr`/`rtl`.
- `useButton(options)`: Retorna atributos e handlers de teclado/clique para botões nativos ou polimórficos.
- `useDialog(options)` & `<FDialog>`: Gerencia estado reativo `state.value.open`, FocusTrap e renderização via `<Teleport to="body">`.
- `useMenu(options)`: Controle reativo de menu com navegação por setas e typeahead.
- `useTabs(options)`: Controle reativo de abas horizontais/verticais com espelhamento RTL.
- `useTooltip(options)`: Controle de tooltip com warmup group e fechamento via `Escape`.
- `useSelect(options)`: Combobox/Listbox single e multi-select com sincronização de formulário.
- `useToast(options)`: Fila reativa `toasts.value` com timers pausáveis WCAG 2.2.1.
- `useAccordion(options)`: Controle de seções expansíveis `single` e `multiple`.
