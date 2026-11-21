import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const root = process.cwd();
const manifestPath = 'docs/source-merge-manifest.json';
const snapshotRoot = 'archive-imports/17-01-design-system';
const sourceArchive = 'archive-imports/original/17-01-design-system.rar';
const zipIndexPath = 'archive-imports/original/forma-ui-over-100mb-index.json';
const errors = [];
const manifest = JSON.parse(await readFile(resolve(root, manifestPath), 'utf8'));

async function digest(path) {
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
    bytes += chunk.length;
  }
  return { bytes, sha256: hash.digest('hex') };
}

async function walk(directory) {
  const paths = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, item.name);
    const path = relative(root, absolute).split('\\').join('/');
    if (item.isSymbolicLink()) {
      errors.push(`Symlink não permitido: ${path}`);
      continue;
    }
    if (item.isDirectory()) paths.push(...await walk(absolute));
    else {
      const info = await lstat(absolute);
      if (!info.isFile()) errors.push(`Não é arquivo regular: ${path}`);
      else paths.push(path);
    }
  }
  return paths;
}

if (manifest.schemaVersion !== 2) errors.push('schemaVersion não suportado.');
const integratedGuide = await readFile(resolve(root, 'Dependências.md'), 'utf8').catch(() => '');
const originalGuide = await readFile(resolve(root, `${snapshotRoot}/Dependências.md`), 'utf8').catch(() => '');
if (!integratedGuide.includes('pnpm check:source-merge')) errors.push('Guia operacional raiz não documenta a verificação da mesclagem.');
if (!originalGuide || integratedGuide === originalGuide) errors.push('O guia operacional não está integrado/adaptado ou a fonte original foi perdida.');
const zipIndex = JSON.parse(await readFile(resolve(root, zipIndexPath), 'utf8'));
if (zipIndex.sourceArchive?.sha256 !== manifest.sources?.zip?.sha256) errors.push('Hash do ZIP-base diverge do índice.');
if (zipIndex.summary?.files !== manifest.summary?.zipSourceRegularFiles) errors.push('Contagem de arquivos do ZIP-base diverge.');

try {
  const source = await digest(resolve(root, sourceArchive));
  if (source.sha256 !== manifest.sources.rar.sha256) errors.push('SHA-256 do RAR original diverge do manifesto.');
  if (source.bytes !== manifest.sources.rar.bytes) errors.push('Tamanho do RAR original diverge do manifesto.');
} catch (error) {
  errors.push(`RAR original ausente: ${String(error)}`);
}

const zipByPath = new Map(zipIndex.files.map((file) => [file.path, file]));
const expected = new Map();
for (const file of manifest.files ?? []) {
  if (expected.has(file.path)) errors.push(`Caminho duplicado no manifesto: ${file.path}`);
  expected.set(file.path, file);
  if (file.path.startsWith('/') || file.path.split('/').includes('..') || file.path.includes('\\')) errors.push(`Caminho inseguro: ${file.path}`);
  try {
    const actual = await digest(resolve(root, file.path));
    if (actual.bytes !== file.bytes) errors.push(`Tamanho divergente: ${file.path}`);
    if (actual.sha256 !== file.sha256) errors.push(`Hash divergente: ${file.path}`);
  } catch (error) {
    errors.push(`Arquivo legado ausente: ${file.path} (${String(error)})`);
  }
  const sourceZip = zipByPath.get(file.relativePath);
  const expectedRelationship = !sourceZip ? 'legacy-only' : sourceZip.sha256 === file.sha256 ? 'identical' : 'conflict';
  if (file.sourceRelationship !== expectedRelationship) errors.push(`Relação ZIP/RAR incorreta: ${file.relativePath}`);
  if (file.zipSourceSha256 !== (sourceZip?.sha256 ?? null)) errors.push(`Hash da fonte ZIP incorreto: ${file.relativePath}`);
  if (!file.activePath) errors.push(`Arquivo legado não integrado nem mapeado: ${file.relativePath}`);
  if (file.activePath) {
    if (file.activePath.startsWith('/') || file.activePath.split('/').includes('..') || file.activePath.includes('\\')) errors.push(`Caminho ativo inseguro: ${file.activePath}`);
    try {
      const active = await digest(resolve(root, file.activePath));
      if (active.sha256 !== file.activeSha256 || active.bytes !== file.activeBytes) errors.push(`Arquivo ativo mudou desde o manifesto: ${file.activePath}`);
    } catch (error) {
      errors.push(`Arquivo ativo correspondente ausente: ${file.activePath} (${String(error)})`);
    }
  }
}

const actualSnapshot = await walk(resolve(root, snapshotRoot));
const actualRelative = new Set(actualSnapshot.map((path) => path.slice(snapshotRoot.length + 1)));
for (const path of actualRelative) if (![...expected.values()].some((file) => file.relativePath === path)) errors.push(`Arquivo legado fora do manifesto: ${path}`);
for (const file of expected.values()) if (!actualRelative.has(file.relativePath)) errors.push(`Arquivo do manifesto ausente do snapshot: ${file.relativePath}`);

const relationships = {
  legacyRegularFiles: manifest.files.length,
  legacyBytes: manifest.files.reduce((total, file) => total + file.bytes, 0),
  sharedPaths: manifest.files.filter((file) => file.sourceRelationship !== 'legacy-only').length,
  identicalPaths: manifest.files.filter((file) => file.sourceRelationship === 'identical').length,
  conflictingPaths: manifest.files.filter((file) => file.sourceRelationship === 'conflict').length,
  legacyOnlyPaths: manifest.files.filter((file) => file.sourceRelationship === 'legacy-only').length,
  zipOnlyPaths: zipIndex.files.filter((file) => !expected.has(`${snapshotRoot}/${file.path}`) && !manifest.files.some((legacy) => legacy.relativePath === file.path)).length,
  activeRarFilesIntegrated: manifest.files.filter((file) => file.activePath !== null).length
};
const stats = manifest.summary;
for (const [key, value] of Object.entries(relationships)) {
  const stored = stats[key];
  if (stored !== undefined && stored !== value) errors.push(`Resumo divergente em ${key}: manifesto=${stored} real=${value}`);
}
if (relationships.legacyRegularFiles !== 117 || relationships.sharedPaths !== 116 || relationships.identicalPaths !== 0 || relationships.conflictingPaths !== 116 || relationships.legacyOnlyPaths !== 1 || relationships.zipOnlyPaths !== 232) errors.push('As contagens de reconciliação não correspondem à comparação validada das fontes originais.');

if (!errors.length) {
  process.stdout.write(`Mesclagem aprovada: ${relationships.legacyRegularFiles} arquivos RAR verificados; ZIP=${zipIndex.files.length}; compartilhados=${relationships.sharedPaths}; conflitos preservados=${relationships.conflictingPaths}; exclusivos RAR=${relationships.legacyOnlyPaths}; exclusivos ZIP=${relationships.zipOnlyPaths}.\n`);
} else {
  process.stderr.write(`Falha na auditoria da mesclagem (${errors.length}):\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exitCode = 1;
}
