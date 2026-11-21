import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const rootPackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const changelog = await readFile(resolve(root, 'CHANGELOG.md'), 'utf8');
const packages = (await readdir(resolve(root, 'packages'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const errors = [];

if (!semver.test(rootPackage.version)) {
  errors.push(`Versão raiz inválida: ${rootPackage.version}`);
}
if (!changelog.trim()) {
  errors.push('CHANGELOG.md está vazio.');
}

const published = new Map();
for (const folder of packages) {
  const packagePath = resolve(root, 'packages', folder, 'package.json');
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
  published.set(pkg.name, pkg);

  if (!semver.test(pkg.version)) errors.push(`${pkg.name}: versão SemVer inválida (${pkg.version}).`);
  if (!pkg.exports || Object.keys(pkg.exports).length === 0) errors.push(`${pkg.name}: mapa exports ausente.`);
  if (!pkg.files?.some((entry) => entry === 'dist' || entry === 'src')) {
    errors.push(`${pkg.name}: files precisa incluir dist ou src.`);
  }
  const shipsDist = pkg.files?.includes('dist');
  if (shipsDist && folder !== 'cli' && (!pkg.main || !pkg.module || !pkg.types)) {
    errors.push(`${pkg.name}: main, module e types são obrigatórios.`);
  }
  if (folder === 'cli' && !pkg.bin?.forma) errors.push(`${pkg.name}: bin forma ausente.`);
}

for (const pkg of published.values()) {
  for (const section of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const [dependency, range] of Object.entries(pkg[section] ?? {})) {
      const internal = published.get(dependency);
      if (!internal) continue;
      if (typeof range !== 'string' || range.trim().length === 0) {
        errors.push(`${pkg.name}: faixa inválida para dependência interna ${dependency}.`);
      }
      if (section === 'dependencies' && range === 'workspace:*') continue;
      if (section === 'peerDependencies' && range.startsWith('workspace:')) {
        errors.push(`${pkg.name}: peerDependency ${dependency} não deve publicar o protocolo workspace.`);
      }
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(`Falha na validação de release:\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Metadados SemVer, exports e dependências internas validados para ${packages.length} pacotes.\n`);
}
