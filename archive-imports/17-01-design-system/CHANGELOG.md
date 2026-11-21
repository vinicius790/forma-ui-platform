# Changelog — @forma-ui Monorepo

Todas as mudanças notáveis deste projeto são documentadas neste arquivo seguindo o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e o [Versionamento Semântico (SemVer 2.0.0)](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-11-17

### Added (Novas Funcionalidades)
- **`@forma-ui/tokens` (v1.0.0):**
  - Escalas completas de cores (`colorScale`), tokens semânticos (`semanticColorsLight`), espaçamento (`spacingTokens`), tipografia (`typographyTokens`), raios (`radiiTokens`), sombras (`shadowTokens`), camadas (`zIndexTokens`) e movimento (`motionTokens`).
  - Conversor determinístico para CSS Custom Properties (`tokensToCssVariables`, `cssVar`) e exportação no formato padrão W3C Design Tokens Community Group (`toW3CTokens`, `dist/tokens.json`).
  - Motor matemático de luminância relativa e razão de contraste WCAG 2.1 (`parseHexColor`, `getRelativeLuminance`, `getContrastRatio`, `evaluateWcagContrast`) para validação AA (`4.5:1`) e AAA (`7.0:1`).
  - Utilitários de espaçamento lógico CSS RTL-first (`createLogicalPadding`).
- **`@forma-ui/core` (v1.0.0):**
  - 13 módulos de primitivas headless: `id`, `dom`, `keyboard`, `focus` (`FocusTrap` empilhável com restauração de foco), `scroll-lock` (contagem de referência + compensação `--forma-scrollbar-width`), `aria-hide-outside` (isolamento `aria-hidden` para modais), `roving-tabindex` (1D/2D com espelhamento RTL), `typeahead` (normalização Unicode NFD sem acentos), `dismissable-layer` (pilha global Escape/Outside click), `positioner` (cálculo de colisão, flip, shift e espelhamento RTL), `portal`, `live-region` (`polite` e `assertive`) e `i18n` (`pt-BR`, `en-US`, `es-ES`, `ar-SA`).
  - 8 componentes headless completos com subpaths individuais tree-shakeable: `Button`, `Dialog` (`dialog` e `alertdialog`), `Menu` (`menuitem`, `menuitemcheckbox`, `menuitemradio`), `Tabs` (`automatic` e `manual`), `Tooltip` (com warmup group), `Select` (Combobox/Listbox `single` e `multiple`), `Toast` (timers pausáveis WCAG 2.2.1 e helper `promise()`) e `Accordion` (`single` e `multiple`).
- **`@forma-ui/react`, `@forma-ui/vue`, `@forma-ui/svelte` (v1.0.0):**
  - Adaptadores idiomáticos para React 18/19 (`useSyncExternalStore` + `createPortal`), Vue 3 (`ref`, `provide/inject`, `Teleport`) e Svelte 4/5 (`ReadableStore` `$store` + actions `use:focusTrapAction` e `use:portalAction`).
- **`@forma-ui/themes` (v1.0.0):**
  - Temas plugáveis opcionais (`lightTheme`, `darkTheme`, `highContrastTheme`), factory `createTheme()`, injetor `applyTheme()` e folha de estilos opcional baseada em seletores `[data-forma-*]`.
- **`@forma-ui/a11y-testing` & `@forma-ui/codemods` (v1.0.0):**
  - Utilitários de auditoria `axe-core`, simuladores de sequência de teclado, verificador de ciclo de foco e CLI `forma-codemod` para migrações automatizadas SemVer.
- **`@forma-ui/docs` (v1.0.0):**
  - Aplicação interativa de documentação viva com demonstrações dos 8 componentes, visualizador de tokens e matriz de contraste WCAG, matriz de teclado LTR/RTL e inspetor ARIA/axe-core em tempo real.
