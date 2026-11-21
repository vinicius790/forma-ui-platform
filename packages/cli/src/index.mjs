#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const version = '100.0.0';
const integrations = ['react', 'preact', 'vue', 'svelte', 'solid', 'lit', 'angular', 'qwik', 'vanilla'];
const catalog = [
  'accordion', 'avatar', 'bottom-sheet', 'breadcrumb', 'button', 'carousel', 'checkbox', 'collapsible',
  'color-picker', 'combobox', 'command-bar', 'context-menu', 'dialog', 'disclosure', 'drawer', 'editable',
  'feed', 'file-upload', 'form-field', 'grid', 'hover-card', 'kanban', 'listbox', 'menu', 'menubar',
  'meter', 'notification-center', 'number-field', 'otp-input', 'pagination', 'pin-input', 'popover',
  'progress', 'qrcode', 'radio-group', 'rating-group', 'scroll-area', 'search-field', 'segment-group',
  'select', 'separator', 'signature-pad', 'slider', 'splitter', 'stepper', 'switch', 'tabs', 'tags-input',
  'text-field', 'toast', 'toggle-group', 'toolbar', 'tooltip', 'tour', 'tree-grid', 'audio-player', 'code-editor-gutter', 'diff-viewer', 'dock', 'rich-listbox', 'spotlight', 'timeline', 'wizard-dialog', 'tree-view',
];

const componentPascalOverrides = {
  qrcode: 'QrCode',
};

const usage = `Forma UI CLI ${version}\n\nUsage:\n  forma doctor [--cwd path]\n  forma audit [--cwd path]\n  forma list\n  forma catalog\n  forma init --framework <${integrations.join('|')}> [--cwd path]\n  forma add theme [--cwd path]\n  forma add component <name> --framework <${integrations.join('|')}> [--cwd path]\n  forma tokens [--mode light|dark]\n  forma help\n`;

const args = process.argv.slice(2);
const command = args[0] ?? 'help';
function value(flag, fallback) { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : fallback; }
const cwd = resolve(value('--cwd', process.cwd()));
async function exists(path) { try { await access(path); return true; } catch { return false; } }

async function doctor() {
  const checks = [
    ['package.json', await exists(join(cwd, 'package.json'))],
    ['node_modules', await exists(join(cwd, 'node_modules'))],
    ['pnpm-lock.yaml', await exists(join(cwd, 'pnpm-lock.yaml'))],
    ['TypeScript config', (await exists(join(cwd, 'tsconfig.json'))) || (await exists(join(cwd, 'tsconfig.base.json')))],
  ];
  for (const [name, ok] of checks) console.log(`${ok ? '✓' : '!'} ${name}`);
  if (!checks[0][1]) process.exitCode = 1;
}

async function audit() {
  const pkgPath = join(cwd, 'package.json');
  let pkg = null;
  let pkgOk = false;
  if (await exists(pkgPath)) {
    try {
      pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
      pkgOk = Boolean(pkg && typeof pkg === 'object');
    } catch {
      pkgOk = false;
    }
  }

  const allDeps = pkgOk
    ? {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {}),
        ...(pkg.peerDependencies ?? {}),
      }
    : {};
  const formaPackages = Object.keys(allDeps).filter((dep) => dep.startsWith('@forma-ui/'));

  const hasA11yDeps = Boolean(
    allDeps['@forma-ui/eslint-plugin'] ||
      allDeps['@forma-ui/a11y-testing'] ||
      allDeps['axe-core'] ||
      allDeps['@axe-core/playwright'],
  );
  const hasEslintConfig =
    (await exists(join(cwd, 'eslint.config.mjs'))) ||
    (await exists(join(cwd, 'eslint.config.js'))) ||
    (await exists(join(cwd, 'eslint.config.ts')));
  const a11yOk = hasA11yDeps || hasEslintConfig;

  const lockfiles = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'bun.lock'];
  let foundLockfile = null;
  for (const lf of lockfiles) {
    if (await exists(join(cwd, lf))) {
      foundLockfile = lf;
      break;
    }
  }

  const tsconfigPath = (await exists(join(cwd, 'tsconfig.json')))
    ? join(cwd, 'tsconfig.json')
    : (await exists(join(cwd, 'tsconfig.base.json')))
      ? join(cwd, 'tsconfig.base.json')
      : null;
  let tsconfigStrict = false;
  if (tsconfigPath) {
    try {
      const raw = await readFile(tsconfigPath, 'utf8');
      tsconfigStrict = /"strict"\s*:\s*true/u.test(raw);
    } catch {
      tsconfigStrict = false;
    }
  }

  const checks = [
    ['package.json', pkgOk, pkgOk ? `${formaPackages.length} @forma-ui/* package(s)` : 'missing or invalid JSON'],
    ['a11y tooling', a11yOk, hasA11yDeps ? 'accessibility package configured' : hasEslintConfig ? 'eslint config detected' : 'add @forma-ui/eslint-plugin and @forma-ui/a11y-testing'],
    ['lockfile', Boolean(foundLockfile), foundLockfile ?? 'no lockfile found (pnpm-lock.yaml recommended)'],
    ['tsconfig', Boolean(tsconfigPath), tsconfigPath ? (tsconfigStrict ? 'strict mode enabled' : 'present (consider enabling strict: true)') : 'missing tsconfig.json'],
  ];

  console.log(`Forma UI Audit (${version}) — ${cwd}`);
  for (const [label, ok, detail] of checks) {
    console.log(`${ok ? '✓' : '!'} ${label}: ${detail}`);
  }
  const passedCount = checks.filter(([, ok]) => ok).length;
  console.log(`Summary: ${passedCount}/${checks.length} checks passed. Automated checks do not substitute for manual keyboard/AT WCAG review.`);
  if (!pkgOk) process.exitCode = 1;
}

