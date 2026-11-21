# Frameworks, tooling and integration contracts

## Framework adapters

| Target | Package | Strategy | CSS imposed? |
|---|---|---|---|
| React 18+ / 19+ | `@forma-ui/react` | hooks, refs and React external-store patterns | No |
| Vue 3 | `@forma-ui/vue` | composables, refs and lifecycle cleanup | No |
| Svelte 5 | `@forma-ui/svelte` | stores and actions | No |
| Solid 1.x | `@forma-ui/solid` | signals and owner cleanup | No |
| Lit 3+ / Web Components | `@forma-ui/lit` | ReactiveController bridge and composed events | No |
| Angular 17+ | `@forma-ui/angular` | signals and DestroyRef cleanup | No |
| Vanilla DOM | `@forma-ui/core` | framework-free controllers and primitives | No |

The core package must never import a framework. Each adapter is an optional peer-dependent package. Framework-specific component syntax belongs to the adapter; accessibility state machines remain in core.

## CSS ecosystem

- `@forma-ui/tokens` is the source of semantic token values.
- `@forma-ui/themes` emits optional CSS themes.
- `@forma-ui/tailwind` exposes a Tailwind CSS v4 `@theme` layer and a serializable JavaScript mapping for Tailwind CSS v3.
- `@forma-ui/unocss` provides a small prefixed semantic-token preset.

No reset, font, animation, color, or layout style is automatically injected by the headless packages. Consumers opt into each CSS integration.

## Testing strategy

1. Pure controller tests cover transitions and boundaries.
2. Framework tests cover adapter reactivity and cleanup.
3. axe-core tests catch a subset of detectable accessibility issues.
4. Playwright browser tests cover focus order, keyboard behavior, pointer interactions, viewport geometry and screenshots.
5. Manual assistive-technology checks remain necessary before claiming WCAG conformance.

## Supply-chain strategy

Use exact lockfile installs, least-privilege CI permissions, dependency update automation, CodeQL, `npm audit`/OSV scanning and npm trusted publishing where the registry and repository are configured for OIDC. Provenance improves traceability; it is not proof that code is vulnerability-free.


## Anchored overlay geometry

`@forma-ui/floating-ui` is an optional bridge to `@floating-ui/dom`. It provides collision-aware placement (`flip`/`shift`), reference-width matching, height constraints, arrow coordinates and automatic updates while an overlay is mounted. Keep the core `positioner` as a small dependency-free option; choose the Floating UI bridge when an application needs clipping/scroll-container behavior or more sophisticated floating geometry. Only create the auto-update connection while the overlay is visible and always call its cleanup on close/unmount.


## Form-state integration

`@forma-ui/forms` adds an optional typed state engine for top-level fields. It tracks values, errors, dirty/touched state, validation and submission lifecycle while reusing `@forma-ui/core` field-ID/ARIA helpers. It is deliberately schema-library neutral: adapt Zod, Valibot, Yup or server-side validation by mapping their results into a `FormErrors` object. React `useFormaStore`, Vue `useFormaStore`, Svelte `fromFormaStore`, Solid `fromFormaStore`, Lit's reactive controller bridge and Angular `fromFormaStore` can subscribe to the same immutable snapshot contract.


## Storybook and visual development

`apps/storybook` uses Storybook 10 with the Web Components + Vite framework, Lit 3 stories and the official accessibility addon. Stories are intended to expose interaction states and keyboard flows in isolation. The addon is a feedback loop, not a conformance certificate; browser E2E, zoom/reflow checks and assistive-technology review remain separate gates. Storybook is installed only in the development app and is never imported by `@forma-ui/core` or framework adapters.
