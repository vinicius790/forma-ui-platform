# Forma UI

**A framework-agnostic, headless interaction and accessibility platform for the web.**

Forma UI separates interaction state machines, DOM primitives and accessibility contracts from rendering and presentation. The core does not ship a visual language, component CSS, CSS reset or framework runtime. Framework adapters are optional packages; themes and utility-CSS integrations are opt-in.

> Project status: **Forma UI 100.0.0** — centennial headless interaction, accessibility, AI-UI & multiplayer CRDT platform across **31 packages** (8 framework adapters + DevTools + AI-UI + CRDT) and **2 workshop apps**. Note: automated checks and runtime tests never substitute for full browser matrix and manual assistive-technology WCAG 2.2 evaluation.

## Why Forma UI exists

Most UI libraries bundle behavior and visual design. That is convenient for a product UI, but it creates friction when teams need a bespoke visual system, a shared design-token contract, strict accessibility review or a component layer that spans multiple frameworks. Forma UI aims to supply the hard-to-reimplement behavioral foundation while leaving rendering and styling in the consumer's hands.

The core principle is:

```text
Design tokens (optional)
        ↓
Core state machines + DOM primitives
        ↓
Framework adapters (React / Vue / Svelte / Preact / Solid / Lit / Angular)
        ↓
Consumer markup, styles, themes and application behavior
```

## Packages

| Package | Purpose | Framework / runtime |
|---|---|---|
| `@forma-ui/core` | Headless controllers and DOM primitives | Vanilla TypeScript / DOM |
| `@forma-ui/forms` | Typed form state, async validation, lifecycle, ARIA field props and Standard Schema bridge | Framework-neutral |
| `@forma-ui/collections` | Stable keyed list/tree collections and selection manager | Framework-neutral |
| `@forma-ui/commands` | Async, abortable command palette state and keyboard navigation | Framework-neutral |
| `@forma-ui/data-grid` | Sort/filter/page/selection models and ARIA grid metadata | Framework-neutral |
| `@forma-ui/eslint-plugin` | Static accessibility rules for native interactive markup | ESLint 9 flat config |
| `@forma-ui/dates` | Gregorian date-only arithmetic and calendar controller | Framework-neutral / Intl |
| `@forma-ui/virtualization` | One-dimensional fixed/variable-size virtual ranges | Framework-neutral / optional DOM observer |
| `@forma-ui/motion` | Motion tokens and reduced-motion helpers | CSS / Web APIs |
| `@forma-ui/ssr` | Request-scoped deterministic ID scopes | Framework-neutral |
| `@forma-ui/testing` | DOM contract checks for ARIA IDREFs, duplicate IDs and focusables | DOM / Vitest |
| `@forma-ui/floating-ui` | Optional auto-updating placement adapter with flip/shift/size/arrow | Floating UI DOM |
| `@forma-ui/react` | Hooks and React helpers | React 18+ / React 19 |
| `@forma-ui/preact` | Hooks and controller bindings for Preact | Preact 10+ |
| `@forma-ui/vue` | Composables and dialog component helper | Vue 3 |
| `@forma-ui/svelte` | Stores and actions | Svelte 5 |
| `@forma-ui/solid` | Signal-oriented bindings | SolidJS 1.x |
| `@forma-ui/lit` | Lit lifecycle bridge and composed events | Lit 3+ / Web Components |
| `@forma-ui/angular` | Signals and lifecycle ownership | Angular 17+ |
| `@forma-ui/tokens` | Semantic and primitive tokens, contrast helpers, DTCG export | Framework-agnostic |
| `@forma-ui/themes` | Optional light, dark and high-contrast theme application | CSS Custom Properties |
| `@forma-ui/tailwind` | Optional Tailwind token bridge | Tailwind CSS v3 JS token mapping / v4 `@theme` layer |
| `@forma-ui/unocss` | Semantic color-token preset | UnoCSS |
| `@forma-ui/a11y-testing` | axe-core integration and ARIA contract assertions | Vitest / browser DOM |
| `@forma-ui/playwright` | Browser-level test helpers and config example | Playwright Test |
| `@forma-ui/codemods` | AST-based migration foundation | Node.js |
| `@forma-ui/cli` | Integration discovery, project scaffolding and diagnostics | Node.js |

The repository also includes `apps/storybook`, an isolated Storybook workshop using Lit 3 and the accessibility addon. Its stories cover core overlays/navigation, form controls, Command Palette, Data Grid, Toast and native progress semantics. It is a development application, not a runtime dependency of the published packages.

All framework-specific packages are optional. Installing `@forma-ui/core` does not install React, Vue, Svelte, Solid, Lit, Angular, Tailwind or UnoCSS.

## Component catalog

### Interaction controllers

