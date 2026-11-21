import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const errors = [];
const frameworkPackages = new Set(['react', 'preact', 'vue', 'svelte', 'solid-js', 'lit', '@angular/core']);
const coreManifest = JSON.parse(await readFile('packages/core/package.json', 'utf8'));
for (const section of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
  for (const name of Object.keys(coreManifest[section] ?? {})) errors.push(`@forma-ui/core não pode depender de ${name} (${section}).`);
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (/\.(?:ts|tsx|js|mjs)$/u.test(entry.name) && !/\.test\./u.test(entry.name)) files.push(path);
  }
  return files;
}

const coreFiles = await walk('packages/core/src');
for (const path of coreFiles) {
  const source = await readFile(path, 'utf8');
  for (const name of frameworkPackages) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const pattern = new RegExp(`(?:from|import)\\s*['"]${escaped}(?:/[^'"]*)?['"]`, 'u');
    if (pattern.test(source)) errors.push(`${path} importa runtime de framework (${name}).`);
  }
  if (/\bimport\s+[^;]*['"][^'"]+\.css['"]/u.test(source)) errors.push(`${path} importa CSS diretamente no core.`);
}

for (const entry of await readdir('packages', { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const directory = join('packages', entry.name);
  for (const required of ['package.json', 'README.md', 'src']) {
    try { await stat(join(directory, required)); } catch { errors.push(`${directory}: ausente ${required}.`); }
  }
}

if (errors.length) {
  process.stderr.write(`Falha na arquitetura (${errors.length}):\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Arquitetura aprovada: core sem dependências de framework/CSS; ${coreFiles.length} módulos de runtime verificados; todos os pacotes têm README e src.\n`);
}
