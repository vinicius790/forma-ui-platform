# Changelog

All notable changes to Forma UI are documented here.

## 100.0.0 — Centennial Headless, Generative AI-UI & Multiplayer CRDT Platform

### Added

- **2 novos pacotes oficiais (31 pacotes + 2 apps):**
  - `@forma-ui/ai-ui`: controllers acessíveis para interfaces de IA generativa/agêntica (`StreamingMessageController` com `AbortController` + anúncios live-region com throttle, `ToolApprovalController` Human-in-the-Loop, `CitationController`).
  - `@forma-ui/crdt`: estado colaborativo multiplayer zero-dep (`LwwRegister`, `LwwMap` com relógio de Lamport, `PresenceController` com TTL).
- **`@forma-ui/core` (97 módulos sem framework/CSS):** +8 controllers (`Dock`, `Timeline`, `DiffViewer`, `Mention`, `SpatialCanvas`, `AudioPlayer`, `CodeGutter`, `WizardDialog`) e +4 primitivas (`spatial-nav`, `scheduler` `yieldToMain`/`runChunkedWork`, `web-share`/`wakeLock`, `state-sync` URL codec).
- **Paridade `100.0.0` nos 8 adapters de framework (`workbench-and-media.ts`):** React, Vue, Svelte, Preact, Solid, Lit, Angular e Qwik.
- **CLI (`100.0.0`, 64 controllers no catálogo), ESLint Plugin (`100.0.0`) e suíte real Node 24 (`scripts/verify-workbench-ai-and-crdt.mjs`).**

## 50.0.0 — Next-Generation Headless Interaction, Multi-Framework & DevTools Platform

### Added

- **2 novos pacotes oficiais (29 pacotes + 2 apps):**
  - `@forma-ui/qwik`: 8º adapter de framework com bindings resumáveis (`createResumableBinding`, `bindStoreToQwikSignal`, `createQwikDialog`, `createQwikPopover`, `createQwikDrawer`, `createQwikCollapsible`, `createQwikTabs`, `createQwikStepper`, `createQwikOtpInput`, `createQwikBottomSheet`).
  - `@forma-ui/devtools`: inspetor opt-in conectado ao `TelemetryBus` com registro de controllers, linha do tempo de transições, exportação JSON e auditoria DOM (`duplicateIds`, `danglingAriaRefs`, `positiveTabIndexCount`).
- **`@forma-ui/core` (+10 controllers e +5 primitivas Web APIs, total 85 módulos de runtime sem framework/CSS):**
  - Controllers: `TreeGrid`, `Menubar`, `Feed`, `Kanban`, `CommandBar`, `OtpInput`, `SignaturePad`, `QrCode`, `BottomSheet`, `NotificationCenter`.
  - Primitivas: `focus-scope`, `gesture` (swipe/long-press/pinch), `eye-dropper`, `viewport` (`VisualViewport` + teclado virtual), `telemetry` (`TelemetryBus`).
- **70 novos bindings nos 7 adapters existentes (`enterprise-and-boards.ts`):** React, Vue, Svelte, Preact, Solid, Lit (`FormaCallbackBridge`) e Angular (`DestroyRef` + Signals).
- **Motores de domínio v50 (`módulos de domínio`):**
  - `@forma-ui/forms`: `createComputedFieldsEngine`, `createJsonSchemaFormValidator`, `createOptimisticSubmit`.
  - `@forma-ui/data-grid`: `flattenTreeRows`, `createPivotModel`, `CellRangeSelectionManager` + TSV Copy/Paste, `reorderColumns`.
  - `@forma-ui/commands`: `ChordSequenceTracker`, `createCommandRegistry`, `CommandHistory`.
  - `@forma-ui/dates`: `expandRecurrence` (RRULE gregoriano), `getMultiMonthGrids`, `diffISODates`, `formatRelativeDays`.
  - `@forma-ui/virtualization`: `MasonryVirtualizer` (multi-lane), `findActiveStickyIndex`.
  - `@forma-ui/collections`: `filterTreePreservingAncestors`, `RangeSelectionController`.