- Button semantics helper
- Dialog and AlertDialog
- Menu with checkbox/radio menu items and typeahead
- Tabs with manual/automatic activation and roving focus
- Tooltip with delayed opening and warmup group behavior
- Select with single/multiple selection modes
- Combobox with editable input, active descendant and listbox options
- Accordion
- Disclosure
- Listbox with active-descendant focus and single/multiple selection
- TreeView with visible hierarchy, roving item focus and expansion
- ToggleGroup, Toolbar and NumberField
- SearchField, TextField and PinInput
- Avatar, Meter and RatingGroup
- Checkbox (including indeterminate state)
- Switch
- Radio Group
- Slider (single and multi-thumb value model)
- Pagination
- Toast store with pausable timers

### Semantic helpers

- Progress
- Separator
- Breadcrumb navigation and current-page state
- Form-field IDs, labels, descriptions, errors and control attributes
- Optional form-state engine with async validation, dirty/touched tracking, submit/reset lifecycle and race-safe validators

### Shared DOM primitives

- Focus discovery, radio tab-stop handling and nested FocusTrap stack
- DismissableLayer stack for Escape, outside pointer and outside focus
- `ariaHideOutside` modal isolation with restoration of previous `inert` / `aria-hidden`
- Scroll locking with nested lock reference counting
- Portals that inherit `dir` and `lang`
- Built-in floating-position calculations with flip, shift and RTL alignment
- Optional Floating UI DOM adapter with auto-update, collision handling, matching dimensions and arrow positioning
- Roving tabindex, keyboard direction mapping, Unicode typeahead, keyed collections and selection management
- Small deterministic state-machine actor runtime for pure controller transitions
- Live regions, locale direction helpers and ID factories

Not every framework adapter currently exposes every core controller. The core API is the contract of record; adapter coverage is incremental and documented by actual export in `docs/adapter-coverage.md`.

## Quick start

### Install the core only

```bash
pnpm add @forma-ui/core
```

```ts
import { createCheckboxController } from '@forma-ui/core';

const checkbox = createCheckboxController({
  defaultChecked: 'indeterminate',
  onCheckedChange(next) {
    console.log('checked state:', next);
  },
});

const input = document.querySelector<HTMLInputElement>('#terms')!;
const props = checkbox.getInputProps();
input.checked = props.checked;
input.setAttribute('aria-checked', props['aria-checked']);
if (props.onChange) input.addEventListener('change', props.onChange);
checkbox.syncInput(input); // indeterminate is a DOM property, not an HTML attribute
```

A headless controller provides state and recommended attributes; it does not render a component. The consuming framework owns the markup and event/ref wiring.

### React

```bash
pnpm add @forma-ui/react react react-dom
```

```tsx
import { useSwitch } from '@forma-ui/react';

export function NotificationsSwitch() {
  const toggle = useSwitch({ defaultChecked: true });
  return <button {...toggle.buttonProps}>{toggle.checked ? 'On' : 'Off'}</button>;
}
```

### Vue / Svelte / Preact / Solid / Angular / Lit / Vanilla DOM

Install the relevant adapter and peer framework, then see that adapter's README. `useFormaStore`/`fromFormaStore` in the framework adapters can subscribe to `@forma-ui/forms` or any compatible external store. For production-grade anchored popovers and tooltips, install `@forma-ui/floating-ui` and `@floating-ui/dom`; this integration remains optional. Each adapter keeps its framework-specific lifecycle and reactive semantics outside the core.

## Development requirements

- Node.js `>=22.16.0`
- pnpm `9.15.5` (declared in `packageManager`)
- A package-registry connection for installing workspace dependencies

```bash
pnpm install
pnpm lint
pnpm format:check
pnpm build
pnpm typecheck
pnpm verify:exports
pnpm check:packages
pnpm check:publish
pnpm smoke
pnpm test
pnpm test:a11y
pnpm docs:build
pnpm storybook:build
pnpm test:e2e
```

For a quick static check without a package install, use:

```bash
node --check packages/cli/src/index.mjs
node scripts/check-packages.mjs
node scripts/pack-dry-run.mjs
node scripts/check-workspace-graph.mjs
node scripts/check-archive-manifest.mjs
```

## Architecture and design guarantees

1. Core does not import framework packages or CSS.
2. Optional integration packages declare framework dependencies as peer dependencies.
3. Interactive controllers support controlled and uncontrolled modes where appropriate.
4. Browser APIs are accessed when a controller is mounted or a method is called, not at module import time.
5. DOM listeners, timers, observers, portals and subscriptions expose cleanup paths.
6. Component state and accessibility props are tested independently from styling.
7. No automatic style injection; themes and utility-CSS mappings are explicitly imported.
8. Public ESM entry points and declaration paths are checked from package export maps; any CommonJS condition must be verified from the actual packed artifact before a release.

## Accessibility policy

Use the WAI-ARIA Authoring Practices Guide as the interaction-design reference and WCAG 2.2 as the target standard. `axe-core` and automated assertions catch only a subset of issues. Keyboard testing, zoom/reflow, forced colors, reduced motion, screen-reader testing and manual review remain required. Do not claim WCAG conformance based only on an axe-core report.

