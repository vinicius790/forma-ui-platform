import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const inputs = { index: 'src/index.ts' };
for (const folder of ['components', 'primitives']) {
  for (const file of readdirSync(resolve('src', folder))) {
    if (file.endsWith('.ts') && !file.endsWith('.test.ts')) inputs[`${folder}/${file.slice(0, -3)}`] = `src/${folder}/${file}`;
  }
}
export default {
  input: inputs,
  external: [],
  plugins: [nodeResolve(), typescript({ tsconfig: './tsconfig.json', declaration: false, declarationMap: false })],
  output: [
    { dir: 'dist', format: 'es', preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].js' },
    { dir: 'dist', format: 'cjs', preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].cjs', exports: 'named' }
  ]
};
