import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const roots = ['packages', 'apps'];
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'coverage', '.git', '.vite', 'test-results', 'playwright-report'].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) { await walk(path); continue; }
    if (!/(?:\.test\.(?:ts|tsx|mjs|js)|\.spec\.(?:ts|tsx|mjs|js)|\.stories\.(?:ts|tsx))$/u.test(entry.name)) continue;
    const content = await readFile(path);
    const text = content.toString('utf8');
    files.push({
      path: relative(process.cwd(), path).split('\\').join('/'),
      bytes: content.byteLength,
      lines: text.split(/\r?\n/u).length,
      sha256: createHash('sha256').update(content).digest('hex'),
      kind: entry.name.includes('.stories.') ? 'story' : entry.name.includes('.spec.') ? 'spec' : 'test',
    });
  }
}
for (const root of roots) await walk(resolve(root));
files.sort((a, b) => a.path.localeCompare(b.path));
const grouped = {};
for (const file of files) {
  const key = file.path.split('/').slice(0, 2).join('/');
  (grouped[key] ??= []).push(file.path);
}
const inventory = {
  schemaVersion: 1,
  generatedBy: 'scripts/generate-test-inventory.mjs',
  scope: 'tracked-source-tests-and-stories-only',
  note: 'Hashes identify the current source snapshots; they are not test results or coverage percentages.',
  summary: {
    files: files.length,
    tests: files.filter((file) => file.kind === 'test').length,
    specs: files.filter((file) => file.kind === 'spec').length,
    stories: files.filter((file) => file.kind === 'story').length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    totalLines: files.reduce((sum, file) => sum + file.lines, 0),
  },
  groups: Object.fromEntries(Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([key, paths]) => [key, { files: paths.length, paths }])),
  files,
};
await writeFile('docs/test-inventory.json', `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
process.stdout.write(`Inventário de testes e histórias gerado: ${inventory.summary.tests} testes, ${inventory.summary.specs} specs e ${inventory.summary.stories} stories.\n`);
