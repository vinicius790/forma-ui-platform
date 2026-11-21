import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const root = process.cwd();
const manifestPath = 'docs/archive-manifest.json';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const excludedDirectories = new Set([
  '.git', '.pnpm-store', 'node_modules', 'dist', 'dist-cjs', 'coverage', '.turbo', '.vite',
  'storybook-static', 'playwright-report', 'test-results', '.audit-runtime',
]);
const excludedFilePatterns = [/^\.audit-/u, /\.tgz$/u, /\.zip$/u, /\.log$/u, /\.tsbuildinfo$/u];
const errors = [];
const listed = new Map();
const actual = new Set();
const actualDirectories = new Set();
let totalBytes = 0;

async function digestFile(path) {
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
    bytes += chunk.length;
  }
  return { bytes, sha256: hash.digest('hex') };
}

for (const entry of manifest.files) {
  if (listed.has(entry.path)) errors.push(`Caminho duplicado: ${entry.path}`);
  listed.set(entry.path, entry);
  if (entry.path.startsWith('/') || entry.path.split('/').includes('..') || entry.path.includes('\\')) errors.push(`Caminho inseguro: ${entry.path}`);
  if (entry.path === manifestPath) errors.push('O manifesto não pode incluir a si próprio.');
  let digest;
  try {
    const path = resolve(entry.path);
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error('not a regular file');
    digest = await digestFile(path);
  } catch {
    errors.push(`Arquivo listado não encontrado ou não regular: ${entry.path}`);
    continue;
  }
  if (digest.sha256 !== entry.sha256) errors.push(`Hash divergente: ${entry.path}`);
  if (digest.bytes !== entry.bytes) errors.push(`Tamanho divergente: ${entry.path}`);
  if (entry.path.startsWith('fixtures/benchmarks/') && entry.path.endsWith('.jsonl') && entry.archiveCompression !== 'STORE') errors.push(`Dataset benchmark precisa de ZIP STORE: ${entry.path}`);
  if (entry.path.endsWith('.rar') && entry.archiveCompression !== 'STORE') errors.push(`Arquivo RAR preservado precisa de ZIP STORE: ${entry.path}`);
  totalBytes += digest.bytes;
}

async function walk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.isSymbolicLink()) {
      errors.push(`Symlink não permitido: ${relative(root, join(directory, item.name)).split('\\').join('/')}`);
      continue;
    }
    const absolute = join(directory, item.name);
    const relativePath = relative(root, absolute).split('\\').join('/');
    if (item.isDirectory()) {
      if (excludedDirectories.has(item.name)) continue;
      actualDirectories.add(relativePath);
      await walk(absolute);
    } else if (relativePath !== manifestPath && !excludedFilePatterns.some((pattern) => pattern.test(item.name))) {
      actual.add(relativePath);
    }
  }
}
await walk(root);
for (const path of actual) if (!listed.has(path)) errors.push(`Arquivo não listado no manifesto: ${path}`);
for (const path of listed.keys()) if (!actual.has(path)) errors.push(`Arquivo listado, mas fora do escopo atual: ${path}`);
const listedDirectories = new Set(manifest.directories ?? []);
for (const path of actualDirectories) if (!listedDirectories.has(path)) errors.push(`Diretório não listado no manifesto: ${path}`);
for (const path of listedDirectories) if (!actualDirectories.has(path)) errors.push(`Diretório listado, mas ausente: ${path}`);
if (totalBytes !== manifest.summary.totalBytes) errors.push('Soma de bytes diverge do resumo.');
if (manifest.summary.files !== manifest.files.length) errors.push('Contagem de arquivos diverge do resumo.');
if (actual.size !== manifest.files.length) errors.push(`Escopo de arquivos divergente: encontrados ${actual.size}, listados ${manifest.files.length}.`);
if (manifest.summary.directories !== manifest.directories.length) errors.push('Contagem de diretórios diverge do resumo.');

if (errors.length) {
  process.stderr.write(`Manifesto do arquivo inválido (${errors.length}):\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Manifesto aprovado: ${manifest.files.length} arquivos e ${actualDirectories.size} diretórios; SHA-256 em streaming (${totalBytes.toLocaleString('en-US')} bytes).\n`);
}
