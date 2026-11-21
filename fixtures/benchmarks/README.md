# Forma UI — Large-scale benchmark fixtures

This directory contains deterministic, synthetic and privacy-safe datasets for exercising the data-heavy parts of Forma UI. The fixtures are deliberately line-oriented JSON (JSONL), so Node.js, browsers and data-processing tools can consume records incrementally instead of loading the complete dataset into memory.

## Contents

| Dataset | Records | Main target |
|---|---:|---|
| `data-grid/records-part-1.jsonl` + `records-part-2.jsonl` | 240,000 total | Sorting, filtering, selection, pagination, grouping, column accessors and row virtualization |
| `command-palette/commands-150k.jsonl` | 150,000 | Fuzzy search, ranking, keyboard navigation, disabled results and result-windowing |
| `virtualization/variable-height-rows-100k.jsonl` | 100,000 | Variable row heights, measurement correction, overscan and scroll-window calculations |

All records are invented. Email-like values use the reserved `.test` domain and are not real addresses. There are no real users, organizations, tokens, credentials or production data in these datasets.

## Reproduce

```bash
node scripts/generate-benchmark-fixtures.mjs
node scripts/verify-benchmark-fixtures.mjs
node scripts/benchmark-fixtures.mjs
```

The generator is deterministic: the same generator version produces the same record sequence and SHA-256 digests. The per-dataset hashes, byte counts and record counts are stored in `manifest.json`.

## Audit policy

- Every dataset is UTF-8 JSONL with one JSON object per line.
- Each dataset has a JSON Schema under `schemas/`.
- `manifest.json` records its exact byte count, record count and SHA-256 digest.
- `scripts/verify-benchmark-fixtures.mjs` streams the files, parses every record and recomputes hashes without reading the full corpus into memory.
- Benchmark JSONL files are stored without recompression in the release ZIP. This makes the archive larger, but avoids spending CPU recompressing ready-to-stream data and keeps the fixture files directly usable after extraction.
- Each file remains below 100 MB so it can be versioned as an ordinary Git blob if a future release chooses to commit these generated fixtures.

## Performance interpretation

`benchmark-fixtures.mjs` measures local sequential parsing throughput. It is a reproducible smoke benchmark, not a statistically rigorous browser benchmark and not a substitute for measuring the UI in Chromium, Firefox and WebKit. Record Node version, OS, hardware, power state and concurrent load when comparing runs.
