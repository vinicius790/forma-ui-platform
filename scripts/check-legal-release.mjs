import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const failures = [];
try { await access(resolve(root, 'LICENSE')); }
catch { failures.push('LICENSE ausente: a licença precisa ser escolhida pelo responsável.'); }
const entries = await readdir(resolve(root, 'packages'), { withFileTypes: true });
for (const entry of entries.filter((item) => item.isDirectory())) {
  const manifestPath = resolve(root, 'packages', entry.name, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (typeof manifest.license !== 'string' || !manifest.license.trim() || manifest.license === 'UNLICENSED') {
    failures.push(`${manifest.name}: campo license SPDX não definido.`);
  }
}
if (failures.length) {
  process.stderr.write(`Publicação bloqueada por pendências legais (${failures.length}):\n${failures.map((entry) => `- ${entry}`).join('\n')}\nConsulte docs/legal-release-checklist.md.\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Licença e metadados SPDX declarados em todos os pacotes.\n');
}
