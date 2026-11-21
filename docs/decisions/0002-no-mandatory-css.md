# ADR 0002: No mandatory component CSS

- Status: Accepted
- Date: 2026-11-17

## Context

The differentiator is headless behavior plus accessibility, not another pre-styled utility kit.

## Decision

Core and framework adapters ship no automatically applied component CSS. Tokens, themes, Tailwind and UnoCSS bridges are optional explicit imports.

## Consequences

- Consumers own markup, layout, typography and theme decisions.
- Visual examples live in the documentation app and are not part of runtime defaults.
- Optional styling packages cannot become dependencies of core.
