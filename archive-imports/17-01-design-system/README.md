# @forma-ui — Design System & Biblioteca de Componentes Headless

Biblioteca de UI agnóstica de estilo (comportamento, gerenciamento de estado, foco, teclado e acessibilidade WAI-ARIA/WCAG sem CSS imposto), distribuída como pacotes modulares versionados com tokens de design, adaptadores para React, Vue e Svelte, temas plugáveis opcionais, codemods SemVer e documentação interativa viva.

---

## Arquitetura em Camadas

```text
[1. @forma-ui/tokens]      Cores, espaçamento, tipografia, elevação, W3C JSON e contraste WCAG 2.1
         │
         ▼
[2. @forma-ui/core]        Primitivas (FocusTrap, RovingTabIndex, Positioner, Portal, I18n/RTL, LiveRegion)
         │                 + 8 Máquinas Headless (Button, Dialog, Menu, Tabs, Tooltip, Select, Toast, Accordion)
         ├────────────────────────┬────────────────────────┐
         ▼                        ▼                        ▼
[3A. @forma-ui/react]    [3B. @forma-ui/vue]     [3C. @forma-ui/svelte]   [4. @forma-ui/themes (Opcional)]
         │                        │                        │                        │
         └────────────────────────┴────────────────────────┴────────────────────────┘
                                                           │
                                                           ▼
                              [5. apps/docs + @forma-ui/a11y-testing + @forma-ui/codemods]
```

## Pacotes do Monorepo

| Pacote | Versão | Responsabilidade Principal |
| :--- | :--- | :--- |
| `@forma-ui/tokens` | `1.0.0` | Tokens semânticos, CSS Custom Properties (`--forma-*`), exportação W3C DTCG JSON e cálculo de contraste WCAG 2.1. |
| `@forma-ui/core` | `1.0.0` | Primitivas DOM/ARIA puras e máquinas de estado headless para os 8 componentes com *tree-shaking* por subpath. |
| `@forma-ui/react` | `1.0.0` | Componentes e hooks headless para React 18/19 sincronizados via `useSyncExternalStore`. |
| `@forma-ui/vue` | `1.0.0` | Composables reativos e componentes para Vue 3 (`ref`, `provide/inject`, `Teleport`). |
| `@forma-ui/svelte` | `1.0.0` | Stores compatíveis com `$store` e actions (`focusTrapAction`, `portalAction`) para Svelte 4/5. |
| `@forma-ui/themes` | `1.0.0` | Camada visual opcional (`lightTheme`, `darkTheme`, `highContrastTheme`) sem classes utilitárias impostas. |
| `@forma-ui/a11y-testing` | `1.0.0` | Suite de auditoria automatizada `axe-core`, validação de atributos ARIA e simulação de teclado/foco. |
| `@forma-ui/codemods` | `1.0.0` | CLI `forma-codemod` e transformações de código para migração automatizada entre versões SemVer. |
| `@forma-ui/docs` | `1.0.0` | Documentação viva interativa com alternância de tema, idioma, direção RTL e inspetor `axe-core` ao vivo. |

## Como Executar Localmente

```bash
# 1. Instalar todas as dependências do workspace
pnpm install

# 2. Validar tipagem TypeScript estrita em todos os pacotes
pnpm typecheck

# 3. Compilar todos os pacotes (ESM, CJS, .d.ts, tokens.json e styles.css)
pnpm build

# 4. Verificar integridade dos entry points, exports e metadados SemVer
pnpm verify:exports
pnpm release:check

# 5. Executar suíte completa de testes unitários, foco, teclado e axe-core
pnpm test
pnpm test:a11y

# 6. Iniciar servidor de desenvolvimento da documentação interativa
pnpm --filter @forma-ui/docs dev
```
