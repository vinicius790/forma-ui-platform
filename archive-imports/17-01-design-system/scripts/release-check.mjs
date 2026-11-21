import fs from 'node:fs';
import path from 'node:path';

/**
 * Audita a prontidão para publicação SemVer (Registry Readiness Check):
 * - Confirma que a versão segue SemVer estrito (X.Y.Z).
 * - Confirma presença de README.md em cada pacote publicável.
 * - Confirma configuração de sideEffects para tree-shaking.
 * - Confirma existência do CHANGELOG.md na raiz.
 */
const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const packagesDir = path.resolve(process.cwd(), 'packages');
let errors = 0;

const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
if (!fs.existsSync(changelogPath)) {
  console.error('[release-check] CHANGELOG.md ausente na raiz do repositório.');
  errors += 1;
}

for (const dirName of fs.readdirSync(packagesDir)) {
  const pkgDir = path.join(packagesDir, dirName);
  const pkgPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(pkgPath)) continue;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  if (!SEMVER_REGEX.test(pkg.version ?? '')) {
    console.error(`[release-check] Versão SemVer inválida em ${pkg.name}: "${pkg.version}"`);
    errors += 1;
  }

  if (pkg.sideEffects === undefined) {
    console.error(`[release-check] Campo "sideEffects" deve ser explicitado em ${pkg.name} para garantir tree-shaking.`);
    errors += 1;
  }

  const readmePath = path.join(pkgDir, 'README.md');
  if (!fs.existsSync(readmePath) || fs.statSync(readmePath).size < 100) {
    console.error(`[release-check] README.md ausente ou incompleto em ${pkg.name}.`);
    errors += 1;
  }
}

if (errors > 0) {
  process.exit(1);
} else {
  console.warn('[release-check] Todos os pacotes estão prontos para versionamento e publicação SemVer.');
}
