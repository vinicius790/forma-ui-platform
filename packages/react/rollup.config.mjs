import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
export default { input: 'src/index.ts', external: ['react', 'react/jsx-runtime', 'react-dom', '@forma-ui/core', /^@forma-ui\/core\//], plugins: [nodeResolve(), typescript({ tsconfig: './tsconfig.json', declaration: false, declarationMap: false })], output: [{ file: 'dist/index.js', format: 'es', sourcemap: true }, { file: 'dist/index.cjs', format: 'cjs', exports: 'named', sourcemap: true }] };
