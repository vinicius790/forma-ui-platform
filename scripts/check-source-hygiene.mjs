import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', 'dist', 'coverage', '.vite', 'test-results', 'playwright-report', '.turbo']);
const failures = [];
const forbiddenNames = new Set(['.env', '.env.local', '.env.production', '.npmrc.local', 'id_rsa', 'id_ed25519']);
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/u,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/u,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/u,
  /\bAKIA[0-9A-Z]{16}\b/u,
];
let fileCount = 0;
let totalBytes = 0;

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      failures.push(`${path}: symlink não permitido no pacote-fonte; use caminho relativo auditável.`);
      continue;
    }
    if (entry.isDirectory()) { await walk(path); continue; }
    fileCount += 1;
    const info = await stat(path);
    totalBytes += info.size;
    if (info.size === 0) failures.push(`${path}: arquivo vazio.`);
    if (forbiddenNames.has(entry.name) || /^\.env(?:\.|$)/u.test(entry.name)) failures.push(`${path}: arquivo de ambiente/segredo não deve ser incluído.`);
    if (info.size <= 2_000_000 && /\.(?:txt|md|json|ya?ml|mjs|cjs|js|ts|tsx|css|html|svg)$/iu.test(entry.name)) {
      const source = await readFile(path, 'utf8');
      for (const pattern of secretPatterns) if (pattern.test(source)) failures.push(`${path}: padrão semelhante a segredo detectado (${pattern}).`);
    }
  }
}

await walk(root);
if (failures.length) {
  process.stderr.write(`Source hygiene falhou (${failures.length}):\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Source hygiene aprovado: ${fileCount} arquivos e ${(totalBytes / 1024).toFixed(1)} KiB; sem nomes de segredos, symlinks ou arquivos vazios detectados.\n`);
}
