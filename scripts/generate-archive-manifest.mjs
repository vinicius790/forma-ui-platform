import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, stat, writeFile, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const output = 'docs/archive-manifest.json';
const excludedDirectories = new Set([
  '.git', '.pnpm-store', 'node_modules', 'dist', 'dist-cjs', 'coverage', '.turbo', '.vite',
  'storybook-static', 'playwright-report', 'test-results', '.audit-runtime',
]);
const excludedFilePatterns = [/^\.audit-/u, /\.tgz$/u, /\.zip$/u, /\.log$/u, /\.tsbuildinfo$/u];
const files = [];
const directories = [];

async function digestFile(path) {
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
    bytes += chunk.length;
  }
  return { bytes, sha256: hash.digest('hex') };
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    const path = relative(root, absolute).split('\\').join('/');
    if (entry.isSymbolicLink()) throw new Error(`Symlink não permitido no arquivo-fonte: ${path}`);
    if (entry.isDirectory()) {
      if (excludedDirectories.has(entry.name)) continue;
      directories.push(path);
      await walk(absolute);
      continue;
    }
    if (excludedFilePatterns.some((pattern) => pattern.test(entry.name))) continue;
    if (path === output) continue;
    const info = await stat(absolute);
    if (!info.isFile()) throw new Error(`Entrada não regular não permitida: ${path}`);
    const digest = await digestFile(absolute);
    if (digest.bytes !== info.size) throw new Error(`Arquivo mudou durante o hash: ${path}`);
    files.push({
      path,
      bytes: digest.bytes,
      sha256: digest.sha256,
      extension: extname(entry.name).toLowerCase() || '[no-extension]',
      archiveCompression: (path.startsWith('fixtures/benchmarks/') && path.endsWith('.jsonl')) || path.endsWith('.rar') ? 'STORE' : 'DEFLATE',
    });
  }
}

await walk(root);
files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
directories.sort((a, b) => a.localeCompare(b, 'en'));
const byExtension = {};
for (const file of files) {
  const item = byExtension[file.extension] ??= { files: 0, bytes: 0 };
  item.files += 1;
  item.bytes += file.bytes;
}
const fixtureManifest = JSON.parse(await readFile('fixtures/benchmarks/manifest.json', 'utf8'));
const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  project: 'Forma UI',
  projectVersion: JSON.parse(await readFile('package.json', 'utf8')).version,
  policy: {
    scope: 'source-documentation-and-reproducible-benchmark-corpus',
    hash: 'SHA-256 of each regular file before ZIP storage/compression; computed as a stream',
    selfExclusion: 'docs/archive-manifest.json is excluded to avoid a self-referential hash; the outer ZIP checksum covers it',
    generatedArtifactsExcluded: [...excludedDirectories].sort(),
    excludedFilePatterns: excludedFilePatterns.map((pattern) => pattern.source),
    dependenciesAreNotVendored: true,
    benchmarkCorpus: {
      deterministic: true,
      synthetic: true,
      records: fixtureManifest.summary.records,
      bytes: fixtureManifest.summary.bytes,
      zipCompression: 'ZIP_STORED for JSONL datasets so the extracted files can be streamed without recompression overhead',
      individualFileLimitBytes: 100_000_000,
    },
    requiredArchiveMinimumBytes: 100_000_000,
  },
  summary: {
    files: files.length,
    directories: directories.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    byExtension,
  },
  directories,
  files,
};
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
process.stdout.write(`Manifesto de arquivo gerado: ${files.length} arquivos, ${manifest.summary.totalBytes} bytes; hashes SHA-256 em streaming.\n`);
