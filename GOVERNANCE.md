# Governance

Forma UI is currently maintainer-led and pre-1.0. Maintainers are responsible for releases, security response, API direction and final merge decisions.

## Decision process

- Small implementation details may be decided in pull-request review.
- Public API changes, new runtime dependencies, framework support changes and accessibility-pattern deviations require an issue or design discussion before merge.
- Architecture changes that affect package boundaries should include an ADR.
- Breaking changes must include a Changesets entry and migration guidance.

## Release authority

Only maintainers may publish packages. Release workflows must run from protected branches and pass the release gates in `SPEC.md`.

## Future community governance

Before 1.0, maintainers will publish a maintainer membership process, support policy and escalation path. Until then, contributors should treat published decisions as provisional and subject to review.
