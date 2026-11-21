import '../src/stories/showcase.css';

const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true },
    a11y: {
      // Keep findings visible in the addon panel. Release gates run separately in CI.
      manual: false,
    },
    backgrounds: {
      options: {
        light: { name: 'Light', value: '#ffffff' },
        dark: { name: 'Dark', value: '#16181d' },
        contrast: { name: 'High contrast', value: '#000000' },
      },
    },
  },
  globalTypes: {
    direction: {
      description: 'Document direction',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: ['ltr', 'rtl'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story: () => unknown, context: { globals: { direction?: string } }) => {
      document.documentElement.dir = context.globals.direction === 'rtl' ? 'rtl' : 'ltr';
      return story();
    },
  ],
};

export default preview;
