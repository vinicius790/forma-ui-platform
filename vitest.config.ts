import { defineConfig } from 'vitest/config';

const sharedExclude = [
  '**/node_modules/**',
  '**/dist/**',
  '**/dist-cjs/**',
  'archive-imports/**',
  '**/archive-imports/**',
];

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: sharedExclude,
    restoreMocks: true,
    clearMocks: true,
    testTimeout: 10_000,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['packages/**/src/**/*.test.{ts,tsx}'],
          exclude: sharedExclude,
        },
      },
      {
        extends: true,
        test: {
          name: 'a11y',
          include: ['packages/**/src/**/*.a11y.test.ts', 'apps/docs/src/docs.test.ts'],
          exclude: sharedExclude,
        },
      },
    ],
  },
});
