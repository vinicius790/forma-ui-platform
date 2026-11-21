# @forma-ui/react

Hooks e componentes adaptadores para React 18/19. React e React DOM são `peerDependencies`; `@forma-ui/core` é instalado junto ao workspace e publicado como dependência peer.

## Instalação

```bash
pnpm add react react-dom @forma-ui/core @forma-ui/react
```

## Dialog e AlertDialog

`useDialog()` e `useAlertDialog()` compartilham o mesmo gerenciamento de foco/camadas e expõem `role="dialog"` ou `role="alertdialog"`. Forneça um nome acessível e, quando aplicável, associe uma descrição.

## Menu checkbox/radio items

`useMenu()` fornece `getCheckboxItemProps()` e `getRadioItemProps()` para itens com `role="menuitemcheckbox"` e `role="menuitemradio"`; o estado `checked` vem do consumidor. Use `closeOnSelect: false` quando o menu deve permanecer aberto após a alternância.

## Select

`useSelect()` suporta seleção única; `useMultiSelect()` ativa seleção múltipla e mantém o listbox aberto durante as alternâncias. Use `labelProps` no elemento que nomeia o controle, `triggerProps` no botão-combobox, `listboxProps` no listbox e `getOptionProps(option, index)` em cada opção. Os IDs de `aria-activedescendant`, `aria-controls` e das opções são conectados pelo hook. Um `<select multiple>` nativo continua sendo a opção preferencial quando atende à experiência desejada.

```tsx
const select = useSelect({ options: [{ value: 'br', label: 'Brasil' }] });
return (
  <>
    <span {...select.labelProps}>País</span>
    <button {...select.triggerProps}>{select.value || 'Escolha um país'}</button>
    <ul {...select.listboxProps}>
      <li {...select.getOptionProps({ value: 'br', label: 'Brasil' }, 0)}>Brasil</li>
    </ul>
  </>
);
```

Mantenha o elemento com `listboxProps` montado enquanto aberto ou controle sua renderização de modo que `setListbox` receba o nó antes da interação.

## Button

```tsx
import { Button } from '@forma-ui/react';

export function SaveButton() {
  return <Button loading={false} onClick={() => console.log('salvo')}>Salvar</Button>;
}
```

O botão usa o elemento HTML nativo e preserva props padrão. `loading` é exposto por `aria-busy` e `data-loading`; a aplicação ainda deve decidir se bloqueia ações durante o carregamento.

## Dialog

```tsx
import { useDialog } from '@forma-ui/react';

export function ExampleDialog() {
  const dialog = useDialog({ titleId: 'example-title' });
  return (
    <>
      <button {...dialog.triggerProps}>Abrir detalhes</button>
      {dialog.open && (
        <div {...dialog.contentProps}>
          <h2 id="example-title">Detalhes</h2>
          <p>Conteúdo do diálogo.</p>
          <button onClick={dialog.close}>Fechar</button>
        </div>
      )}
    </>
  );
}
```

O hook controla foco, `aria-modal`, Escape, scroll lock e isolamento do conteúdo externo quando modal. Forneça um nome acessível por `titleId`, `descriptionId`, `aria-label` ou `aria-labelledby`. O consumidor controla overlay, portal e CSS. Para que o backdrop continue recebendo o clique de fechamento, mantenha-o como elemento decorativo dentro do nó ao qual `contentProps` é aplicado (com `aria-hidden="true"`), e não como irmão externo desse nó: o isolamento modal torna o conteúdo externo inerte.

## Outros adaptadores

- `useMenu()` expõe `triggerProps`, `contentProps`, `registerItem`, `getItemProps`, `openMenu` e `close`.
- `useTabs()` expõe `register`, `getTabProps`, `getPanelProps`, `select` e `focus`.
- `useTooltip()` expõe props de trigger/content e o controlador para conectar eventos de ponteiro/foco.
- `useSelect({ options })` expõe props de combobox, listbox e `getOptionProps`.
- `useAccordion()` expõe `register`, `toggle`, `isOpen` e `getItemProps`.
- `toast(input)` adiciona uma notificação à store global; `ToastViewport` renderiza e pausa/resume temporizadores conforme mouse/foco.

Os hooks são headless: não aplicam classe, estilo ou layout. Para diálogos complexos, use a estrutura semântica e os IDs retornados pelo hook; para casos básicos, prefira elementos nativos.

## Estado controlado

Use `value`/`open` e callbacks quando o estado pertencer ao componente pai; caso contrário use `defaultValue`/`defaultOpen`. `useSelect`, `useTabs`, `useAccordion` e `useMenu` sincronizam seus controladores com os props atuais. Não alterne entre modo controlado e não controlado durante a vida do componente.


## Controles adicionais

O adaptador também expõe `useCheckbox`, `useSwitch`, `useDisclosure`, `useSlider` e `usePagination`. Eles usam os controladores do core e sincronizam o estado com o ciclo React. O consumidor continua responsável por renderizar o HTML, garantir nomes acessíveis e conectar refs/IDs quando a interação exigir um elemento DOM.

```tsx
const toggle = useSwitch({ defaultChecked: true });
return <button {...toggle.buttonProps}>{toggle.checked ? 'Ligado' : 'Desligado'}</button>;
```