- **Plataforma, Styling, DX, QA & Apps v50:**
  - `@forma-ui/tokens` (`hexToOklch`, `oklchToCss`, `generateTonalScale`, `importDtcgTokens`), `@forma-ui/themes` (`createCustomTheme`, `typedPropertiesCss`), `@forma-ui/tailwind` & `@forma-ui/unocss` (novas variantes de estado v50), `@forma-ui/motion` (FLIP WAAPI, `createScrollTimelineCss`, `computeStaggerDelay`), `@forma-ui/ssr` (`renderDeclarativeShadowDom`, `createHydrationScriptTag` CSP nonce, `hashRenderTree`), `@forma-ui/floating-ui` (`isPointInSafePolygon`, `createCssAnchorStyles`).
  - `@forma-ui/eslint-plugin` `50.0.0` (8 regras AST: +`valid-aria-role`, +`no-clickable-non-interactive`), `@forma-ui/codemods` (`v50` + Chakra/Ark), `@forma-ui/cli` `50.0.0` (`qwik`, 56 controllers no `catalog`, `forma audit`), `@forma-ui/testing` (`assertRtlArrowMirroring`), `@forma-ui/a11y-testing` (`assertMinimumTargetSize` SC 2.5.8), `@forma-ui/playwright` (`auditReflow320px` SC 1.4.10), `apps/docs` & `apps/storybook` (`enterprise-and-productivity.stories.ts`).

## 10.0.0 — Plataforma Headless Enterprise & Ecossistema Completo

### Added

- **`@forma-ui/core` (15 novos controllers + 7 novas primitivas Web APIs, total 70 módulos de runtime sem framework/CSS):**
  - Controllers: `Popover`, `Drawer`, `Collapsible`, `Splitter`, `HoverCard`, `ContextMenu`, `Stepper`, `FileUpload`, `Carousel`, `ColorPicker`, `TagsInput`, `Editable`, `Tour`, `ScrollArea`, `SegmentGroup`.
  - Primitivas SSR-safe: `clipboard`, `media-query`, `hotkeys`, `resize-observer`, `undo-redo` (`createHistoryStack`), `popover-api` (HTML native top-layer), `broadcast-sync` (`BroadcastChannel`).
- **Paridade nos 7 adapters de framework (`react`, `vue`, `svelte`, `preact`, `solid`, `lit`, `angular`):**
  - Hooks/composables/stores/signals com inicialização lazy, sincronização de props controladas e cleanup idempotente.
  - `@forma-ui/lit`: `FormaCallbackBridge` e `FormaHotkeysController`.
  - `@forma-ui/angular`: 15 signal injectors com `DestroyRef` (`injectPopover`, `injectDrawer`, `injectStepper`, `injectTagsInput`, `injectHotkeys`, etc.).
- **Motores de domínio expandidos:**
  - `@forma-ui/forms`: `FieldArrayController`, `createFormPersistence` (autosave SSR-safe), `WizardFormController`.
  - `@forma-ui/data-grid`: `partitionPinnedColumns`, `ColumnSizingManager`, `groupAndAggregateRows` (`sum|avg|min|max|count`), `InlineCellEditor`, exportação RFC 4180 `exportGridToCsv` & `exportGridToJson`.
  - `@forma-ui/commands`: `FrecencyTracker`, `getFuzzyMatchRanges`, `CommandPageStack`.
  - `@forma-ui/dates`: `DateRangeController`, `TimePickerController` (12h/24h spinbutton ARIA), `getISOWeekNumber`.
  - `@forma-ui/virtualization`: `GridVirtualizer` 2D (linhas + colunas com FenwickTree e linhas/colunas fixas).
  - `@forma-ui/collections`: `ReorderController` (reordenação acessível por teclado com anúncios live-region).
- **Tokens, temas, motion, SSR & bridges:**
  - `@forma-ui/tokens`: paleta perceptual OKLCH, Container Query breakpoints, tipografia fluida `clamp()`, e contraste perceptual APCA-W3 (`apcaContrastLc`, `pickAccessibleForeground`).
  - `@forma-ui/themes`: `oled-dark`, `high-contrast-light`, `@layer forma.themes`, `forcedColorsCss()`, `observeSystemTheme`.
  - `@forma-ui/tailwind`: `createFormaTailwindV4Css` (`@theme` + `@custom-variant` para estados `data-*`).
  - `@forma-ui/unocss`: variantes `forma-open:`, `forma-active:`, `forma-disabled:`, `forma-dragging:`, `forma-grabbed:`.
  - `@forma-ui/motion`: `withViewTransition`, solver físico de mola (`solveSpringKeyframes`, `createSpringLinearEasing`) e `animateWithMotionGuard` (WAAPI).
  - `@forma-ui/ssr`: `createHydrationContext`, `serializeHydrationState` (XSS-safe), `deserializeHydrationState`.
  - `@forma-ui/floating-ui`: `createVirtualAnchor` e detector `supportsCssAnchorPositioning`.
