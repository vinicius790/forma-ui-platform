import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';

const entries = {
  index: 'src/index.ts',
  'primitives/index': 'src/primitives/index.ts',
  'components/button': 'src/components/button.ts',
  'components/dialog': 'src/components/dialog.ts',
  'components/menu': 'src/components/menu.ts',
  'components/tabs': 'src/components/tabs.ts',
  'components/tooltip': 'src/components/tooltip.ts',
  'components/select': 'src/components/select.ts',
  'components/toast': 'src/components/toast.ts',
  'components/accordion': 'src/components/accordion.ts'
};

export default [
  {
    input: entries,
    output: [
      {
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name].mjs',
        chunkFileNames: 'chunks/[name]-[hash].mjs',
        sourcemap: true
      },
      {
        dir: 'dist',
        format: 'cjs',
        entryFileNames: '[name].cjs',
        chunkFileNames: 'chunks/[name]-[hash].cjs',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins: [
      resolve(),
      typescript({ tsconfig: './tsconfig.json', declaration: false })
    ]
  },
  {
    input: entries,
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].d.ts',
      chunkFileNames: 'chunks/[name]-[hash].d.ts'
    },
    plugins: [dts()]
  }
];
