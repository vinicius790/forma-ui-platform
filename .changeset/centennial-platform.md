---
"@forma-ui/core": major
"@forma-ui/ai-ui": major
"@forma-ui/crdt": major
"@forma-ui/qwik": major
"@forma-ui/devtools": major
"@forma-ui/react": major
"@forma-ui/vue": major
"@forma-ui/svelte": major
"@forma-ui/preact": major
"@forma-ui/solid": major
"@forma-ui/lit": major
"@forma-ui/angular": major
"@forma-ui/cli": major
"@forma-ui/eslint-plugin": major
---

Release Forma UI 100.0.0 across 31 packages and 2 workshop apps:
- Add 2 new official packages: `@forma-ui/ai-ui` (StreamingMessage, ToolApproval, Citation) and `@forma-ui/crdt` (LwwRegister, LwwMap, PresenceController).
- Add 8 centennial controllers (`Dock`, `Timeline`, `DiffViewer`, `Mention`, `SpatialCanvas`, `AudioPlayer`, `CodeGutter`, `WizardDialog`) and 4 frontier primitives (`spatial-nav`, `scheduler`, `web-share`, `state-sync`) in `@forma-ui/core` (97 runtime modules, zero framework/CSS deps).
- Add `v100-bindings.ts` parity across all 8 framework adapters (React, Vue, Svelte, Preact, Solid, Lit, Angular, Qwik).
- Sync all 34 workspace `package.json` manifests, CLI (64 controllers), and ESLint plugin to `100.0.0`.
