# @forma-ui/a11y-testing

Helpers para auditorias automatizadas com axe-core e contratos semânticos mínimos em testes DOM/jsdom ou navegador.

```ts
import { assertNoA11yViolations, assertAriaContract } from '@forma-ui/a11y-testing';

await assertNoA11yViolations(document.querySelector('#dialog')!);
assertAriaContract(document.querySelector('[role="dialog"]')!, {
  role: 'dialog',
  requiredAttributes: ['aria-labelledby'],
  nameRequired: true,
});
```

`auditAccessibility()` retorna resultados axe, violações, passes e itens incompletos. `formatA11yViolations()` formata um relatório curto. `assertNoA11yViolations()` lança erro quando axe detecta violações.

O pacote exige `axe-core` como peer dependency. Um resultado sem violações automatizáveis não prova conformidade WCAG; inclua revisão manual do foco, leitor de tela, zoom, contraste, conteúdo e fluxo da aplicação.
