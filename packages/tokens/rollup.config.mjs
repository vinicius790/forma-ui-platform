import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
export default { input: { index: 'src/index.ts', colors: 'src/colors.ts', contrast: 'src/contrast.ts', 'css-vars': 'src/css-vars.ts' }, plugins: [nodeResolve(), typescript({ tsconfig: './tsconfig.json', declaration: false, declarationMap: false })], output: [{ dir: 'dist', format: 'es', preserveModules: true, preserveModulesRoot: 'src' }, { dir: 'dist', format: 'cjs', preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].cjs', exports: 'named' }] };
