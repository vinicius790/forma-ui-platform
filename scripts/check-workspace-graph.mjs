import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const roots = ['packages', 'apps'];
const nodes = new Map();
const errors = [];
for (const root of roots) {
  for (const entry of await readdir(resolve(root), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = `${root}/${entry.name}`;
    try {
      const manifest = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'));
      if (typeof manifest.name !== 'string') { errors.push(`${directory}: name ausente.`); continue; }
      if (nodes.has(manifest.name)) { errors.push(`${directory}: nome duplicado ${manifest.name}.`); continue; }
      nodes.set(manifest.name, { directory, manifest, edges: new Set() });
    } catch (error) {
      errors.push(`${directory}: package.json inválido (${error instanceof Error ? error.message : String(error)}).`);
    }
  }
}

for (const [name, node] of nodes) {
  for (const section of ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies']) {
    for (const [dependency, range] of Object.entries(node.manifest[section] ?? {})) {
      if (!dependency.startsWith('@forma-ui/')) continue;
      if (!nodes.has(dependency)) { errors.push(`${name}: dependência interna sem pacote correspondente (${dependency}).`); continue; }
      if (section === 'peerDependencies') {
        const localDevelopmentRange = node.manifest.devDependencies?.[dependency];
        if (typeof localDevelopmentRange !== 'string' || !localDevelopmentRange.startsWith('workspace:')) {
          errors.push(`${name}: ${dependency} em peerDependencies precisa de resolução workspace: correspondente em devDependencies.`);
        }
        node.edges.add(dependency);
      } else {
        if (typeof range !== 'string' || !range.startsWith('workspace:')) errors.push(`${name}: ${dependency} deve usar protocolo workspace: em ${section}.`);
        if (section !== 'devDependencies') node.edges.add(dependency);
      }
    }
  }
}

const visiting = new Set();
const visited = new Set();
const order = [];
function visit(name, trail = []) {
  if (visited.has(name)) return;
  if (visiting.has(name)) { errors.push(`Ciclo de dependências: ${[...trail, name].join(' -> ')}`); return; }
  const node = nodes.get(name);
  if (!node) return;
  visiting.add(name);
  for (const dependency of node.edges) visit(dependency, [...trail, name]);
  visiting.delete(name);
  visited.add(name);
  order.push(name);
}
for (const name of nodes.keys()) visit(name);

const core = nodes.get('@forma-ui/core');
if (core && core.edges.size) errors.push(`@forma-ui/core não pode depender de outros pacotes Forma UI: ${[...core.edges].join(', ')}.`);

if (errors.length) {
  process.stderr.write(`Workspace graph inválido (${errors.length}):\n${errors.map((entry) => `- ${entry}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Workspace graph válido: ${nodes.size} projetos, sem ciclos de dependências de runtime.\nOrdem topológica: ${order.join(' → ')}\n`);
}
