# Política de dependências e integrações opcionais

## Princípio

O `@forma-ui/core` não depende de React, Preact, Vue, Svelte, Solid, Lit, Angular, CSS framework, biblioteca de posicionamento, validador de schema ou test runner. Pacotes que precisam dessas ferramentas devem declará-las explicitamente como peer dependencies, optional peers ou dev dependencies e documentar o motivo.

## Integrações

| Integração | Pacote | Tipo | Motivo | Política |
|---|---|---|---|---|
| React | `@forma-ui/react` | Peer | hooks e external store | Compatibilidade documentada React 18/19 |
| Preact | `@forma-ui/preact` | Peer | hooks e controller binding | Testar runtime Preact efetivo |
| Vue | `@forma-ui/vue` | Peer | composables e lifecycle | Vue 3 |
| Svelte | `@forma-ui/svelte` | Peer | stores e actions | Svelte 5; não misturar sem documentação runes e store contracts |
| Solid | `@forma-ui/solid` | Peer | signals e owner cleanup | Solid 1.x |
| Lit | `@forma-ui/lit` | Peer | ReactiveController bridge | Lit 3+ |
| Angular | `@forma-ui/angular` | Peer | signals e DestroyRef | Angular suportado pela matriz atual do pacote |
| Floating UI DOM | `@forma-ui/floating-ui` | Peer opcional do adapter | collision-aware positioning | Instalar apenas quando necessário; cleanup de `autoUpdate` obrigatório |
| axe-core | `@forma-ui/a11y-testing` | Peer | auditoria automatizada | Test-only; não runtime de componentes |
| Playwright | `@forma-ui/playwright` | Peer/dev | browser automation | Não instalar no consumidor de core |
| Storybook | `apps/storybook` | Dev app | workshop isolado | Não publicar como runtime package |
| Tailwind / UnoCSS | adapters dedicados | Peer/dev conforme pacote | mapeamento de tokens | CSS opcional e sem reset automático |
| Vitest / Testing Library | workspace | Dev | unit/component tests | Não exportar dependência de testes no core |

## Dependências de validação de forms

`@forma-ui/forms` mantém contratos neutros e mapeia o resultado de validadores para `FormErrors`. Um adapter específico pode adotar Standard Schema ou integrar Zod/Valibot/ArkType; a biblioteca principal não deve importar todos esses validadores em conjunto.

## Auditoria de licença

Metadados e licenças de repositórios externos são evidência para pesquisa, não permissão para incorporar código. A licença de qualquer dependência transitiva precisa ser auditada depois que `pnpm-lock.yaml` for gerado. Particularmente, axe-core usa MPL-2.0; a distribuição e avisos devem respeitar a licença aplicável.

## Inventário

`docs/dependency-inventory.json` lista dependências declaradas nos manifestos. Ele não é um SBOM completo: não representa versões transitivas resolvidas, integrity hashes nem vulnerabilidades. Um CycloneDX/SPDX SBOM real deve ser gerado a partir do lockfile de uma instalação reprodutível antes do release.
