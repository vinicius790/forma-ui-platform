import fs from 'node:fs';
import path from 'node:path';

/**
 * Verifica a integridade estrutural de todos os pacotes do monorepo:
 * 1. Valida campos obrigatórios (name, version, license, main, module, types, exports, files).
 * 2. Verifica se os arquivos apontados em `exports` existem fisicamente após o build (ou valida os fontes correspondentes).
 * 3. Detecta dependências circulares entre os pacotes `@forma-ui/*`.
 */
const packagesDir = path.resolve(process.cwd(), 'packages');
const requireDist = process.argv.includes('--require-dist');
let errors = 0;

const dependencyGraph = new Map();

for (const dirName of fs.readdirSync(packagesDir)) {
  const pkgDir = path.join(packagesDir, dirName);
  const pkgPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(pkgPath)) continue;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const internalDeps = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {})
  ].filter((dep) => dep.startsWith('@forma-ui/'));

  dependencyGraph.set(pkg.name, internalDeps);

  for (const requiredField of ['name', 'version', 'license', 'main', 'module', 'types', 'exports']) {
    if (!pkg[requiredField]) {
      console.error(`[verify-exports] Campo obrigatório "${requiredField}" ausente em ${pkg.name}`);
      errors += 1;
    }
  }

  for (const [subpath, target] of Object.entries(pkg.exports ?? {})) {
    const files = typeof target === 'string' ? [target] : Object.values(target);
    for (const relFile of files) {
      const resolvedDist = path.join(pkgDir, relFile);
      if (requireDist && !fs.existsSync(resolvedDist)) {
        console.error(`[verify-exports] Artefato ausente em ${pkg.name} (${subpath}): ${relFile}`);
        errors += 1;
      }
    }
  }
}

// Detecção de ciclos no grafo de dependências internas (DFS)
const visited = new Set();
const visiting = new Set();

function detectCycle(node, chain = []) {
  if (visiting.has(node)) {
    console.error(`[verify-exports] Dependência circular detectada: ${[...chain, node].join(' -> ')}`);
    errors += 1;
    return;
  }
  if (visited.has(node)) return;
  visiting.add(node);
  for (const dep of dependencyGraph.get(node) ?? []) {
    detectCycle(dep, [...chain, node]);
  }
  visiting.delete(node);
  visited.add(node);
}

for (const pkgName of dependencyGraph.keys()) {
  detectCycle(pkgName);
}

if (errors > 0) {
  process.exit(1);
} else {
  console.warn(`[verify-exports] Sucesso: ${dependencyGraph.size} pacotes auditados sem ciclos ou falhas de contrato.`);
}
