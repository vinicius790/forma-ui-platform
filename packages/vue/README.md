# @forma-ui/vue

Composables para Vue 3 e `FDialog`, um componente opcional que usa `Teleport`. `useDialog()`/`FDialog` permitem selecionar `role="dialog"` ou `role="alertdialog"`; `useAlertDialog()` fornece a variante urgente com modal habilitado por padrão. Em `FDialog`, forneça `title` ou `ariaLabel` para um nome acessível. A biblioteca não injeta CSS; configure `.forma-dialog-overlay` e `.forma-dialog` na aplicação.

## Instalação

```bash
pnpm add vue @forma-ui/core @forma-ui/vue
```

## Composables

- `useDialog()` retorna refs `open`, `trigger` e `content`, `controller`, `setOpen`, `triggerProps` e `contentProps`.
- `useMenu()` retorna refs de trigger/content, controlador, `show`, `hide`, `getItemProps`, `getCheckboxItemProps`, `getRadioItemProps` e `registerItem`.
- `useTabs()` retorna `value`, controlador, `select`, `focus`, `register`, `getTabProps` e `getPanelProps`.
- `useSelect({ options })` retorna estado, eventos e controladores de seleção única; `useMultiSelect({ options })` habilita múltipla seleção.
- `useSelect({ options })` retorna `value`, `open`, refs DOM, `show`, `hide` e `select`.
- `useTooltip()` retorna refs e controlador para conexão dos eventos do tooltip.
- `useAccordion()` retorna `value`, `toggle`, `isOpen`, `getItemProps` e `register`.
- `useToasts()` retorna estado e operações de uma store local de notificações.

Exemplo:

```ts
const dialog = useDialog();
// No template: <button v-bind="dialog.triggerProps">Abrir</button>
// O conteúdo recebe v-bind="dialog.contentProps" e um nome acessível.
```

## FDialog

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { FDialog } from '@forma-ui/vue';
const open = ref(false);
</script>

<template>
  <button @click="open = true">Abrir</button>
  <FDialog v-model:open="open" title="Confirmação">
    <p>Deseja continuar?</p>
  </FDialog>
</template>
```

`FDialog` disponibiliza `open`, `title`, `closeLabel`, `teleportTo` e `modal`, emitindo `update:open`. O componente fornece estrutura semântica mínima e overlay, não um sistema de design visual completo. O consumidor deve garantir texto e foco apropriados ao conteúdo.

## Limites

Os composables capturam as opções iniciais; quando precisar alterar dinamicamente opções de comportamento, use `controller.updateOptions()` quando disponível ou reconstrua o composable ao trocar o contexto. APIs em versão `0.x`.


## Controles adicionais

`useCheckbox`, `useSwitch`, `useDisclosure`, `useSlider` e `usePagination` fornecem refs reativas e os respectivos controladores. Combine `controller.get*Props()` com template bindings; mantenha o estado controlado sincronizado quando fornecer `checked`, `open`, `value` ou `page`.
