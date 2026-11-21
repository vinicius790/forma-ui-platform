import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = process.cwd();
const requiredPaths = [
  'packages/core/src/index.ts',
  'packages/core/src/components/dialog.ts',
  'packages/core/src/components/menu.ts',
  'packages/core/src/components/select.ts',
  'packages/core/src/components/combobox.ts',
  'packages/core/src/primitives/focus.ts',
  'packages/core/src/primitives/collection.ts',
  'packages/core/src/primitives/state-machine.ts',
  'packages/core/src/components/tree-view.ts',
  'packages/core/src/components/listbox.ts',
  'packages/dates/src/index.ts',
  'packages/virtualization/src/index.ts',
  'packages/data-grid/src/index.ts',
  'packages/commands/src/index.ts',
  'packages/eslint-plugin/src/index.mjs',
  'packages/preact/src/index.ts',
  'packages/forms/src/index.ts',
  'packages/floating-ui/src/index.ts',
  'packages/react/src/index.ts',
  'packages/vue/src/index.ts',
  'packages/svelte/src/index.ts',
  'packages/solid/src/index.ts',
  'packages/lit/src/index.ts',
  'packages/angular/src/index.ts',
  'packages/tokens/src/index.ts',
  'packages/themes/src/index.ts',
  'packages/a11y-testing/src/index.ts',
  'packages/codemods/src/index.ts',
  'packages/cli/src/index.mjs',
  'apps/docs/src/main.ts',
  'apps/storybook/.storybook/main.ts',
  'apps/storybook/src/stories/core.stories.ts',
  'packages/playwright/playwright.config.ts',
  '.github/workflows/ci.yml',
  '.github/workflows/release.yml',
  'README.md',
  'SPEC.md',
  'ARQUITETURA_COMPLETA.txt',
];
const failures = [];
const packageRoot = resolve(root, 'packages');
const packages = (await readdir(packageRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const packageName of packages) {
  const directory = resolve(packageRoot, packageName);
  for (const required of ['package.json', 'README.md', 'src']) {
    try {
      const info = await stat(resolve(directory, required));
      if (required === 'src' ? !info.isDirectory() : !info.isFile()) failures.push(`packages/${packageName}/${required}: tipo de arquivo inválido`);
    } catch {
      failures.push(`packages/${packageName}/${required}: obrigatório e ausente`);
    }
  }
  try {
    const manifest = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'));
    if (manifest.name !== `@forma-ui/${packageName}`) failures.push(`packages/${packageName}/package.json: name deve ser @forma-ui/${packageName}`);
  } catch (error) {
    failures.push(`packages/${packageName}/package.json: JSON inválido (${error instanceof Error ? error.message : String(error)})`);
  }
}

for (const relativePath of requiredPaths) {
  try {
    const info = await stat(resolve(root, relativePath));
    if (!info.isFile() || info.size === 0) failures.push(`${relativePath}: ausente, não é arquivo ou está vazio`);
  } catch {
    failures.push(`${relativePath}: arquivo obrigatório ausente`);
  }
}

let jsonCount = 0;
let yamlCount = 0;
let fileCount = 0;
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'dist', 'coverage', '.vite', 'test-results', 'playwright-report'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    fileCount += 1;
    if (entry.name.endsWith('.json')) {
      jsonCount += 1;
      try { JSON.parse(await readFile(path, 'utf8')); }
      catch (error) { failures.push(`${path}: JSON inválido (${error instanceof Error ? error.message : String(error)})`); }
    }
    if (/\.ya?ml$/u.test(entry.name)) yamlCount += 1;
    const info = await stat(path);
    if (info.size === 0) failures.push(`${path}: arquivo vazio`);
  }
}
await walk(root);

if (failures.length) {
  process.stderr.write(`Falha estrutural (${failures.length}):\n${failures.map((item) => `- ${item}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Estrutura aprovada: ${packages.length} pacotes, 2 apps, ${fileCount} arquivos, ${jsonCount} arquivos JSON, ${yamlCount} YAML e ${requiredPaths.length} caminhos críticos.\n`);
}
