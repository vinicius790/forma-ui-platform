# @forma-ui/core

Núcleo de comportamento headless, independente de framework. Não injeta CSS, não renderiza componentes e não lê `window`/`document` no momento da importação.

## Instalação e importação

```bash
pnpm add @forma-ui/core
```

Importe o controlador específico sempre que possível:

```ts
import { createMenuController } from '@forma-ui/core/components/menu';
import { createTabsController } from '@forma-ui/core/components/tabs';
```

O barrel `@forma-ui/core` continua disponível, mas entradas específicas ajudam bundlers a excluir módulos não utilizados.

## Exemplo: Menu

```ts
const menu = createMenuController({
  direction: document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr',
  onOpenChange(open) {
    console.log('Menu aberto:', open);
  },
});

menu.setTrigger(triggerElement);
menu.setContent(menuElement);
const unregister = menu.registerItem({
  id: 'save',
  element: saveButton,
  textValue: 'Salvar',
  onSelect: saveDocument,
});

menu.openMenu('first');
// No unmount:
unregister();
menu.destroy();
```

O controlador administra navegação, foco, typeahead, Escape e dispensação externa. O consumidor continua responsável por renderizar elementos com os props retornados por `getTriggerProps()`, `getContentProps()` e `getItemProps()` e por manter suas relações de IDs. Para tooltip, escolha uma única estratégia: conectar o DOM com `setTrigger()`/`setContent()` (que instala listeners) **ou** aplicar manualmente os handlers de `getTriggerProps()`/`getContentProps()`; não use ambas ao mesmo tempo.

## Controlado ou não controlado

`defaultOpen`/`defaultValue` inicializam o estado interno. `open`/`value` definem estado controlado: nesse modo, as chamadas de mudança notificam `onOpenChange`/`onValueChange`, mas o consumidor deve fornecer o novo valor de volta por `updateOptions()` ou pelo adaptador do framework. Não misture as duas formas de controle.

## Componentes disponíveis

| Controlador | Responsabilidade |
|---|---|
| `getButtonProps` | Atributos de botão nativo, disabled e loading |
| `createDialogController` | Dialog, ciclo modal, foco, scroll lock, isolamento ARIA e portal |
| `createMenuController` | Menu de comandos, foco, setas, Home/End e typeahead |
| `createTabsController` | Tabs automáticas/manuais, orientação, LTR/RTL |
| `createTooltipController` | Tooltip não interativo, delays, foco e warmup |
| `createSelectController` / `createMultiSelectController` | Select-only combobox/listbox com seleção única ou múltipla opcional |
| `createToastStore` | Store de notificações, temporizadores pausáveis e ciclo de vida |
| `createAccordionController` | Accordion simples/múltiplo e estado controlado |
| `createCheckboxController` | Checkbox booleano/indeterminado e sincronização DOM |
| `createSwitchController` | Switch headless com props de botão e input de formulário |
| `createRadioGroupController` | Seleção única, roving focus e navegação LTR/RTL |
| `createSliderController` | Slider numérico simples/múltiplo, limites e passos |
| `createComboboxController` | Campo editável, listbox e aria-activedescendant |
| `createDisclosureController` | Estado expandido/recolhido |
| `createPaginationController` | Páginas, limites, estados anterior/próxima e elipses |
| `getProgressProps` / `getSeparatorProps` | Semântica de progressbar e separator |
| `getBreadcrumbNavProps` / `getBreadcrumbItemProps` | Navegação de breadcrumb e página atual |
| `createFormFieldIds` / `getFormControlProps` | IDs e associações de label, descrição e erro |

Primitivas DOM reutilizáveis ficam em `@forma-ui/core/primitives/*` e são reexportadas pelo pacote raiz.

## Limites de escopo

- O fluxo principal do MVP é seleção única e não editável. Há um modo múltiplo opt-in (`multiple: true` ou `createMultiSelectController`) sem autocomplete, filtro ou virtualização. Prefira `<select>`/`<select multiple>` nativos quando atenderem ao caso de uso.
- `Menu` é destinado a comandos de aplicação; navegação de site geralmente deve usar links e listas nativas.
- `Tooltip` é não interativo. Conteúdo com controles requer popover/dialog.
- O núcleo não oferece estilos ou markup completo; a aplicação precisa compor os elementos e seus IDs acessíveis.
- A API está em `0.x` e pode mudar antes da primeira versão estável.

A biblioteca orienta-se por WAI-ARIA APG e WCAG 2.2 AA como objetivo de engenharia, não como certificação. Execute testes com teclado, leitores de tela, zoom e alto contraste no contexto real da aplicação.
