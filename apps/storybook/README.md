# Forma UI — Storybook

An isolated component workshop powered by Storybook 10, Lit 3 and the Storybook accessibility addon.

```bash
pnpm install
pnpm --filter @forma-ui/storybook storybook
pnpm --filter @forma-ui/storybook build-storybook
```

Stories are organized by core behavior, forms/controls, data/productivity and feedback. They cover Dialog, Tabs, Switch, Listbox, TreeView, NumberField, PinInput, Checkbox, Radio Group, Accordion, Slider, Command Palette, Data Grid, Toast and native progress examples. The app resolves workspace source aliases for the core, commands and Data Grid packages, so the workshop can run before publishing tarballs. The a11y addon is a developer aid, not a WCAG certification mechanism. Keep browser E2E and manual assistive-technology testing as independent release gates.
