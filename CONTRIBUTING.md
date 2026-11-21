# Contributing to Forma UI

Thank you for considering a contribution. This project prioritizes behavioral correctness, accessible interaction and long-term API quality over raw component count.

## Before opening an issue

- Search existing issues and discussions.
- For bugs, provide the package/version, framework/version, browser/OS, a minimal reproduction, expected behavior and actual behavior.
- For accessibility issues, include the interaction path, keyboard/screen-reader setup and observed announcement or focus behavior where possible.

## Development workflow

1. Use the Node.js and pnpm versions in `.nvmrc` and `packageManager`.
2. Install dependencies with `pnpm install`.
3. Create a branch from `main`.
4. Add or update tests for every behavior change.
5. Add a Changesets file for any public package API change.
6. Update component docs and keyboard matrices where appropriate.
7. Run lint, formatting, typecheck, build, export checks, tests and browser suites available locally.

## Component contribution checklist

- [ ] Prefer native HTML where appropriate.
- [ ] Document controlled and uncontrolled state behavior.
- [ ] Document role, name, state and relationships.
- [ ] Implement expected keyboard interaction and RTL behavior.
- [ ] Verify disabled, read-only and invalid states.
- [ ] Define cleanup for every listener, timer, observer, portal or subscription.
- [ ] Add transition and boundary tests.
- [ ] Add property tests for numerical/range algorithms.
- [ ] Add axe-core and real-browser tests where relevant.
- [ ] Add adapter updates or clearly document the parity gap.
- [ ] Add or update keyboard matrix and API docs.

## Code standards

- TypeScript strict mode; avoid `any`.
- No framework imports in core.
- No CSS injection from core.
- No browser global access at module evaluation time.
- Public APIs need meaningful types and JSDoc.
- Cleanup functions should be idempotent.
- Do not swallow errors silently.
- Keep runtime dependencies minimal and explain each new dependency.

## Pull requests

Use a narrow, descriptive title. Explain the problem, API impact, test evidence and migration requirements. A maintainer may ask for separate behavioral and styling changes to keep review focused.
