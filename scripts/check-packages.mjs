import { access, readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const packageEntries = await readdir('packages', { withFileTypes: true });
const packageDirectories = packageEntries.filter((entry) => entry.isDirectory());
const packageNames = new Map();
const errors = [];

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

function collectExportTargets(value) {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap((entry) => collectExportTargets(entry));
}

for (const entry of packageDirectories) {
  const directory = resolve('packages', entry.name);
  const manifestPath = join(directory, 'package.json');
  try {
    const pkg = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (typeof pkg.name !== 'string' || !pkg.name.startsWith('@forma-ui/')) {
      errors.push(`${manifestPath}: package name deve usar o escopo @forma-ui/`);
    } else if (packageNames.has(pkg.name)) {
      errors.push(`${manifestPath}: nome duplicado ${pkg.name}`);
    } else {
      packageNames.set(pkg.name, entry.name);
      if (pkg.name !== `@forma-ui/${entry.name}`) errors.push(`${manifestPath}: nome não corresponde ao diretório ${entry.name}`);
    }

    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(pkg.version ?? '')) errors.push(`${manifestPath}: versão SemVer inválida`);
    if (pkg.private !== true && !pkg.exports && !pkg.bin) errors.push(`${manifestPath}: pacote público precisa declarar exports ou bin`);
    if (pkg.sideEffects !== undefined && typeof pkg.sideEffects !== 'boolean' && !Array.isArray(pkg.sideEffects)) errors.push(`${manifestPath}: sideEffects deve ser boolean ou array de paths`);
    if (!Array.isArray(pkg.files) || pkg.files.length === 0) errors.push(`${manifestPath}: pacote precisa de allowlist files explícita`);

    for (const field of ['main', 'module', 'types']) {
      const target = pkg[field];
      if (target && (typeof target !== 'string' || !(target.startsWith('./dist/') || target.startsWith('./src/')))) errors.push(`${pkg.name}: ${field} deve apontar para ./dist/ ou ./src/`);
    }

    for (const [specifier, value] of Object.entries(pkg.exports ?? {})) {
      const targets = collectExportTargets(value);
      if (!targets.length) errors.push(`${pkg.name}: export ${specifier} não possui destino`);
      for (const target of targets) {
        if (!target.startsWith('./') || target.split('/').includes('..')) {
          errors.push(`${pkg.name}: destino inválido em ${specifier}: ${target}`);
          continue;
        }
        if (!target.includes('*') && !target.startsWith('./dist/') && !(await exists(join(directory, target)))) errors.push(`${pkg.name}: destino de export inexistente (${target})`);
      }
    }

    for (const [command, target] of Object.entries(pkg.bin ?? {})) {
      if (typeof target !== 'string' || !target.startsWith('./') || (!target.startsWith('./dist/') && !(await exists(join(directory, target))))) errors.push(`${pkg.name}: bin ${command} aponta para arquivo inexistente (${target})`);
    }

    for (const section of ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies']) {
      for (const [dependency, range] of Object.entries(pkg[section] ?? {})) {
        if (typeof range !== 'string' || !range.trim()) errors.push(`${pkg.name}: faixa de versão inválida para ${dependency}`);
        if (dependency.startsWith('@forma-ui/') && !packageNames.has(dependency) && !packageDirectories.some((candidate) => `@forma-ui/${candidate.name}` === dependency)) errors.push(`${pkg.name}: dependência interna desconhecida ${dependency}`);
      }
    }

    const scripts = pkg.scripts ?? {};
    for (const [scriptName, command] of Object.entries(scripts)) {
      if (typeof command !== 'string') continue;
      for (const match of command.matchAll(/(?:^|&&\s*|\|\|\s*)node(?:\s+--[A-Za-z0-9_-]+)*\s+((?:scripts|src)\/[^\s;&|]+)/gu)) {
        const target = match[1].replace(/^['"]|['"]$/gu, '');
        if (!await exists(join(directory, target)) && !await exists(resolve(target))) errors.push(`${pkg.name}: script ${scriptName} referencia caminho inexistente ${target}`);
      }
      if (/rollup\s+-c/u.test(command) && !await exists(join(directory, 'rollup.config.mjs'))) errors.push(`${pkg.name}: script ${scriptName} exige rollup.config.mjs`);
      if (/tsc\s+-p/u.test(command) && !await exists(join(directory, 'tsconfig.json'))) errors.push(`${pkg.name}: script ${scriptName} exige tsconfig.json`);
    }
  } catch (error) {
    errors.push(`${manifestPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

for (const entry of packageDirectories) {
  let pkg;
  try { pkg = JSON.parse(await readFile(resolve('packages', entry.name, 'package.json'), 'utf8')); } catch { continue; }
  for (const section of ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies']) {
    for (const dependency of Object.keys(pkg[section] ?? {})) {
      if (dependency.startsWith('@forma-ui/') && !packageNames.has(dependency)) errors.push(`${pkg.name}: dependência interna não registrada ${dependency}`);
    }
  }
}

if (errors.length) {
  process.stderr.write(`Falha na verificação de pacotes (${errors.length}):\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Metadados, nomes únicos, exports, bins, scripts e dependências verificados (${packageDirectories.length} pacotes).\n`);
}
