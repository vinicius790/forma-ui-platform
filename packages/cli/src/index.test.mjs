import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const entry = fileURLToPath(new URL('./index.mjs', import.meta.url));

async function withProject(run) {
  const cwd = await mkdtemp(join(tmpdir(), 'forma-cli-test-'));
  try { await run(cwd); } finally { await rm(cwd, { recursive: true, force: true }); }
}

function invoke(args) {
  return spawnSync(process.execPath, [entry, ...args], { encoding: 'utf8' });
}

test('list reports every supported adapter and vanilla target', () => {
  const result = invoke(['list']);
  assert.equal(result.status, 0, result.stderr);
  for (const framework of ['react', 'preact', 'vue', 'svelte', 'solid', 'lit', 'angular', 'vanilla']) {
    assert.match(result.stdout, new RegExp(`^${framework}$`, 'mu'));
  }
});

test('doctor reports project prerequisites without mutating the project', async () => {
  await withProject(async (cwd) => {
    await writeFile(join(cwd, 'package.json'), '{"name":"fixture"}\n');
    await writeFile(join(cwd, 'tsconfig.json'), '{}\n');
    const result = invoke(['doctor', '--cwd', cwd]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /package\.json/);
    assert.match(result.stdout, /TypeScript config/);
    assert.equal(await readFile(join(cwd, 'package.json'), 'utf8'), '{"name":"fixture"}\n');
  });
});

test('init generates a framework-specific file and refuses to overwrite it', async () => {
  await withProject(async (cwd) => {
    const result = invoke(['init', '--framework', 'preact', '--cwd', cwd]);
    assert.equal(result.status, 0, result.stderr);
    const target = join(cwd, 'src', 'forma-ui.ts');
    const content = await readFile(target, 'utf8');
    assert.match(content, /@forma-ui\/preact/u);
    const duplicate = invoke(['init', '--framework', 'react', '--cwd', cwd]);
    assert.notEqual(duplicate.status, 0);
    assert.match(duplicate.stderr, /refusing to overwrite/u);
    assert.equal(await readFile(target, 'utf8'), content);
  });
});

test('add theme creates opt-in CSS and refuses to overwrite it', async () => {
  await withProject(async (cwd) => {
    const result = invoke(['add', 'theme', '--cwd', cwd]);
    assert.equal(result.status, 0, result.stderr);
    const target = join(cwd, 'src', 'styles', 'forma-theme.css');
    const content = await readFile(target, 'utf8');
    assert.match(content, /--forma-surface/u);
    assert.match(content, /data-forma-theme="dark"/u);
    const duplicate = invoke(['add', 'theme', '--cwd', cwd]);
    assert.notEqual(duplicate.status, 0);
    assert.match(duplicate.stderr, /refusing to overwrite/u);
    assert.equal(await readFile(target, 'utf8'), content);
  });
});

test('init rejects unsupported framework values', async () => {
  await withProject(async (cwd) => {
    const result = invoke(['init', '--framework', 'unknown', '--cwd', cwd]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Unsupported framework/u);
  });
});


test('catalog lists v10 headless controllers including popover, drawer, stepper and tags-input', () => {
  const result = invoke(['catalog']);
  assert.equal(result.status, 0, result.stderr);
  for (const name of ['popover', 'drawer', 'stepper', 'carousel', 'color-picker', 'tags-input', 'editable', 'tour']) {
    assert.match(result.stdout, new RegExp(`^${name}$`, 'mu'));
  }
});

test('add component scaffolds a controller starter and refuses overwrite', async () => {
  await withProject(async (cwd) => {
    const result = invoke(['add', 'component', 'stepper', '--framework', 'react', '--cwd', cwd]);
    assert.equal(result.status, 0, result.stderr);
    const target = join(cwd, 'src', 'components', 'stepper.ts');
    const content = await readFile(target, 'utf8');
    assert.match(content, /createStepperController/u);
    const duplicate = invoke(['add', 'component', 'stepper', '--cwd', cwd]);
    assert.notEqual(duplicate.status, 0);
  });
});

test('tokens prints OKLCH @theme CSS output', () => {
  const result = invoke(['tokens', '--mode', 'dark']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /oklch\(/u);
  assert.match(result.stdout, /#0f172a/u);
});

test('list includes qwik and init scaffolds a Qwik starter', async () => {
  const listed = invoke(['list']);
  assert.equal(listed.status, 0, listed.stderr);
  assert.match(listed.stdout, /^qwik$/mu);

  await withProject(async (cwd) => {
    const result = invoke(['init', '--framework', 'qwik', '--cwd', cwd]);
    assert.equal(result.status, 0, result.stderr);
    const content = await readFile(join(cwd, 'src', 'forma-ui.ts'), 'utf8');
    assert.match(content, /@forma-ui\/qwik/u);
    assert.match(content, /100\.0\.0/u);
  });
});

test('catalog includes all 10 v50 controllers (64 total) and scaffolds v50 components', async () => {
  const result = invoke(['catalog']);
  assert.equal(result.status, 0, result.stderr);
  const items = result.stdout.trim().split(/\r?\n/u).filter(Boolean);
  assert.equal(items.length, 64);
  const v50Controllers = [
    'bottom-sheet', 'command-bar', 'feed', 'kanban', 'menubar',
    'notification-center', 'otp-input', 'qrcode', 'signature-pad', 'tree-grid',
  ];
  for (const name of v50Controllers) {
    assert.ok(items.includes(name), `Expected catalog to include ${name}`);
  }

  await withProject(async (cwd) => {
    const scaffolded = invoke(['add', 'component', 'qrcode', '--framework', 'qwik', '--cwd', cwd]);
    assert.equal(scaffolded.status, 0, scaffolded.stderr);
    const content = await readFile(join(cwd, 'src', 'components', 'qrcode.ts'), 'utf8');
    assert.match(content, /createQrCodeController/u);
  });
});

test('audit reports package.json, a11y tooling, lockfile and tsconfig diagnostics', async () => {
  await withProject(async (cwd) => {
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({
        name: 'v50-fixture',
        dependencies: { '@forma-ui/core': '50.0.0' },
        devDependencies: { '@forma-ui/eslint-plugin': '50.0.0' },
      }),
    );
    await writeFile(join(cwd, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
    await writeFile(join(cwd, 'tsconfig.json'), '{"compilerOptions":{"strict":true}}\n');

    const result = invoke(['audit', '--cwd', cwd]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Forma UI Audit \(100\.0\.0\)/u);
    assert.match(result.stdout, /✓ package\.json/u);
    assert.match(result.stdout, /✓ a11y tooling/u);
    assert.match(result.stdout, /✓ lockfile: pnpm-lock\.yaml/u);
    assert.match(result.stdout, /✓ tsconfig: strict mode enabled/u);
    assert.match(result.stdout, /4\/4 checks passed/u);
  });

  await withProject(async (cwd) => {
    const missingPkg = invoke(['audit', '--cwd', cwd]);
    assert.notEqual(missingPkg.status, 0);
    assert.match(missingPkg.stdout, /! package\.json/u);
  });
});
