# @forma-ui/a11y-testing

Utilitários de auditoria automatizada de acessibilidade WAI-ARIA 1.2 e WCAG 2.1 baseados em `axe-core`, além de helpers para verificação de atributos ARIA e simulação determinística de navegação por teclado.

## Instalação

```bash
pnpm add -D @forma-ui/a11y-testing
```

## Funções Exportadas
- `runAxeAudit(container, options)`: Executa auditoria `axe-core` configurável sobre qualquer árvore DOM.
- `expectNoA11yViolations(container, options)`: Lança erro detalhado com o seletor e resumo de falha caso qualquer regra WCAG/WAI-ARIA seja violada.
- `assertAriaAttributes(element, expectedMap)`: Verifica contratos exatos de atributos `aria-*` e `role`.
- `simulateKeyboardSequence(steps, initialTarget)`: Dispara uma sequência de eventos `keydown` (`Tab`, `Shift+Tab`, `ArrowDown`, `Enter`, `Escape`) e retorna a trilha de elementos focados.