- **Ferramentas DX, QA e Apps:**
  - `@forma-ui/eslint-plugin` `10.0.0`: 6 regras AST (+`no-autofocus`, `no-role-presentation-on-focusable`, `require-accessible-button-name`) e preset `strict`.
  - `@forma-ui/codemods`: trilha `v0 -> v1 -> v2 -> v10` e `migrateEcosystemImports` (Radix UI / Headless UI → Forma UI).
  - `@forma-ui/cli` `10.0.0`: novos comandos `catalog`, `add component <name>` e `tokens`.
  - `@forma-ui/testing`, `@forma-ui/a11y-testing`, `@forma-ui/playwright`: `runControllerContractCheck`, `assertKeyboardReachable`, `assertModalIsolation`, `auditFocusOrder`, `emulateForcedColors`, `emulateReducedMotion`.
  - `apps/docs` (matriz de teclado v10) e `apps/storybook` (`overlays-and-inputs.stories.ts`).
- **Verificação real de runtime em Node 24 (`scripts/verify-core-and-domains.mjs`)** executando diretamente o código TypeScript do core, motores de domínio, tokens, temas, motion, SSR e bridges.

## 0.3.0 — Ecossistema ampliado e auditoria

### Added

- Pacotes `@forma-ui/commands`, `@forma-ui/data-grid` e `@forma-ui/eslint-plugin`, com APIs, documentação e testes dedicados.
- Novos testes de ciclo de vida, corrida assíncrona, identidade de comandos, estimadores virtuais e modelos de grade.
- Verificações dinâmicas para todos os pacotes: manifesto, README, código-fonte, exports, bins, dependências internas e scripts referenciados.
- Pesquisa técnica de repositórios de referência, inventário de dependências declaradas e mapa de arquitetura gerado.
- CLI com targets Preact e Vanilla DOM e versão sincronizada com o workspace.

### Changed

- `@forma-ui/virtualization` valida estimadores por índice, normaliza valores não finitos, protege atualização de opções de forma transacional e impede mutações após destruição.
- `@forma-ui/commands` valida IDs únicos, normaliza IDs DOM, protege consultas assíncronas obsoletas e rejeita seleção de comandos fora da lista de resultados.
- `@forma-ui/data-grid` usa botões nativos para ordenação e valida identidades/valores de linhas e colunas.
- ESLint plugin usa configuração flat recomendada com alias consistente e regras conservadoras para elementos disabled/links.

### Validation

- Auditorias estáticas dos 27 pacotes e da arquitetura desacoplada do core.
- Build completo, testes de framework/navegador e publicação ainda exigem instalação das dependências reais.

## 0.2.0 — Expanded foundation

### Added

- Eleven core modules: Checkbox, Switch, Radio Group, Slider, Progress, Separator, Breadcrumb, Pagination, Disclosure, Combobox and Form Field helpers.
- Initial Solid, Lit/Web Components and Angular adapter packages.
- Optional Tailwind CSS and UnoCSS token integrations.
- `@forma-ui/cli` for integration discovery, scaffolding, theme generation and environment diagnostics.
- `@forma-ui/playwright` browser-test helpers, configuration and smoke test.
- Property-based tests for slider and pagination invariants.
- Expanded React, Vue and Svelte bindings for new state controls.
- Repository quality controls: Dependabot, Renovate, CodeQL workflow, package metadata checks, API documentation config and security/contribution policies.
- Expanded docs, architecture decisions, adapter parity matrix and release roadmap.

### Changed

- Workspace package versions advanced to 0.2.0.
- CI/release workflows expanded; release workflow is prepared for npm trusted publishing through OIDC.
- Documentation playground now includes additional control examples and keyboard matrix entries.

### Notes

- Full dependency installation, cross-framework typecheck, browser automation and assistive-technology review remain required before claiming the project is production-ready or WCAG conformant.

- Optional `@forma-ui/floating-ui` integration for auto-updating collision-aware overlay placement.
- Optional `@forma-ui/forms` package with typed field state, async validation, submission lifecycle and framework external-store bindings.

## Unreleased — Developer experience

- Add a Storybook 10 + Lit 3 component workshop with accessibility addon.
- Expand Playwright to Chromium, Firefox, WebKit, and mobile viewport projects.
- Add interaction-level E2E coverage for modal dialog, tabs, switch state, and locale direction.
- Strengthen form async-disposal test synchronization.
