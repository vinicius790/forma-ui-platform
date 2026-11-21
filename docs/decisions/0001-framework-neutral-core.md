# ADR 0001: Framework-neutral core

- Status: Accepted
- Date: 2026-11-17

## Context

The project must share interaction behavior across multiple rendering frameworks without importing their runtimes into its central package.

## Decision

Keep state machines and DOM primitives in `@forma-ui/core`. Framework adapters are optional packages that consume core exports and own reactive bindings/lifecycles.

## Consequences

- Core remains small relative to the overall monorepo and framework-independent.
- Adapters may lag core functionality, but must not fork interaction algorithms.
- Framework dependencies remain peer dependencies.
