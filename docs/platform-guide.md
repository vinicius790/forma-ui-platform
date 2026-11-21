# Forma UI 100.0.0 — Guia Completo da Plataforma

Plataforma headless, acessível (alvo WCAG 2.2 / WAI-ARIA APG) e agnóstica de framework composta por **31 pacotes publicáveis** e **2 aplicações de desenvolvimento** (`apps/docs` e `apps/storybook`).

## Inventário de pacotes (`100.0.0`)

- **Núcleo:** `@forma-ui/core` (103 módulos de runtime sem framework/CSS: 70 controllers + 32 primitivas + barrel).
- **8 Adapters de Framework:** `@forma-ui/react`, `@forma-ui/vue`, `@forma-ui/svelte`, `@forma-ui/preact`, `@forma-ui/solid`, `@forma-ui/lit`, `@forma-ui/angular`, `@forma-ui/qwik`.
- **Motores de Domínio & Fronteira:** `@forma-ui/forms`, `@forma-ui/data-grid`, `@forma-ui/commands`, `@forma-ui/dates`, `@forma-ui/virtualization`, `@forma-ui/collections`, `@forma-ui/ai-ui`, `@forma-ui/crdt`, `@forma-ui/devtools`.
- **Tokens, Styling, Motion, SSR & Posicionamento:** `@forma-ui/tokens` (OKLCH/APCA/DTCG), `@forma-ui/themes` (`@layer`, `@property`, `forced-colors`), `@forma-ui/tailwind`, `@forma-ui/unocss`, `@forma-ui/motion` (View Transitions, Spring `linear()`, WAAPI FLIP), `@forma-ui/ssr` (HydrationContext XSS-safe, DSD), `@forma-ui/floating-ui`.
- **DX & Qualidade:** `@forma-ui/cli`, `@forma-ui/eslint-plugin`, `@forma-ui/codemods`, `@forma-ui/testing`, `@forma-ui/a11y-testing`, `@forma-ui/playwright`.

## Corpus determinístico de benchmarks (> 1 GB)

O gerador [`scripts/generate-benchmark-fixtures.mjs`](../scripts/generate-benchmark-fixtures.mjs) produz **18 shards JSONL** determinísticos (cada shard `< 100 MB`, sem dados pessoais, domínio reservado `example.test`, 6 JSON Schemas 2020-12) cobrindo Data Grid, Command Palette, Virtualization, AI Streams (`@forma-ui/ai-ui`), CRDT Ops (`@forma-ui/crdt`) e Tree/Kanban/Timeline/DevTools (`tree-hierarchy`), totalizando **> 1.15 GB** auditáveis via `pnpm fixtures:verify`.
