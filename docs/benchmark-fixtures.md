# Large-scale fixture and benchmark policy

Forma UI includes a generated large-data corpus so maintainers can test data-heavy primitives against realistic volume rather than tiny hand-written arrays.

## Dataset sizes

The fixture corpus contains 490,000 synthetic records across two Data Grid shards, Command Palette and variable-height virtualization datasets. All datasets are JSONL and are consumed as streams by the verification and smoke-benchmark scripts.

## Reproduction and verification

- Generate: `pnpm fixtures:generate`
- Verify all records and digests: `pnpm fixtures:verify`
- Measure local parsing throughput: `pnpm bench:fixtures`

The fixture manifest is `fixtures/benchmarks/manifest.json`. Each entry records its relative path, record count, exact byte size, format and SHA-256 hash. The repository-level archive manifest independently hashes every included fixture file.

## Why the release ZIP can exceed 100 MB

The release archive intentionally includes the benchmark corpus as first-class project test assets. JSONL fixture members use ZIP `STORE` rather than `DEFLATE`: they are already structured line data, are intended for direct streaming after extraction, and should not consume CPU being recompressed just to reduce download size. Source code and documentation remain compressed. No `node_modules`, browser binaries, package-manager caches, copied third-party repositories, random padding or repeated files are included.

## Privacy and safety

All data is synthetic and generated from a deterministic integer sequence. Email-shaped values use `example.test`, a reserved testing domain. The generator includes no external service calls and no access to user data.

## Limits

The local parsing script measures throughput of JSONL decoding only. It does not claim to measure browser rendering, assistive technology, sorting algorithm complexity or production performance. Those require separate Playwright/browser and manual evaluation.
