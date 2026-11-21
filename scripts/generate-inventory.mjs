import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function readManifest(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function sortedEntries(value = {}) {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
}

const packageDirectories = (await readdir('packages', { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
const packages = [];
for (const directory of packageDirectories) {
  const manifest = await readManifest(resolve('packages', directory, 'package.json'));
  packages.push({
    name: manifest.name,
    version: manifest.version,
    description: manifest.description ?? '',
    private: Boolean(manifest.private),
    exports: sortedEntries(manifest.exports),
    runtimeDependencies: sortedEntries(manifest.dependencies),
    peerDependencies: sortedEntries(manifest.peerDependencies),
    optionalDependencies: sortedEntries(manifest.optionalDependencies),
    optionalPeerDependencies: sortedEntries(Object.fromEntries(Object.entries(manifest.peerDependenciesMeta ?? {}).filter(([, metadata]) => metadata?.optional).map(([name]) => [name, manifest.peerDependencies?.[name] ?? '*']))),
    devDependencies: sortedEntries(manifest.devDependencies),
    scripts: sortedEntries(manifest.scripts),
    sideEffects: manifest.sideEffects ?? false,
  });
}

const appDirectories = (await readdir('apps', { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
const apps = [];
for (const directory of appDirectories) {
  const manifest = await readManifest(resolve('apps', directory, 'package.json'));
  apps.push({ name: manifest.name, version: manifest.version, private: Boolean(manifest.private), scripts: sortedEntries(manifest.scripts) });
}

const inventory = {
  schemaVersion: 1,
  scope: 'declared-manifests-only',
  generatedBy: 'scripts/generate-inventory.mjs',
  note: 'This is not a resolved SBOM. Transitive versions, integrity hashes and licenses require a generated pnpm-lock.yaml and a CycloneDX/SPDX export.',
  packageManager: (await readManifest('package.json')).packageManager,
  nodeEngine: (await readManifest('package.json')).engines?.node ?? null,
  packages,
  apps,
};

await writeFile('docs/dependency-inventory.json', `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
process.stdout.write(`Inventário de dependências declaradas gerado: ${packages.length} pacotes e ${apps.length} apps.\n`);
