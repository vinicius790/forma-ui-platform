import { defineMain } from '@storybook/web-components-vite/node';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { mergeConfig } from 'vite';

const root = fileURLToPath(new URL('../../..', import.meta.url));

export default defineMain({
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: '@storybook/web-components-vite',
  viteFinal: async (config) => mergeConfig(config, {
    resolve: {
      alias: {
        '@forma-ui/core': resolve(root, 'packages/core/src/index.ts'),
        '@forma-ui/commands': resolve(root, 'packages/commands/src/index.ts'),
        '@forma-ui/data-grid': resolve(root, 'packages/data-grid/src/index.ts'),
      },
    },
  }),
});