## Current limitations

- This is a pre-1.0 development repository. Public API stability is not guaranteed.
- Several new controllers and packages are core-first; adapter parity is intentionally incomplete and accurately tracked in `docs/adapter-coverage.md`.
- The virtualizer is one-dimensional; it is not a drop-in replacement for full grid/masonry virtualization libraries.
- The date package currently handles Gregorian date-only values; it is not a timezone database or multi-calendar engine.
- No `pnpm-lock.yaml` could be generated in the authoring environment because the package manager/registry was unavailable. Generate it with `pnpm install` from a registry-connected environment and commit the resulting lockfile before release.
- The project license has not been selected by the owner. Public publication is blocked until the legal checklist in `docs/legal-release-checklist.md` is completed.
- The advanced controllers are core-first; adapters do not yet wrap every component.
- Storybook is a developer workshop and must be built with its own development dependencies.
- Playwright runs Chromium, Firefox and WebKit desktop projects plus mobile viewport emulation; browser binaries must be installed first.
- Tailwind and UnoCSS integrations are deliberately small token bridges, not full styling systems.
- Codemods are migration infrastructure; transformations need real-world fixture coverage before being treated as production migration guarantees.
- Browser/AT release gates must be executed in CI and on supported assistive technology before shipping.

## Documentation map

- `SPEC.md` — scope, requirements and acceptance criteria
- `ARQUITETURA_COMPLETA.txt` — repository map
- `docs/architecture.md` — layered design
- `docs/adapter-coverage.md` — actual framework export and parity matrix
- `docs/research-landscape.md` — researched ecosystem and adoption rationale
- `docs/component-catalog.md` — component behavior contracts and usage boundaries
- `docs/performance-and-memory.md` — lifecycle, performance and memory policy
- `docs/design-tokens.md` — token layers and DTCG exports
- `docs/testing-strategy.md` — unit, a11y, integration and browser test policy
- `docs/validation-report.md` — checks already executed, limitations and remaining release gates
- `docs/accessibility-wcag.md` — accessibility implementation contract
- `docs/ecosystem-and-integrations.md` — framework, styling and tooling strategy
- `docs/release-and-security.md` — SemVer, provenance and supply-chain controls
- `docs/research-repository-survey.md` — research survey of public repositories, tooling and licensing boundaries
- `docs/legal-release-checklist.md` — mandatory license/legal release blocker
- `docs/research-repository-survey.md` — curated survey of upstream projects, technical references and adoption decisions
- `docs/archive-layout.md` / `docs/archive-manifest.json` — ZIP policy and per-file SHA-256 audit
- `docs/roadmap.md` — milestones and completion gates
- `docs/ssr-and-framework-recipes.md` — SSR, hydration, framework lifecycle and integration recipes
- `apps/storybook/` — isolated stories, Lit-based previews and the Storybook accessibility addon
- `docs/ecosystem-and-integrations.md` — integrations and boundaries of optional technologies
- `docs/decisions/` — Architecture Decision Records

## Contributing

See `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and `SECURITY.md` before opening a pull request or reporting a vulnerability.


## Large-scale benchmark fixtures

The repository includes 490,000 deterministic synthetic records for Data Grid, Command Palette and variable-height virtualization. They are useful for streaming, memory, search and large-list scenarios without using real or personal data. See [`fixtures/benchmarks/README.md`](fixtures/benchmarks/README.md) and [`docs/benchmark-fixtures.md`](docs/benchmark-fixtures.md).

```bash
pnpm fixtures:verify
pnpm bench:fixtures
pnpm fixtures:generate
```

The source ZIP is intentionally larger than 100 MB because it includes these real benchmark assets; the archive builder enforces that threshold and records SHA-256 hashes for every included file. See [`docs/archive-layout.md`](docs/archive-layout.md).


See [`docs/release-archive-audit.md`](docs/release-archive-audit.md) for the >100 MB archive requirement, benchmark corpus inventory, hashes and reproducible verification steps.

## Mesclagem de fontes ZIP + RAR

O conteúdo ativo do ZIP-base foi combinado com o snapshot recebido em `17-01-design-system(1).rar`. Os arquivos do RAR foram preservados sem sobrescrever APIs divergentes; o guia exclusivo `Dependências.md` foi atualizado e integrado à raiz. O RAR original e seus 117 arquivos extraídos permanecem em `archive-imports/` para proveniência e comparação.

- Relatório: [`docs/source-merge-report.md`](docs/source-merge-report.md)
- Avaliação de APIs: [`docs/legacy-api-assessment.md`](docs/legacy-api-assessment.md)
- Manifesto/hashes: [`docs/source-merge-manifest.json`](docs/source-merge-manifest.json)
- Auditoria: `pnpm check:source-merge`

O snapshot legado não é incluído no workspace pnpm nem nos pacotes publicados.
