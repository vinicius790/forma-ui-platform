# @forma-ui/tailwind

Optional token bridge for utility-first projects. Tailwind CSS v4 users may import `@forma-ui/tailwind/styles.css` to expose the semantic CSS theme variables through `@theme`; Tailwind CSS v3 projects can map the serializable tokens into `theme.extend`. No component styles or resets are imposed.

## Tailwind CSS v4

```css
@import "tailwindcss";
@import "@forma-ui/tailwind/styles.css";
```

Use utilities such as `bg-forma-surface`, `text-forma-text`, `border-forma-border` and `rounded-forma-md`.

## Tailwind CSS v3 configuration

```ts
import { createFormaTailwindTheme } from '@forma-ui/tailwind';

const forma = createFormaTailwindTheme();
export default {
  theme: {
    extend: {
      colors: forma.colors,
      spacing: forma.spacing,
      borderRadius: forma.radius,
    },
  },
};
```

The JavaScript helper is a plain configuration object, not a Tailwind plugin and does not depend on private Tailwind internals.
