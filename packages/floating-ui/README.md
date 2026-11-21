# @forma-ui/floating-ui

Optional geometry adapter based on [Floating UI](https://floating-ui.com/docs/computeposition). The core package retains a small built-in positioner; this adapter is for applications that need collision-aware placement, automatic updates and size constraints for dialogs, menus, selects, tooltips and popovers.

## Install

```bash
pnpm add @forma-ui/core @forma-ui/floating-ui @floating-ui/dom
```

## Connect an overlay

```ts
import { connectFloatingPosition } from '@forma-ui/floating-ui';

const cleanup = connectFloatingPosition(trigger, popover, {
  placement: 'bottom-start',
  offset: 8,
  flip: true,
  shift: true,
  matchReferenceWidth: true,
  constrainHeight: true,
  onPosition({ placement }) {
    popover.dataset['placement'] = placement;
  },
});

// When the overlay closes or unmounts:
cleanup.destroy();
```

`connectFloatingPosition()` uses `autoUpdate()` while mounted and runs an asynchronous `computePosition()` guarded against stale results after rapid updates or teardown. `destroy()` is idempotent, stops observers/listeners and restores the style properties and placement attributes it changed.

Options include logical `placement`, `strategy`, `offset`, `flip`, `shift`, `shiftPadding`, `matchReferenceWidth`, `constrainHeight`, optional `arrowElement`, and update flags for ancestor scrolling/resizing, element resizing and layout shifts. `onPosition`, `onReferenceHidden` and `onError` are optional callbacks.

The floating element must be mounted, measurable and visible when connected. Only connect while the overlay is open; auto-update observers should not remain active for hidden overlays. The adapter owns geometry only: the consuming application still owns roles, names, keyboard behavior, focus management and dismissal. Never treat positioning as a substitute for the Dialog/Menu/Tooltip/Combobox accessibility contract.

`@floating-ui/dom` is a peer dependency, not a dependency of `@forma-ui/core`. This keeps geometry optional and tree-shakeable.
