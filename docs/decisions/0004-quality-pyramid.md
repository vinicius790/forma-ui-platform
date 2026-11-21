# ADR 0004: Layered quality pyramid

- Status: Accepted
- Date: 2026-11-17

## Context

JSDOM tests alone cannot verify browser layout, native focus, real pointer behavior or cross-engine differences; axe alone cannot prove WCAG conformance.

## Decision

Use controller unit tests, property-based invariants, framework adapter tests, axe-core scans, Playwright browser tests and manual assistive-technology checks as separate evidence layers.

## Consequences

- Some checks need browser binaries and cannot run in every local environment.
- Release pipelines must retain evidence for each layer.
- Automated checks must not be presented as complete accessibility certification.
