# Dependências.md — Guia Rápido de Contexto e Operação (@forma-ui)

Consulte `@AGENTS.md` para as regras completas de arquitetura. Abaixo estão os atalhos operacionais e convenções de código para sessões assistidas por IA:

## Comandos Frequentes
- **Instalar dependências:** `pnpm install`
- **Build completo do monorepo:** `pnpm build`
- **Verificação estrita de tipos:** `pnpm typecheck`
- **Rodar todos os testes unitários e de integração:** `pnpm test`
- **Rodar auditoria de acessibilidade (axe-core):** `pnpm test:a11y`
- **Validar árvore de exports e grafo de pacotes:** `pnpm verify:exports && pnpm release:check`
- **Iniciar playground interativo de documentação:** `pnpm --filter @forma-ui/docs dev`

## Convenções de Implementação de Componentes
1. **Core Primeiro:** Toda lógica de estado, teclado, foco e atributos ARIA deve residir em `packages/core/src/components/<componente>.ts` através de uma factory `create<Component>Machine(options)`.
2. **Assinatura Reativa Universal:** Toda máquina em `@forma-ui/core` deve implementar `getState()`, `subscribe(listener)` e `destroy()` (quando mantiver timers, portais ou listeners globais), permitindo adaptação direta para React (`useSyncExternalStore`), Vue (`ref` + `onUnmounted`) e Svelte (`ReadableStore`).
3. **Suporte Bidirecional (LTR/RTL):** Nunca codifique `ArrowLeft` ou `ArrowRight` de forma estática em listas horizontais; utilize `getNextRovingIndex` ou `getLogicalHorizontalStep` passando `dir: state.dir`.
4. **Testes Obrigatórios:** Cada componente exige testes unitários dedicados em `packages/core/src/__tests__/<componente>.test.ts` cobrindo teclado, foco, estados desabilitados e auditoria `expectNoA11yViolations` com `axe-core`.
