# Forma UI — Catálogo de Pacotes (`packages/`)

Os **31 pacotes publicáveis** do monorepo estão organizados em 5 domínios arquiteturais independentes e sem ciclos de runtime:

## 1. Núcleo Headless (`@forma-ui/core`)
- [`core`](./core/README.md) — 103 módulos de runtime (70 controllers WAI-ARIA + 32 primitivas DOM/Web APIs), zero dependências de framework ou CSS.

## 2. Motores de Domínio & Estado Colaborativo (8 pacotes)
- [`forms`](./forms/README.md) — Estado tipado de formulários, validação assíncrona/Standard Schema/JSON Schema, FieldArray, persistência, computed fields e wizard.
- [`data-grid`](./data-grid/README.md) — Ordenação, filtro, paginação, pinning, resizing, agrupamento/agregação, tree rows, pivot 2D, seleção de células + TSV e exportação CSV/JSON.
- [`commands`](./commands/README.md) — Command Palette assíncrono com abort, fuzzy highlight, frecency, sub-páginas, chords multi-tecla e registry.
- [`dates`](./dates/README.md) — Calendário gregoriano, DateRange, TimePicker, multi-month, semana ISO e recorrência RRULE.
- [`virtualization`](./virtualization/README.md) — Virtualização 1D (Fenwick-tree), 2D (`GridVirtualizer`), multi-lane (`MasonryVirtualizer`) e sticky headers.
- [`collections`](./collections/README.md) — Coleções indexadas (lista/árvore), `SelectionManager`, `RangeSelectionController`, filtro de árvore e `ReorderController` acessível.
- [`ai-ui`](./ai-ui/README.md) — Controllers acessíveis para IA generativa/agêntica (`StreamingMessageController`, `ToolApprovalController`, `CitationController`).
- [`crdt`](./crdt/README.md) — Estado colaborativo multiplayer zero-dep (`LwwRegister`, `LwwMap` com relógio de Lamport e `PresenceController`).

## 3. Adapters de Framework (8 pacotes)
- [`react`](./react/README.md) · [`vue`](./vue/README.md) · [`svelte`](./svelte/README.md) · [`preact`](./preact/README.md) · [`solid`](./solid/README.md) · [`lit`](./lit/README.md) · [`angular`](./angular/README.md) · [`qwik`](./qwik/README.md)

## 4. Design Tokens, Temas, Motion, SSR & Posicionamento (7 pacotes)
- [`tokens`](./tokens/README.md) · [`themes`](./themes/README.md) · [`tailwind`](./tailwind/README.md) · [`unocss`](./unocss/README.md) · [`motion`](./motion/README.md) · [`ssr`](./ssr/README.md) · [`floating-ui`](./floating-ui/README.md)

## 5. Developer Experience, Diagnóstico & Qualidade (7 pacotes)
- [`devtools`](./devtools/README.md) · [`cli`](./cli/README.md) · [`eslint-plugin`](./eslint-plugin/README.md) · [`codemods`](./codemods/README.md) · [`testing`](./testing/README.md) · [`a11y-testing`](./a11y-testing/README.md) · [`playwright`](./playwright/README.md)
