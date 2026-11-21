# Agent guidance

- Read `SPEC.md`, `README.md`, `docs/architecture.md` and `docs/accessibility-wcag.md` before changing APIs.
- Preserve the framework-neutral core and headless/no-mandatory-CSS principles.
- Do not claim accessibility conformance from automated tests alone.
- For every new controller, add transition, boundary, keyboard/ARIA and cleanup tests as applicable.
- Add a Changesets entry for public API changes.
- Never report build/test success unless the command actually completed successfully.

- Treat `archive-imports/17-01-design-system` as an immutable historical snapshot, not an active workspace. Never copy its divergent files over active packages without an ADR, adapter migration, tests, and a Changeset. Run `pnpm check:source-merge` after intentional updates to the import manifest.
