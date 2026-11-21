# Forma UI — Scripts de Engenharia e Auditoria (`scripts/`)

Utilitários Node.js e Python organizados por responsabilidade operacional:

## 1. Verificação de Arquitetura e Fonte (`pnpm validate:source`)
- `check-structure.mjs` — Verifica presença e integridade de pacotes, apps, JSON, YAML e caminhos críticos.
- `check-packages.mjs` — Valida `package.json`, `exports`, `bin`, `files`, SemVer e scripts dos 31 pacotes.
- `check-workspace-graph.mjs` — Garante ausência de ciclos de runtime e pureza do `@forma-ui/core`.
- `check-architecture.mjs` — Garante zero imports de frameworks ou CSS dentro de `packages/core/src`.
- `check-docs.mjs` — Audita todos os links locais relativos entre arquivos Markdown.
- `check-source-hygiene.mjs` — Verifica ausência de segredos, symlinks ou arquivos vazios.
- `check-legal-release.mjs` — Valida licença `MIT` na raiz e identificadores SPDX em todos os pacotes.
- `check-archive-manifest.mjs` & `check-source-merge.mjs` — Conferem hashes SHA-256 em streaming e integridade do snapshot histórico `archive-imports/`.

## 2. Verificação de Runtime em Node 24 (`pnpm verify:runtime`)
- `verify-core-and-domains.mjs` — Executa diretamente os módulos TypeScript de overlays, inputs, forms, data-grid, commands, dates, virtualization, collections, tokens, themes, tailwind, motion e ssr.
- `verify-enterprise-and-platform.mjs` — Executa TreeGrid, Menubar, Feed, Kanban, CommandBar, OtpInput, SignaturePad, QrCode, BottomSheet, NotificationCenter, Qwik, DevTools e extensões de domínio/plataforma.
- `verify-workbench-ai-and-crdt.mjs` — Executa Dock, Timeline, DiffViewer, Mention, SpatialCanvas, AudioPlayer, CodeGutter, WizardDialog, CalendarScheduler, Gantt CPM, SpreadsheetFormula, AI-UI e CRDT.

## 3. Geradores de Inventário, Benchmarks e Empacotamento
- `generate-benchmark-fixtures.mjs` / `verify-benchmark-fixtures.mjs` / `benchmark-fixtures.mjs` — Geração, auditoria SHA-256 e benchmark de streaming dos 18 shards JSONL (> 1 GB).
- `generate-architecture-map.mjs` / `generate-inventory.mjs` / `generate-test-inventory.mjs` / `generate-archive-manifest.mjs` / `generate-source-merge-manifest.mjs`.
- `verify-exports.mjs` / `finalize-declarations.mjs` / `pack-dry-run.mjs` / `check-publish.mjs` / `release-check.mjs` / `bundle-report.mjs` / `clean.mjs` / `create-source-archive.py`.
