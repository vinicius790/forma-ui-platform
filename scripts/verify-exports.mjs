import { access, readFile, readdir } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const packageRoot = resolve(root, 'packages');
const packageDirectories = (await readdir(packageRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
const failures = [];

async function listFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }));
    return nested.flat();
  } catch { return []; }
}

async function assertExists(packageName, field, target) {
  try { await access(resolve(packageRoot, packageName, target)); }
  catch { failures.push(`${packageName} ${field}: ausente ${target}`); }
}

function collectExportEntries(exportValue, prefix = '') {
  if (typeof exportValue === 'string') return [[prefix || 'default', exportValue]];
  if (!exportValue || typeof exportValue !== 'object') return [];
  return Object.entries(exportValue).flatMap(([condition, entry]) =>
    collectExportEntries(entry, prefix ? `${prefix}.${condition}` : condition),
  );
}

for (const name of packageDirectories) {
  const directory = resolve(packageRoot, name);
  const pkg = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'));
  const distFiles = await listFiles(resolve(directory, 'dist'));
  const relativeDistFiles = distFiles.map((path) => `./${relative(directory, path).split(sep).join('/')}`);

  if (!pkg.files?.some((entry) => entry === 'dist' || entry === 'src')) failures.push(`${pkg.name}: files precisa incluir dist ou src`);
  const exportEntries = Object.entries(pkg.exports ?? {});
  if (!exportEntries.length && !Object.keys(pkg.bin ?? {}).length) failures.push(`${pkg.name}: mapa exports/bin ausente`);

  for (const [specifier, exportValue] of exportEntries) {
    const targets = collectExportEntries(exportValue);
    for (const [condition, target] of targets) {
      const resolvedTargets = target.includes('*')
        ? relativeDistFiles.filter((file) => {
            const wildcardIndex = target.indexOf('*');
            return file.startsWith(target.slice(0, wildcardIndex)) && file.endsWith(target.slice(wildcardIndex + 1));
          }).map((file) => {
            const wildcardIndex = target.indexOf('*');
            const prefix = target.slice(0, wildcardIndex);
            const suffix = target.slice(wildcardIndex + 1);
            return target.replace('*', file.slice(prefix.length, file.length - suffix.length));
          })
        : [target];
      if (!resolvedTargets.length) failures.push(`${pkg.name} ${specifier} (${condition}): padrão sem correspondência (${target})`);
      for (const path of resolvedTargets) await assertExists(name, `${specifier} (${condition})`, path);
    }
  }

  for (const field of ['main', 'module', 'types']) if (pkg[field]) await assertExists(name, field, pkg[field]);
  for (const [command, path] of Object.entries(pkg.bin ?? {})) await assertExists(name, `bin ${command}`, path);
}

if (failures.length) {
  process.stderr.write(`Falha na verificação de exports (${failures.length}):\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Exports, entradas públicas e bins verificados para ${packageDirectories.length} pacotes.\n`);
}
