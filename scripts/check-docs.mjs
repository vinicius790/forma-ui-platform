import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith('.md')) files.push(path);
  }
}
await walk('.');
const failures = [];
const pattern = /\[[^\]]*\]\(([^)]+)\)/gu;
for (const file of files) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(pattern)) {
    const href = match[1]?.trim();
    if (!href || /^(?:https?:|mailto:|#|data:)/iu.test(href)) continue;
    const target = decodeURIComponent(href.split('#')[0] ?? '').split('?')[0] ?? '';
    if (!target) continue;
    const resolved = resolve(dirname(file), target);
    try { await access(resolved); }
    catch { failures.push(`${file}: link local não resolvido (${href})`); }
  }
}
if (failures.length) {
  process.stderr.write(`Links locais quebrados (${failures.length}):\n${failures.map((value) => `- ${value}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Documentação aprovada: ${files.length} arquivos Markdown inspecionados; links locais válidos.\n`);
}
