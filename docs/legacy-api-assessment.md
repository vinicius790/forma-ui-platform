# Avaliação de APIs do snapshot legado

Este documento orienta a comparação entre o snapshot do RAR e a árvore ativa. Não declara equivalência nem compatibilidade binária.

| Domínio | Contrato observado no RAR | Contrato observado na árvore ativa | Ação segura |
|---|---|---|---|
| Accordion | `createAccordionMachine`, `getState`, `subscribe`, root/item/trigger/panel prop-getters, navegação por teclado | `AccordionController`, `register`, `toggle`, `isOpen`, `getItemProps` | Preservar máquina antiga no snapshot; criar uma ADR antes de portar APIs de máquina para o contrato ativo |
| Button | `getButtonProps` com `elementType`, `onPress`, `aria-pressed`, semântica polimórfica | `getButtonProps` para botão nativo, disabled/loading/name/value | Manter nativo como padrão; avaliar polimorfismo como adição opt-in, com testes de teclado e semântica |
| Dialog | Máquina baseada em estado com partes e prop-getters | `DialogController` com FocusTrap, DismissableLayer, ScrollLock, Portal e aria-hide-outside | Comparar ciclo de vida/stack de modais; não substituir o controller atual |
| Menu | Máquina com prop-getters e itens menu/checkbox/radio | `MenuController` com registros de elementos, foco e typeahead | Portar apenas cenários ausentes; preservar a API já usada pelos adapters |
| Select | Máquina combinando combobox/listbox e single/multi | `SelectController` de listbox com seleção única/múltipla e gestão de elementos | Tratar diferenças ARIA como mudança de API; usar testes de teclado e leitor de tela antes de unificar |
| Tabs | Máquina com roving tabindex, orientação e RTL | Controller correspondente na árvore ativa | Comparar comportamento automático/manual e foco antes de portar |
| Toast | Store e ciclo de vida de mensagens | Store do pacote ativo | Comparar timers pausáveis, hover/focus e live-region antes de substituir |
| Tooltip | Máquina com grupo/warmup e prop-getters | Controller ativo | Avaliar coordenação entre tooltips e limpeza de timers como feature aditiva |
| Test setup | Polyfills de JSDOM em `vitest.setup.ts` | Setup mínimo de `jest-dom` | Extrair mocks controláveis por teste, evitando polyfills silenciosos que escondam falhas reais |

## Regras para portabilidade

- Não copiar `package.json` legado para o workspace ativo.
- Não copiar somente o core sem adaptar os três adapters correspondentes.
- Não mudar `exports` sem conferir os arquivos emitidos pelo build.
- Não considerar o número da versão do RAR como garantia de compatibilidade.
- Não executar o snapshot arquivado como parte do build principal.
