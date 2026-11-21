import { readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'ARQUITETURA_COMPLETA.txt');
const ignored = new Set(['.git', 'node_modules', 'dist', 'coverage', '.vite', 'test-results', 'playwright-report', '.turbo']);
const rows = [];
let totalFiles = 0;
let totalBytes = 0;

async function walk(directory, depth = 0) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => {
    if (left.isDirectory() !== right.isDirectory()) return left.isDirectory() ? -1 : 1;
    return left.name.localeCompare(right.name, 'en');
  });
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    const rel = relative(root, path).split('\\').join('/');
    if (resolve(path) === output || rel === 'docs/archive-manifest.json') continue;
    if (entry.isDirectory()) {
      rows.push(`${'  '.repeat(depth)}[DIR]  ${rel}/`);
      await walk(path, depth + 1);
    } else {
      const info = await stat(path);
      totalFiles += 1;
      totalBytes += info.size;
      rows.push(`${'  '.repeat(depth)}[FILE] ${rel} (${info.size.toLocaleString('en-US')} bytes)`);
    }
  }
}

rows.push('FORMA UI — MAPA COMPLETO DE ARQUITETURA');
rows.push('Gerado por scripts/generate-architecture-map.mjs');
rows.push(`Raiz: ${root}`);
rows.push('Diretórios ignorados: node_modules, dist, coverage, cache de ferramentas e artefatos temporários.');
rows.push('');
await walk(root);
rows.push('');
rows.push(`RESUMO: ${totalFiles} arquivos-fonte/configuração/documentação; ${totalBytes.toLocaleString('en-US')} bytes; ${totalFiles ? (totalBytes / totalFiles).toFixed(1) : '0.0'} bytes/arquivo em média.`);
rows.push('Nota: arquivos gerados de build, instalações de dependências e navegadores não fazem parte deste mapa-fonte.');
await writeFile(output, `${rows.join('\n')}\n`, 'utf8');
process.stdout.write(`Mapa de arquitetura regenerado: ${totalFiles} arquivos, ${(totalBytes / 1024).toFixed(1)} KiB.\n`);
