# @forma-ui/solid

SolidJS 1.x signal bindings for selected Forma UI controllers. The package is optional and keeps `solid-js` as a peer dependency.

```tsx
import { createCheckbox, fromFormaStore } from '@forma-ui/solid';

function TermsCheckbox() {
  const checkbox = createCheckbox({ defaultChecked: false });
  return (
    <label>
      <input type="checkbox" checked={checkbox.value()} onChange={() => checkbox.toggle()} />
      Accept terms
    </label>
  );
}

// Subscribe to a framework-neutral form/controller snapshot within an owner scope.
const snapshot = fromFormaStore(formController);
```

Available controller bindings: checkbox, switch, disclosure, pagination and slider. `fromFormaStore()` adapts any `{ subscribe, getSnapshot }` source into an accessor. Helpers use `onCleanup`; call them from a Solid owner scope (normally a component or `createRoot`).

This is a controller bridge, not a catalog of styled Solid components. The core remains responsible for state and ARIA contracts; the consuming component owns markup, accessible names, DOM refs and CSS. The current peer range supports SolidJS 1.x; Solid 2 is not declared compatible or tested by this repository.
