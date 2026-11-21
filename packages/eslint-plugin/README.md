# @forma-ui/eslint-plugin

ESLint 9 flat-config rules for common accessibility regressions in JSX.

## Install

```bash
pnpm add -D eslint @forma-ui/eslint-plugin
```

## Configure (ESLint 9 flat config)

```js
import forma from '@forma-ui/eslint-plugin';

export default [forma.configs.recommended];
```

## Rules

- `button-type`: require an explicit type on native JSX buttons.
- `no-positive-tabindex`: reject positive static `tabIndex` values.
- `no-aria-hidden-focusable`: flag native focusable elements, positive tab stops, or autofocus elements hidden with `aria-hidden`.

Static analysis cannot prove accessibility. Dynamic expressions, custom elements, spread attributes, and component abstractions may require manual review and runtime tests.
