import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = process.cwd();
const snapshotRoot = 'archive-imports/17-01-design-system';
const sourceArchive = 'archive-imports/original/17-01-design-system.rar';
const zipIndexPath = 'archive-imports/original/forma-ui-over-100mb-index.json';
const output = 'docs/source-merge-manifest.json';
const ignoredDirectories = new Set([
  '.git',
  'node_modules',
  'dist',
  'dist-cjs',
  'coverage',
  '.turbo',
  '.vite',
  'storybook-static',
  'playwright-report',
  'test-results',
  '.audit-runtime',
]);

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
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(item.name)) continue;
    const absolute = join(directory, item.name);
    if (item.isSymbolicLink()) throw new Error(`Symlink não permitido: ${relative(root, absolute)}`);
    if (item.isDirectory()) result.push(...await walk(absolute));
    else {
      const path = relative(root, absolute).split('\\').join('/');
      const info = await lstat(absolute);
      if (!info.isFile()) throw new Error(`Entrada não regular: ${path}`);
      const hash = await digest(absolute);
      if (hash.bytes !== info.size) throw new Error(`Arquivo mudou durante hash: ${path}`);
      result.push({ path, bytes: hash.bytes, sha256: hash.sha256, extension: extname(item.name).toLowerCase() || '[no-extension]' });
    }
  }
  return result;
}

const zipIndex = JSON.parse(await readFile(resolve(root, zipIndexPath), 'utf8'));
if (zipIndex.schemaVersion !== 1 || zipIndex.files.length !== zipIndex.summary.files) throw new Error('Índice original do ZIP inválido.');
const zipByPath = new Map(zipIndex.files.map((file) => [file.path, file]));
if (zipByPath.size !== zipIndex.files.length) throw new Error('Caminhos duplicados no índice do ZIP.');

const legacyFiles = (await walk(resolve(root, snapshotRoot))).map((file) => {
  const relativePath = file.path.slice(snapshotRoot.length + 1);
  const zipFile = zipByPath.get(relativePath);
  return {
    ...file,
    relativePath,
    zipSourceBytes: zipFile?.bytes ?? null,
    zipSourceSha256: zipFile?.sha256 ?? null,
    sourceRelationship: !zipFile ? 'legacy-only' : zipFile.sha256 === file.sha256 ? 'identical' : 'conflict'
  };
}).sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'en'));

const activeFiles = await walk(root);
const activeByPath = new Map(activeFiles
  .filter((file) => !file.path.startsWith('archive-imports/') && file.path !== output)
  .map((file) => [file.path, file]));
for (const file of legacyFiles) {
  const active = activeByPath.get(file.relativePath);
  file.activePath = active ? file.relativePath : null;
  file.activeBytes = active?.bytes ?? null;
  file.activeSha256 = active?.sha256 ?? null;
  file.activeIntegration = !active ? 'snapshot-only' : active.sha256 === file.sha256 ? 'same-as-legacy' : 'adapted-or-divergent';
}

const rarHash = await digest(resolve(root, sourceArchive));
const currentPackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const legacyPackage = JSON.parse(await readFile(resolve(root, `${snapshotRoot}/package.json`), 'utf8'));
const summary = {
  zipSourceRegularFiles: zipIndex.files.length,
  rarSourceRegularFiles: legacyFiles.length,
  rarSourceBytes: legacyFiles.reduce((sum, file) => sum + file.bytes, 0),
  sharedPaths: legacyFiles.filter((file) => file.sourceRelationship !== 'legacy-only').length,
  identicalPaths: legacyFiles.filter((file) => file.sourceRelationship === 'identical').length,
  conflictingPaths: legacyFiles.filter((file) => file.sourceRelationship === 'conflict').length,
  legacyOnlyPaths: legacyFiles.filter((file) => file.sourceRelationship === 'legacy-only').length,
  zipOnlyPaths: zipIndex.files.filter((file) => !legacyFiles.some((legacy) => legacy.relativePath === file.path)).length,
  activeRarFilesIntegrated: legacyFiles.filter((file) => file.activePath !== null).length
};

const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  project: 'Forma UI',
  activeVersion: currentPackage.version,
  mergePolicy: 'The ZIP tree remains active. RAR-only content is integrated/adapted; conflicting RAR files are preserved unmodified as an immutable historical snapshot and are not loaded by the workspace.',
  sources: {
    zip: {
      ...zipIndex.sourceArchive,
      originalRegularFiles: zipIndex.summary.files,
      originalExtractedBytes: zipIndex.summary.bytes,
      declaredProjectVersion: '0.3.0',
      fileIndex: zipIndexPath
    },
    rar: {
      fileName: '17-01-design-system(1).rar',
      preservedAs: sourceArchive,
      bytes: rarHash.bytes,
      sha256: rarHash.sha256,
      extractedRoot: snapshotRoot,
      declaredProjectVersion: legacyPackage.version,
      archiveFormat: 'RAR5'
    }
  },
  summary,
  files: legacyFiles
};
await writeFile(resolve(root, output), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
process.stdout.write(`Manifesto de mesclagem gerado: ZIP ${summary.zipSourceRegularFiles} arquivos; RAR ${summary.rarSourceRegularFiles}; ${summary.sharedPaths} caminhos compartilhados; ${summary.conflictingPaths} conflitos preservados; ${summary.legacyOnlyPaths} exclusivos do RAR.\n`);
