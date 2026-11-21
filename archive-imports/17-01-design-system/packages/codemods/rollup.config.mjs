import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: { index: 'src/index.ts', cli: 'src/cli.ts' },
    output: [
      { dir: 'dist', format: 'esm', entryFileNames: '[name].mjs', sourcemap: true },
      { dir: 'dist', format: 'cjs', entryFileNames: '[name].cjs', sourcemap: true, exports: 'named' }
    ],
    plugins: [resolve(), typescript({ tsconfig: './tsconfig.json', declaration: false })]
  },
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()]
  }
];
