import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@forma-ui/tokens': path.resolve(__dirname, '../../packages/tokens/src/index.ts'),
      '@forma-ui/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@forma-ui/themes': path.resolve(__dirname, '../../packages/themes/src/index.ts'),
      '@forma-ui/a11y-testing': path.resolve(__dirname, '../../packages/a11y-testing/src/index.ts')
    }
  },
  build: {
    outDir: 'dist',
    target: 'es2022'
  }
});
