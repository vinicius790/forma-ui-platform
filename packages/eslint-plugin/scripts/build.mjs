import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await copyFile('src/index.mjs', 'dist/index.mjs');
await copyFile('src/index.d.ts', 'dist/index.d.ts');
await copyFile('src/index.d.ts', 'dist/index.d.cts');

const source = await readFile('src/index.mjs', 'utf8');
const cjs = source
  .replace(/^export const rules =/mu, 'const rules =')
  .replace(/^export const configs =/mu, 'const configs =')
  .replace(/^export default plugin;\s*$/mu, '')
  .concat(
    "\nObject.defineProperty(exports, '__esModule', { value: true });\nexports.rules = rules;\nexports.configs = configs;\nexports.default = plugin;\n",
  );
await writeFile('dist/index.cjs', cjs, 'utf8');
