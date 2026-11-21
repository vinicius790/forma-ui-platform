#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { codemodTransforms, runCodemodWithReport, runAllCodemods } from './index.js';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry');
const isList = args.includes('--list');
const positional = args.filter((a) => !a.startsWith('--'));

if (isList) {
  for (const t of codemodTransforms) {
    console.warn(`${t.name} (${t.fromVersion} -> ${t.toVersion}): ${t.description}`);
  }
  process.exit(0);
}

const [transformName, targetPath] = positional;

if (!transformName || !targetPath) {
  console.error('Uso: forma-codemod <transform-name | all> <arquivo-ou-diretorio> [--dry] [--list]');
  console.error('Transforms disponíveis:', codemodTransforms.map((t) => t.name).join(', '));
  process.exit(1);
}

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte']);

function collectFiles(entryPath: string): string[] {
  const stat = fs.statSync(entryPath);
  if (stat.isFile()) return [entryPath];
  const results: string[] = [];
  for (const item of fs.readdirSync(entryPath)) {
    if (item === 'node_modules' || item === 'dist' || item.startsWith('.')) continue;
    const full = path.join(entryPath, item);
    if (fs.statSync(full).isDirectory()) {
      results.push(...collectFiles(full));
    } else if (SUPPORTED_EXTENSIONS.has(path.extname(full))) {
      results.push(full);
    }
  }
  return results;
}

const fullTarget = path.resolve(process.cwd(), targetPath);
const files = collectFiles(fullTarget);
let modifiedFiles = 0;

for (const file of files) {
  const source = fs.readFileSync(file, 'utf-8');
  const report =
    transformName === 'all'
      ? runAllCodemods(source)
      : runCodemodWithReport(transformName, source);

  if (report.changed) {
    modifiedFiles += 1;
    if (!isDryRun) {
      fs.writeFileSync(file, report.output, 'utf-8');
    }
  }
}

console.warn(
  `[forma-codemod] ${modifiedFiles} arquivo(s) ${
    isDryRun ? 'seriam atualizados (modo --dry)' : 'atualizados com sucesso'
  }.`
);
