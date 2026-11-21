# ADR 0003: Native HTML first

- Status: Accepted
- Date: 2026-11-17

## Context

Custom ARIA widgets add behavioral and testing complexity. Native controls often provide more robust keyboard, form and platform integration.

## Decision

Use native HTML semantics wherever possible. Add custom roles and state machines only where the interaction pattern requires them.

## Consequences

- Checkbox, button and switch examples retain native activation semantics.
- Custom listbox/menu/radio patterns require explicit keyboard, focus and accessible-name tests.
- Styling integrations may decorate but must not replace native semantics.
