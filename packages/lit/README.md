# @forma-ui/lit

Lit integration for Forma UI. `FormaControllerBridge` turns controller-store subscriptions into `requestUpdate()` calls and disconnects subscriptions when the host leaves the document. Events dispatched with `dispatchFormaChange` bubble and cross shadow boundaries.

The package is intentionally a bridge rather than a pre-styled component catalog: custom elements can consume the same core state machines while defining their own templates and shadow parts.
