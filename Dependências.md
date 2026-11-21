# Dependências e operação — Forma UI

Este guia consolida as instruções operacionais do arquivo `Dependências.md` recebido no RAR, atualizado para a estrutura expandida do monorepo mesclado. As regras arquiteturais completas estão em [`AGENTS.md`](AGENTS.md), [`SPEC.md`](SPEC.md) e [`docs/architecture.md`](docs/architecture.md).

## Comandos principais

| Objetivo | Comando |
|---|---|
| Instalar dependências | `pnpm install` |
| Validar estrutura e fontes | `pnpm validate:source` |
| Verificar mesclagem ZIP + RAR | `pnpm check:source-merge` |
| Compilar todos os pacotes | `pnpm build` |
| Verificar tipos | `pnpm typecheck` |
| Executar testes unitários | `pnpm test` |
| Executar testes de acessibilidade | `pnpm test:a11y` |
| Executar testes de navegador | `pnpm test:e2e` |
| Gerar documentação | `pnpm docs:build` |
| Construir Storybook | `pnpm storybook:build` |
| Verificar exports | `pnpm verify:exports` |
| Verificar metadados de release | `pnpm release:check` |

## Convenções herdadas e atualizadas

1. **Core primeiro:** lógica de estado, teclado, foco e semântica ARIA deve permanecer nos módulos independentes de framework em `packages/core` ou no pacote funcional apropriado.
2. **Reatividade com ciclo de vida:** adaptadores devem assinar stores/controladores e liberar subscriptions, listeners, timers e observers ao desmontar.
3. **RTL:** navegação horizontal deve usar direção lógica (`dir`) e nunca assumir que `ArrowLeft` significa sempre anterior.
4. **Testes:** cada alteração pública requer testes de transição, limites, teclado, semântica, cleanup e acessibilidade aplicáveis.
5. **APIs versionadas:** mudanças incompatíveis exigem Changeset e estratégia de migração; não altere versão principal com base apenas na versão declarada no snapshot antigo.
6. **Histórico preservado:** `archive-imports/17-01-design-system` é uma cópia de referência, não é código ativo do workspace. Não importe módulos dessa pasta para a distribuição sem revisão, adaptação e testes próprios.

> O documento original do RAR permanece preservado sem alterações em `archive-imports/17-01-design-system/Dependências.md`. Este arquivo na raiz é a versão operacional atualizada para o monorepo mesclado.
