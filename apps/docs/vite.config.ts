import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../..', import.meta.url));
export default defineConfig({
  root: resolve(root, 'apps/docs'),
  resolve: { alias: {
    '@forma-ui/core': resolve(root, 'packages/core/src/index.ts'),
    '@forma-ui/themes': resolve(root, 'packages/themes/src/index.ts'),
    '@forma-ui/tokens': resolve(root, 'packages/tokens/src/index.ts'),
    '@forma-ui/a11y-testing': resolve(root, 'packages/a11y-testing/src/index.ts'),
  } },
  server: { port: 5173, strictPort: true },
  build: { outDir: resolve(root, 'apps/docs/dist'), emptyOutDir: true, sourcemap: true },
});
