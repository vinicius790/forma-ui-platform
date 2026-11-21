# SSR, hydration and framework integration recipes

Forma UI keeps its behavioral controllers separate from framework rendering so the same state contract can be adapted to different lifecycle models. The safe default is to create pure state during render/setup, attach DOM elements only after they exist, and dispose every observer, timer, layer or subscription when the overlay/component leaves the page.

## Server-rendered React and Next.js

- `@forma-ui/core` can be imported by server modules when only pure helpers are used. Do not call focus, portal, scroll-lock or positioning methods without a mounted element.
- Hooks such as `useDialog`, `useMenu` and `useSelect` belong in client components. Add `'use client'` at the appropriate client-component boundary in Next.js App Router.
- Keep deterministic IDs within the component lifecycle. Do not generate random identifiers during render.
- Use `useFormaStore` to subscribe to a `@forma-ui/forms` controller or another compatible store. Ensure the store is created at the component/application scope, not as an accidental module-global shared form.

## Vue 3, Nuxt and SSR

- Use composables inside `setup()`/`<script setup>` and let the adapter register `onBeforeUnmount` cleanup.
- Bind refs to DOM nodes through the composable's returned ref; do not query the document during server rendering.
- Render portal/Teleport content only when the modal is open and the destination exists.
- Use `useFormaStore` for an external controller snapshot. Avoid mutating the same nested value object in place; replace values immutably so shallow reactivity can observe transitions.

## Svelte 5 and SvelteKit

- Create stores during component initialization when they are instance-specific.
- DOM actions such as `focusTrap` and `portal` run only after the node is mounted; keep them out of module-level SSR code.
- Subscribe to a FormController via `fromFormaStore`. Destroy controllers that own timers or global listeners when the component is destroyed.
- SvelteKit server modules may be shared across requests: never place a user-specific form/controller in a server module singleton.

## SolidJS

- Create signal bindings inside a Solid owner scope so `onCleanup` can release subscriptions.
- Use `fromFormaStore` to bridge an external snapshot source into an accessor.
- Attach element refs from the component and create DOM-dependent behavior only after the node exists.
- The adapter currently targets the SolidJS 1.x API surface; Solid 2 compatibility is not certified by this repository's CI matrix.

## Lit and Web Components

- Use `FormaControllerBridge` in a Lit host to connect a subscribable controller to `requestUpdate()`.
- The bridge subscribes in `hostConnected()` and unsubscribes in `hostDisconnected()`; call `destroy()` if the controller itself has resources to release.
- Dispatch composed custom events when state changes need to cross a shadow boundary. Keep accessible names, keyboard behavior and focus management in the custom element implementation.

## Angular

- Call `ownFormaController`, `createFormaControllerBinding` or `fromFormaStore` from an Angular injection context so `DestroyRef` can own teardown.
- The current package is a signal/lifecycle bridge, not a complete set of Angular Material-style components or directives.
- Keep `@angular/core` as a peer dependency; do not pull Angular into consumers of the core package.

## Astro and islands

- Use the core in client-side island code or vanilla scripts after hydration.
- Treat dialogs, menus and comboboxes as interactive islands; static server HTML alone does not provide their keyboard/focus behavior.
- Do not initialize global listeners before the island is visible or when a page transition could leave stale resources behind.

## Styling and build tools

- Vite, Rollup and esbuild can consume ESM entry points and tree-shake component subpaths.
- Tailwind CSS v4 uses the optional `@forma-ui/tailwind/styles.css` `@theme` layer, while Tailwind v3 can extend its theme with `createFormaTailwindTheme()`; UnoCSS uses the explicit `presetForma()` preset.
- CSS Modules, vanilla-extract, Sass and hand-authored CSS can consume the same tokens without a dedicated runtime bridge.
- The tokens package emits CSS variables and DTCG-compatible JSON; consumers should review the generated token names and preserve their own semantic token taxonomy.

## External form validation

The forms package deliberately does not import a schema library. Convert schema issues into `{ fieldName: 'message' }` errors inside `validate(values)`. This works with Zod, Valibot, Yup, custom server validation or a handwritten validator without forcing consumers to install all of them.

## Lifecycle checklist

- [ ] Only create DOM-dependent behavior after the relevant node is mounted and measurable.
- [ ] Only attach Floating UI auto-updates while the floating element is visible.
- [ ] Remove event listeners and subscriptions on unmount/disconnect.
- [ ] Cancel or invalidate stale async validation and position results.
- [ ] Do not share request/user-specific controllers across server requests.
- [ ] Test hydration, keyboard interaction and focus restoration in the actual framework runtime.
