# Forma UI — Product and technical specification

**Version:** 100.0.0 · **Status:** 100.0.0 centennial platform / source- & Node-24-runtime-validated

## 1. Product definition

Forma UI is a framework-agnostic headless UI behavior platform. It provides interaction state machines, accessible prop contracts, reusable DOM primitives, optional framework adapters, design tokens, optional theme bridges, development tools and test utilities. It is not a CSS component kit and does not attempt to replace application-specific markup.

## 2. Problem statement

Teams frequently reimplement the same difficult interaction details across multiple applications: keyboard navigation, focus trapping/restoration, typeahead, nested overlays, RTL direction, modal isolation, live announcements, controlled-state synchronization and lifecycle cleanup. Reimplementations drift, become coupled to individual frameworks and are difficult to audit consistently.

Forma UI centralizes those behavior contracts and exposes them through small optional packages.

## 3. Goals

- Provide framework-neutral behavioral primitives with typed APIs.
- Support accessible keyboard and pointer interaction patterns.
- Keep styles and markup under consumer control.
- Offer adapters for React, Vue, Svelte, Solid, Lit/Web Components and Angular.
- Provide optional token and utility-CSS integrations.
- Support modern ESM consumers, CommonJS where feasible, and TypeScript declarations.
- Make accessibility, tests, migration and releases part of the engineering workflow.

## 4. Non-goals

- Shipping a mandatory visual design system.
- Guaranteeing conformance through automated scanning alone.
- Providing every framework-specific wrapper before its core behavior is stable.
- Replacing native HTML elements when native semantics already solve the problem.
- Depending on a single CSS framework or bundler in the core package.
- Publishing unstable experimental components as stable 1.x APIs.

## 5. Core component contracts

Every interactive controller should document: state model; controlled/uncontrolled semantics; default behavior; disabled/read-only behavior; callback timing; keyboard support; ARIA roles/states; focus behavior; DOM attachment requirements; cleanup; SSR constraints; and test coverage.

### Component inventory

| Component | Contract summary | Principal interaction |
|---|---|---|
| Button | Native button attributes + loading state | Native Enter/Space activation |
| Dialog / AlertDialog | Modal/non-modal dialog state, focus trap, isolation, scroll lock | Escape, outside policy, focus restoration |
| Menu | Menu item roles, checkbox/radio variants, typeahead | Arrow keys, Home/End, Enter/Space, Escape |
| Tabs | Manual/automatic activation, orientation, RTL | Roving tabindex and arrows |
| Tooltip | Non-interactive description with delay group | Hover/focus, Escape |
| Select | Select-only or multi-select listbox model | Arrow keys, typeahead, selection |
| Combobox | Editable text input and listbox | Text input, arrows, Enter, Escape |
| Accordion | Single/multiple and collapsible policy | Enter/Space, heading navigation |
| Disclosure | Expand/collapse state | Enter/Space on trigger |
| Checkbox | Boolean/indeterminate state | Native checkbox behavior |
| Switch | Toggle state with switch role | Native button activation |
| Radio Group | Single selection and roving focus | Arrow keys, Home/End |
| Slider | Single/multi-thumb value model and step constraints | Arrow, PageUp/Down, Home/End |
| Pagination | Bounded page state and compact page sequence | Previous/next/page actions |
| Toast | Notification records and pausable lifetime | Dismiss/action, pause/resume |
| Progress | Determinate and indeterminate progress semantics | Non-interactive status |
| Separator | Decorative or semantic divider | Non-interactive |
| Breadcrumb | Navigation landmark and current-page semantics | Native links |
| Form field helpers | Stable IDs and label/description/error relationships | Native form controls |

## 6. Platform requirements

- TypeScript strict mode with no implicit any.
- Browser APIs must be guarded and deferred to runtime methods.
- No core runtime dependency on React, Vue, Svelte, Solid, Lit, Angular or CSS tooling.
- Cleanup functions must be idempotent.
- Global listeners and timers must have explicit teardown.
- Controlled state must not silently mutate internal state.
- DOM IDs must be safe and stable within the lifetime of their owning component.
- Public exports must be tree-shakeable and accurately declared.

## 7. Accessibility requirements

- Follow WAI-ARIA APG patterns where a custom widget is necessary.
- Prefer native HTML semantics.
- Every control must have an accessible name and correctly exposed state.
- Keyboard support must match its interaction pattern, including RTL mirroring where directional behavior applies.
- Focus trapping and restoration must work with nested layers.
- Modal isolation must restore pre-existing `inert` and `aria-hidden` values.
- Live announcements must avoid redundant or excessively frequent speech.
- Motion must respect `prefers-reduced-motion` in any optional animated layer.
- High-contrast/forced-colors support must not rely only on color.

## 8. Quality requirements

- Unit tests for transitions and boundary conditions.
- Property-based tests for numerical/range invariants.
- Component tests for framework adapter behavior.
- axe-core scans for detectable DOM violations.
- Playwright tests for real focus, keyboard, pointer, layout and cross-browser behavior.
- Package export, declaration and tarball validation.
- SemVer changesets and release provenance where supported.

## 9. Acceptance criteria for 1.0

1. Core controller APIs documented and frozen.
2. All core components have APG-informed keyboard and screen-reader review.
3. React, Vue, Svelte, Solid, Lit and Angular adapters have parity for the agreed stable component subset or a clearly documented reason for omission.
4. Browser matrix passes in Chromium, Firefox and WebKit.
5. Accessibility acceptance includes manual assistive-technology evidence.
6. All published packages pass `publint` and Are the Types Wrong.
7. Migration tests cover each codemod against old/new fixture pairs.
8. npm publishing is configured through trusted publishing and protected branch rules.
9. A reproducible lockfile and release artifacts are committed/generated by CI.
10. Security policy, governance and support policy are published.
