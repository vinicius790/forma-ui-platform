# Guia de Acessibilidade WAI-ARIA 1.2 & WCAG 2.1 — @forma-ui

## 1. Matriz de Conformidade WAI-ARIA por Componente

| Componente | Role Principal | Roles Filhos | Atributos ARIA Gerenciados Automaticamente |
| :--- | :--- | :--- | :--- |
| **Button** | `button` (nativo ou polimórfico) | — | `aria-disabled`, `aria-busy`, `aria-pressed` |
| **Dialog** | `dialog` ou `alertdialog` | — | `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` |
| **Menu** | `menu` | `menuitem`, `menuitemcheckbox`, `menuitemradio` | `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, `aria-labelledby`, `aria-activedescendant`, `aria-disabled`, `aria-checked` |
| **Tabs** | `tablist` | `tab`, `tabpanel` | `aria-orientation`, `aria-selected`, `aria-controls`, `aria-labelledby`, `aria-disabled` |
| **Tooltip** | `tooltip` | — | `aria-describedby` (vinculado dinamicamente apenas quando aberto) |
| **Select** | `combobox` (gatilho) + `listbox` | `option` | `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-multiselectable`, `aria-selected`, `aria-required` |
| **Toast** | `region` (viewport) | `alert` ou `status` | `aria-live="assertive"` (erro/alerta) ou `aria-live="polite"` (info/sucesso), `aria-atomic="true"`, `aria-label` |
| **Accordion** | `region` (painel) | `button` dentro de `<h3>` | `aria-expanded`, `aria-controls`, `aria-labelledby`, `aria-disabled` |

## 2. Gerenciamento de Foco e Isolamento Modal
1. **Pilha de Focus Traps (`createFocusTrap`):** Mantém uma pilha global (`activeTrapStack`) de armadilhas de foco ativas. Apenas a armadilha no topo da pilha intercepta `Tab` e `Shift+Tab`, permitindo modais aninhados sem conflito. Ao desativar, o foco retorna exatamente ao elemento que estava ativo antes da abertura (`restoreFocus: true`).
2. **Isolamento de Árvores Irmãs (`ariaHideOutside`):** Quando um `Dialog` modal é montado, todos os elementos irmãos fora da hierarquia do modal recebem `aria-hidden="true"` (exceto regiões `data-forma-live-region`), impedindo que leitores de tela naveguem pelo conteúdo de fundo. Um contador `WeakMap` garante que o fechamento de um modal aninhado não remova prematuramente o `aria-hidden` do modal pai.
3. **Pilha de Camadas Dispensáveis (`createDismissableLayer`):** Pressionar `Escape` ou clicar fora fecha exclusivamente a camada flutuante mais interna (por exemplo, fechar um `Select` ou `Menu` aberto dentro de um `Dialog` sem fechar o `Dialog`).

## 3. Critérios WCAG 2.1 Atendidos
- **WCAG 1.4.3 (Contrast Minimum - AA) & 1.4.6 (Contrast Enhanced - AAA):** Verificados matematicamente por `evaluateWcagContrast` em `@forma-ui/tokens` e em runtime pelo `highContrastTheme` (`21:1` de contraste).
- **WCAG 2.1.1 (Keyboard) & 2.1.2 (No Keyboard Trap):** Todos os 8 componentes são 100% operáveis via teclado e todo `FocusTrap` modal oferece saída determinística via `Escape` e botão de fechamento rotulado.
- **WCAG 2.2.1 (Timing Adjustable):** Todos os toasts em `createToastStore` pausam seus timers automaticamente em `mouseenter` e `focus`, retomando a contagem regressiva apenas em `mouseleave` e `blur`.
