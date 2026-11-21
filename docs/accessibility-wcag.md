# Accessibility and WCAG implementation contract

Forma UI uses the WAI-ARIA Authoring Practices Guide (APG) to shape custom-widget interaction models and WCAG 2.2 as the target accessibility standard. Native HTML is preferred whenever it already satisfies the interaction need.

## Required review areas

- Semantics: correct native elements, role, accessible name, value, state and relationship attributes.
- Keyboard: expected activation keys, arrow navigation, Home/End, Escape, typeahead and focus order for each pattern.
- Focus: initial focus, containment, roving tabindex, restoration and nested overlay behavior.
- Modal isolation: the top modal remains available while outside content becomes inert/hidden; original attributes/properties are restored.
- Forms: label, description, invalid, required, disabled and name/value relationships.
- Content adaptation: zoom, reflow, text spacing and long translated labels.
- Visual adaptation: contrast, non-color cues, focus visibility, forced-colors and reduced motion.
- Announcements: live-region politeness, atomicity, timing and duplicate announcement prevention.
- Directionality: logical properties and mirrored horizontal keyboard interactions where APG expects it.

## Automation is necessary but insufficient

axe-core is a useful automated detector but does not prove all WCAG success criteria. It cannot reliably infer user intent, interaction quality or all screen-reader output. A release must combine unit tests, rendered DOM scans, browser-based keyboard tests and manual assistive-technology review.

## Pattern-specific contracts

Each component README/API entry must include its APG pattern reference, role mapping, keyboard table, controlled state behavior, disabled behavior, focus management and known deviations. If a component is not a direct APG pattern, document why and prefer a native HTML element.

## Conformance language

Do not describe this library or an application using it as “WCAG 2.2 compliant” based solely on passing automated scans. Use evidence-based statements such as “automated axe-core checks reported no violations in the tested fixtures,” with test versions and coverage stated.
