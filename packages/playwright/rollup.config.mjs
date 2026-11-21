import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
export default { input: 'src/index.ts', external: ['@playwright/test'], plugins: [nodeResolve(), typescript({ tsconfig: './tsconfig.json', declaration: false })], output: [{ file: 'dist/index.js', format: 'es' }, { file: 'dist/index.cjs', format: 'cjs', exports: 'named' }] };
