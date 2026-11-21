import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const manifest = JSON.parse(await (await import('node:fs/promises')).readFile('fixtures/benchmarks/manifest.json', 'utf8'));
const results = [];
for (const dataset of manifest.generatedDatasets) {
  const start = performance.now();
  let records = 0;
  let parsedBytes = 0;
  let disabled = 0;
  let expanded = 0;
  const input = createReadStream(resolve('fixtures/benchmarks', dataset.path));
  const lines = createInterface({ input, crlfDelay: Infinity });
  for await (const line of lines) {
    const row = JSON.parse(line);
    records += 1;
    parsedBytes += Buffer.byteLength(line) + 1;
    if (row.enabled === false) disabled += 1;
    if (row.expanded === true) expanded += 1;
  }
  const elapsedMs = performance.now() - start;
  results.push({
    dataset: dataset.path,
    records,
    bytes: parsedBytes,
    elapsedMs: Number(elapsedMs.toFixed(2)),
    recordsPerSecond: Math.round(records / (elapsedMs / 1000)),
    disabled,
    expanded,
  });
}
process.stdout.write(`${JSON.stringify({ runtime: process.version, platform: process.platform, results }, null, 2)}\n`);