async function init() {
  const framework = value('--framework', '');
  if (!integrations.includes(framework)) throw new Error(`Unsupported framework. Choose: ${integrations.join(', ')}`);
  const path = join(cwd, 'src', 'forma-ui.ts');
  await mkdir(dirname(path), { recursive: true });
  const imports = {
    react: `import { useDialog, usePopover, useDrawer, useMenu, useTabs } from '@forma-ui/react';`,
    preact: `import { useDialog, usePopover, useDrawer, useMenu, useTabs } from '@forma-ui/preact';`,
    vanilla: `import { createDialogController, createPopoverController, createDrawerController, createMenuController, createTabsController } from '@forma-ui/core';`,
    vue: `import { useDialog, usePopover, useDrawer, useMenu, useTabs } from '@forma-ui/vue';`,
    svelte: `import { createDialogStore, createPopoverStore, createDrawerStore, createMenuStore, createTabsStore } from '@forma-ui/svelte';`,
    solid: `import { createDialog, createPopover, createDrawer, createMenu, createTabs } from '@forma-ui/solid';`,
    lit: `import { FormaControllerBridge, FormaCallbackBridge, FormaHotkeysController, dispatchFormaChange } from '@forma-ui/lit';`,
    angular: `import { createFormaSignal, ownFormaController, injectCollapsible, injectPopover, injectDrawer } from '@forma-ui/angular';`,
    qwik: `import { createQwikDialog, createQwikPopover, createQwikDrawer, createQwikTabs, createQwikBottomSheet, createQwikOtpInput } from '@forma-ui/qwik';`,
  };
  const content = framework === 'vanilla'
    ? `/** Generated starting point (Forma UI ${version}). Compose only the controllers your application uses. */\n${imports[framework]}\n\nexport const formaIntegration = 'vanilla' as const;\n`
    : `/** Generated starting point (Forma UI ${version}). Compose only the adapters your application uses. */\n${imports[framework]}\n\nexport const formaIntegration = '${framework}' as const;\n`;
  if (await exists(path)) throw new Error(`${path} already exists; refusing to overwrite.`);
  await writeFile(path, content, 'utf8');
  console.log(`Created ${path}`);
}

async function addTheme() {
  const path = join(cwd, 'src', 'styles', 'forma-theme.css');
  await mkdir(dirname(path), { recursive: true });
  if (await exists(path)) throw new Error(`${path} already exists; refusing to overwrite.`);
  await writeFile(
    path,
    `/* Optional theme tokens (Forma UI ${version}). Import this file explicitly in your application. */\n:root, [data-forma-theme="light"] {\n  color-scheme: light;\n  --forma-surface: #ffffff; --forma-surface-raised: #ffffff; --forma-text: #0f172a;\n  --forma-text-muted: #475569; --forma-border: #cbd5e1; --forma-focus: #2563eb;\n  --forma-primary: #1d4ed8; --forma-danger: #b91c1c;\n  --forma-brand-500: oklch(0.58 0.19 255);\n}\n[data-forma-theme="dark"] {\n  color-scheme: dark; --forma-surface: #0f172a; --forma-surface-raised: #1e293b;\n  --forma-text: #f8fafc; --forma-text-muted: #cbd5e1; --forma-border: #475569;\n  --forma-focus: #93c5fd; --forma-primary: #93c5fd; --forma-danger: #fca5a5;\n}\n@media (forced-colors: active) {\n  :root { --forma-surface: Canvas; --forma-text: CanvasText; --forma-border: ButtonBorder; --forma-focus: Highlight; }\n}\n`,
    'utf8',
  );
  console.log(`Created ${path}`);
}

async function addComponent() {
  const name = args[2] ?? '';
  const framework = value('--framework', 'vanilla');
  if (!catalog.includes(name)) throw new Error(`Unknown component "${name}". Run "forma catalog" to inspect available controllers.`);
  if (!integrations.includes(framework)) throw new Error(`Unsupported framework. Choose: ${integrations.join(', ')}`);
  const pascal =
    componentPascalOverrides[name] ??
    name.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
  const path = join(cwd, 'src', 'components', `${name}.ts`);
  await mkdir(dirname(path), { recursive: true });
  if (await exists(path)) throw new Error(`${path} already exists; refusing to overwrite.`);
  const body = `/** Headless ${pascal} starter generated by Forma UI CLI ${version} (${framework}). */\nimport { create${pascal}Controller } from '@forma-ui/core/components/${name}';\n\nexport const createApp${pascal} = create${pascal}Controller;\n`;
  await writeFile(path, body, 'utf8');
  console.log(`Created ${path}`);
}

function emitTokens() {
  const mode = value('--mode', 'light');
  console.log(`/* Forma UI ${version} OKLCH + Semantic Tokens (${mode}) */`);
  console.log(`@theme {\n  --color-forma-brand-500: oklch(0.58 0.19 255);\n  --color-forma-surface: ${mode === 'dark' ? '#0f172a' : '#ffffff'};\n  --color-forma-text: ${mode === 'dark' ? '#f8fafc' : '#0f172a'};\n}`);
}

try {
  if (command === 'doctor') await doctor();
  else if (command === 'audit') await audit();
  else if (command === 'list') console.log(integrations.join('\n'));
  else if (command === 'catalog') console.log(catalog.join('\n'));
  else if (command === 'init') await init();
  else if (command === 'add' && args[1] === 'theme') await addTheme();
  else if (command === 'add' && args[1] === 'component') await addComponent();
  else if (command === 'tokens') emitTokens();
  else console.log(usage);
} catch (error) {
  console.error(`forma: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
