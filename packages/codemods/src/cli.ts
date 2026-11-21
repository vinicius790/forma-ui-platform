#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { resolve } from 'node:path';
import { transformSource, type MigrationVersion } from './index';

async function main(args: string[]): Promise<void> {
  const fromIndex = args.indexOf('--from');
  const toIndex = args.indexOf('--to');
  const from = fromIndex >= 0 ? (args[fromIndex + 1] as MigrationVersion | undefined) : undefined;
  const to = toIndex >= 0 ? (args[toIndex + 1] as MigrationVersion | undefined) : undefined;
  const write = args.includes('--write');
  const pattern = args.find((arg, i) => !arg.startsWith('--') && i !== fromIndex + 1 && i !== toIndex + 1);
  if (fromIndex < 0 || toIndex < 0 || !from || !to || !pattern) {
    throw new Error('Uso: forma-codemod --from v0 --to v1 "src/**/*.{ts,tsx}" [--write]');
  }
  let changedFiles = 0;
  for await (const file of glob(pattern, { exclude: ['**/node_modules/**', '**/dist/**'] })) {
    const path = resolve(file); const original = await readFile(path, 'utf8'); const result = transformSource(original, from, to, path);
    if (!result.changed) continue;
    changedFiles += 1; process.stdout.write(`${write ? 'UPDATE' : 'DRY-RUN'} ${file}\n  ${result.changes.join(', ')}\n`);
    if (write) await writeFile(path, result.code, 'utf8');
  }
  process.stdout.write(`${changedFiles} arquivo(s) com alterações potenciais. ${write ? 'Alterações gravadas.' : 'Nenhum arquivo foi alterado; adicione --write para aplicar.'}\n`);
}
main(process.argv.slice(2)).catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
