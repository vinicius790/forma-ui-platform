# @forma-ui/svelte

Adaptadores headless para Svelte 5. O pacote fornece stores e actions; não injeta estilos nem renderiza componentes visuais completos. Os eventos e o estado são integrados aos controladores independentes do framework em `@forma-ui/core`.

## Instalação

```bash
pnpm add svelte @forma-ui/core @forma-ui/svelte
```

## Stores disponíveis

- `createDialogStore(initial)`: `open`, `controller`, `set`, `getTriggerProps`, `getContentProps`, actions `attachTrigger`/`attachContent` e `destroy`. `createAlertDialogStore(initial)` oferece o mesmo contrato com `role="alertdialog"`.
- `createMenuStore(initial, direction)`: `open`, `show`, `hide`, registro de itens, helpers para menuitemcheckbox/menuitemradio e actions de trigger/conteúdo.
- `createTabsStore(initial, options)`: store `value`, `select`, registro de tabs e props de tab/painel.
- `createSelectStore(options, initial)`: stores `value`/`open`, seleção, atualização de opções e actions de trigger/listbox. `createMultiSelectStore(options, initialArray)` ativa seleção múltipla, mantém o listbox aberto e aplica `aria-multiselectable=true`. Informe o mesmo `listboxId` à action `attachListbox` e à composição dos IDs das opções; `getOptionProps(option, index, listboxId)` faz essa conexão. Alterar diretamente as stores também atualiza o controlador.
- `createTooltipStore(options)`: store `open`, controller e actions de trigger/conteúdo.
- `createAccordionStore(initial, options)`: store `value`, `toggle`, `isOpen` e registro de itens.
- `createToastStore(options)`: store `notifications`, `add`, `update`, `dismiss`, `pause`, `resume`, `clear` e `destroy`.

## Exemplo: Tabs

```svelte
<script lang="ts">
  import { createTabsStore } from '@forma-ui/svelte';

  const tabs = createTabsStore('overview');
  const activeTab = tabs.value;
</script>

<div role="tablist" aria-label="Configurações">
  <button
    role="tab"
    aria-selected={$activeTab === 'overview'}
    tabindex={$activeTab === 'overview' ? 0 : -1}
    onclick={() => tabs.select('overview')}
  >Visão geral</button>
  <button
    role="tab"
    aria-selected={$activeTab === 'settings'}
    tabindex={$activeTab === 'settings' ? 0 : -1}
    onclick={() => tabs.select('settings')}
  >Preferências</button>
</div>
<section role="tabpanel" hidden={$activeTab !== 'overview'}>Visão geral</section>
<section role="tabpanel" hidden={$activeTab !== 'settings'}>Preferências</section>
```

## Actions DOM

`attachTrigger`, `attachContent`, `attachListbox` e `focusTrap` conectam elementos reais aos controladores e sincronizam estados e semântica ARIA: Dialog aplica `role=dialog/alertdialog` e associações de nome/descrição; Menu aplica `role=menu`; Select aplica `role=listbox`, `aria-multiselectable` e visibilidade; Tooltip aplica `role=tooltip`, `aria-describedby` e visibilidade. `getListboxProps` e os demais getters também ficam disponíveis para composição manual. Por exemplo, uma action retornada por `dialog.attachTrigger(element)` remove os listeners e desconecta a referência quando `destroy()` é chamado.

**Escolha um único método para ligar os eventos de cada elemento.** Use as actions `attach*` ou os objetos retornados por `get*Props`; não aplique os dois ao mesmo nó, pois isso duplicaria os handlers.

- `use:focusTrap` ativa um FocusTrap e restaura o foco ao destruir.
- `use:portal={target}` move o elemento para um seletor CSS ou `HTMLElement` e tenta restaurá-lo ao ponto original ao desmontar.
- `createPortalHost(target)` cria um host de portal descartável.

Sempre chame `destroy()` para stores/controladores com timers ou inscrições que sobrevivam ao componente. `focusTrap` é apropriada para conteúdo modal, não para menus e popovers não modais. Para aplicações SvelteKit, crie stores/controladores que acessam o DOM somente em código cliente e em actions, nunca no topo de módulos executados durante SSR.


## Controles adicionais

`createCheckboxStore`, `createSwitchStore`, `createDisclosureStore`, `createSliderStore` e `createPaginationStore` expõem stores legíveis, controladores e operações. Chame `destroy()` quando o objeto não estiver mais associado ao componente para remover inscrições.
