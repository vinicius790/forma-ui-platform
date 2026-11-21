# Testing and quality gates

## Required gates

- `pnpm lint` and `pnpm format:check`
- `pnpm typecheck` and `pnpm build`
- `pnpm verify:exports` and `pnpm smoke`
- `pnpm test:coverage` to generate the V8 coverage report; define and enforce numeric thresholds after a stable baseline exists
- `pnpm test:a11y` using axe-core against rendered DOM
- `pnpm test:e2e` in Chromium, Firefox and WebKit in CI
- `pnpm check:publish` to pack each workspace package and run publint plus Are The Types Wrong against the generated tarballs

## Coverage policy

Target 90% statements/lines and 85% branches at workspace level, with higher thresholds for core state machines. A coverage threshold is a quality signal, not a guarantee of correctness. Exclude generated files and build scripts only with a documented reason.

## Browser matrix

Exercise current stable Chromium, Firefox and WebKit on pull requests, with a smaller smoke matrix on release branches. Pin browser install revisions through the committed package-manager lockfile once generated in a registry-connected environment. Add reduced-motion and forced-colors checks as separate projects when the component demos expose stable fixtures for those states.

## Accessibility acceptance

Test semantic roles and accessible names, keyboard-only operation, focus restoration, zoom/reflow, text contrast, reduced motion, live-region announcements and forced-colors behavior. Verify with at least one screen reader on each supported operating system before making public conformance claims.


## Story-driven and cross-browser validation

- Storybook stories make component states independently inspectable and allow the a11y addon to surface common violations during development.
- Playwright is configured for Chromium, Firefox and WebKit, with desktop and mobile viewport projects.
- Browser specs cover the application shell, modal dialog focus/escape behavior, tab keyboard navigation, switch state semantics, and locale-driven RTL direction.
- A Storybook or axe report is not proof of WCAG conformance; manual screen-reader and keyboard review remains required.
