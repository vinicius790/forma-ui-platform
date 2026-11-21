import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = 'packages';
const rows = [];
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const directory = join(root, entry.name, 'dist');
  try { await stat(directory); } catch { continue; }
  const files = [];
  async function walk(folder) {
    for (const item of await readdir(folder, { withFileTypes: true })) {
      const path = join(folder, item.name);
      if (item.isDirectory()) await walk(path);
      else if (/\.(?:js|cjs)$/u.test(item.name)) files.push(path);
    }
  }
  await walk(directory);
  const input = await Promise.all(files.map((path) => readFile(path)));
  const bytes = Buffer.concat(input);
  rows.push({ package: `@forma-ui/${entry.name}`, files: files.length, rawBytes: bytes.length, gzipBytes: gzipSync(bytes, { level: 9 }).length });
}
if (!rows.length) {
  process.stderr.write('Nenhum dist/ encontrado. Execute pnpm build antes de gerar o relatório.\n');
  process.exitCode = 1;
} else {
  rows.sort((a, b) => b.gzipBytes - a.gzipBytes);
  process.stdout.write(`${'PACKAGE'.padEnd(30)} ${'FILES'.padStart(6)} ${'RAW KB'.padStart(9)} ${'GZIP KB'.padStart(9)}\n`);
  for (const row of rows) process.stdout.write(`${row.package.padEnd(30)} ${String(row.files).padStart(6)} ${(row.rawBytes / 1024).toFixed(1).padStart(9)} ${(row.gzipBytes / 1024).toFixed(1).padStart(9)}\n`);
  if (process.argv.includes('--json')) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
}
