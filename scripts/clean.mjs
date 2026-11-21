import { readdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = process.cwd();
const generatedDirectories = new Set([
  'dist',
  'dist-cjs',
  'coverage',
  '.turbo',
  '.vite',
  'storybook-static',
  'playwright-report',
  'test-results',
]);
const removed = [];

async function clean(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const absolute = join(directory, entry.name);
    if (generatedDirectories.has(entry.name)) {
      await rm(absolute, { recursive: true, force: true });
      removed.push(absolute);
      continue;
    }
    await clean(absolute);
  }
}

for (const rootDirectory of ['packages', 'apps']) {
  await clean(resolve(root, rootDirectory));
}
for (const directory of generatedDirectories) {
  const absolute = resolve(root, directory);
  await rm(absolute, { recursive: true, force: true });
}

process.stdout.write(`Limpeza concluída: ${removed.length} diretórios de build/teste removidos; dependências e arquivos-fonte preservados.\n`);
