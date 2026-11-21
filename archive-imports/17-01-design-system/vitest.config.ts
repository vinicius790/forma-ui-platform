import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@forma-ui/tokens': path.resolve(__dirname, 'packages/tokens/src/index.ts'),
      '@forma-ui/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
      '@forma-ui/themes': path.resolve(__dirname, 'packages/themes/src/index.ts'),
      '@forma-ui/react': path.resolve(__dirname, 'packages/react/src/index.ts'),
      '@forma-ui/vue': path.resolve(__dirname, 'packages/vue/src/index.ts'),
      '@forma-ui/svelte': path.resolve(__dirname, 'packages/svelte/src/index.ts'),
      '@forma-ui/a11y-testing': path.resolve(__dirname, 'packages/a11y-testing/src/index.ts'),
      '@forma-ui/codemods': path.resolve(__dirname, 'packages/codemods/src/index.ts')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['packages/**/*.test.{ts,tsx}', 'apps/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['packages/*/src/**/*.{ts,tsx}']
    }
  }
});
