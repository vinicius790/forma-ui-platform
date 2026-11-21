import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const packageDirectories = (await readdir(resolve(root, 'packages'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'forma-ui-publish-check-'));

function quoteArg(value) {
  return /[\s"]/u.test(value) ? `"${value.replace(/"/gu, '\\"')}"` : value;
}

function resolvePnpmPrefix() {
  const direct = spawnSync(
    process.platform === 'win32' ? 'pnpm.cmd --version' : 'pnpm --version',
    { encoding: 'utf8', shell: true },
  );
  if (direct.status === 0) return process.platform === 'win32' ? ['pnpm.cmd'] : ['pnpm'];
  return process.platform === 'win32' ? ['corepack.cmd', 'pnpm'] : ['corepack', 'pnpm'];
}

const pnpmPrefix = resolvePnpmPrefix();

function run(args, cwd, label) {
  const full = [...pnpmPrefix, ...args];
  const result = process.platform === 'win32'
    ? spawnSync(full.map(quoteArg).join(' '), { cwd, encoding: 'utf8', stdio: 'inherit', shell: true })
    : spawnSync(full[0], full.slice(1), { cwd, encoding: 'utf8', stdio: 'inherit' });
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${label}: processo terminou com status ${result.status ?? 'desconhecido'}`);
}

try {
  for (const packageName of packageDirectories) {
    const packageDirectory = resolve(root, 'packages', packageName);
    process.stdout.write(`\n[pack] @forma-ui/${packageName}\n`);
    run(['pack', '--pack-destination', temporaryDirectory], packageDirectory, `pnpm pack @forma-ui/${packageName}`);

    const tarballs = (await readdir(temporaryDirectory)).filter((name) => name.endsWith('.tgz'));
    const matching = tarballs.filter((name) => name.startsWith(`forma-ui-${packageName}-`));
    const tarballName = matching.at(-1);
    if (!tarballName) throw new Error(`pnpm pack não gerou tarball para @forma-ui/${packageName}`);
    const tarball = resolve(temporaryDirectory, tarballName);

    const pkg = JSON.parse(await readFile(resolve(packageDirectory, 'package.json'), 'utf8'));
    const cssEntrypoints = Object.keys(pkg.exports ?? {}).filter((key) => key.endsWith('.css'));

    process.stdout.write(`[publint] @forma-ui/${packageName}\n`);
    run(['exec', 'publint', tarball, '--strict'], root, `publint @forma-ui/${packageName}`);

    process.stdout.write(`[attw] @forma-ui/${packageName}\n`);
    const attwArgs = ['exec', 'attw', tarball, '--profile', 'node16'];
    if (cssEntrypoints.length) {
      attwArgs.push('--exclude-entrypoints', ...cssEntrypoints);
    }
    run(attwArgs, root, `attw @forma-ui/${packageName}`);

    await rm(tarball, { force: true });
  }
  process.stdout.write(`\nPacotes publicados em modo de teste: ${packageDirectories.length}; publint e ATW aprovados.\n`);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
