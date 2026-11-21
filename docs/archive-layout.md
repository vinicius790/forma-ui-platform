# Layout and integrity of the >100 MB source archive

The distributable project archive includes the source monorepo plus a deterministic benchmark corpus for data-heavy components. The benchmark corpus is first-class project test data, not padding.

## Size requirement

The archive builder enforces a hard minimum of **100,000,000 bytes**. It fails rather than producing an archive below the required threshold. The current benchmark corpus contains 490,000 synthetic records across four JSONL files, totaling 264,512,235 bytes before ZIP metadata. Each individual JSONL file is smaller than 100,000,000 bytes.

## ZIP compression policy

- Source code, Markdown, JSON manifests and configuration use DEFLATE.
- `fixtures/benchmarks/**/*.jsonl` uses ZIP STORE (no recompression). These files are intentionally stored uncompressed so their extracted bytes can be streamed without a decompression step. JSONL text would compress substantially; storing it uncompressed is a deliberate release-size policy to satisfy the requested archive threshold, not a claim that DEFLATE is ineffective.
- No `node_modules`, browser binaries, pnpm store, copied third-party repositories, caches, random padding or repeated payloads are included.

## Integrity model

1. `fixtures/benchmarks/manifest.json` contains record counts, byte lengths and SHA-256 hashes for each JSONL dataset.
2. `scripts/verify-benchmark-fixtures.mjs` streams and parses every JSONL line and recalculates every dataset hash.
3. `docs/archive-manifest.json` contains an independent SHA-256 entry for every source, documentation and benchmark file except itself.
4. `scripts/check-archive-manifest.mjs` verifies all files, all listed directories, hashes and byte counts.
5. `scripts/create-source-archive.py` streams files into the ZIP, validates hashes during copy, verifies CRCs, exact member set, JSONL STORE compression and the 100 MB minimum.
6. The `.sha256` sidecar contains the checksum of the final ZIP, including the embedded archive manifest.

The embedded manifest is intentionally excluded from its own per-file list to avoid a self-referential digest. It is covered by the final archive SHA-256 sidecar.

## Mesclagem auditável de fonte ZIP + RAR

- O ZIP-base fornece a árvore ativa do projeto.
- O RAR recebido é preservado como artefato original e snapshot extraído em `archive-imports/`; arquivos de referência não são carregados pelo workspace pnpm.
- `docs/source-merge-manifest.json` registra SHA-256 e bytes dos 117 arquivos legados, metadados do ZIP-base e os 116 conflitos de caminho.
- `scripts/check-source-merge.mjs` confere o hash do RAR original, cada arquivo extraído, as relações entre fontes e a cópia operacional integrada de `Dependências.md`.
- O RAR é mantido com ZIP STORE para não recomprimir um arquivo já compactado.
