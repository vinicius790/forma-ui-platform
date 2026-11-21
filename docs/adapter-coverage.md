# Framework adapter coverage (snapshot 100.0.0)

This matrix reports concrete public exports in each adapter source. “Controller/native” means the core controller can be imported and its prop getters bound by the consumer; it does **not** mean the adapter ships a framework component. A bridge is not component parity.

| Capability | Core | React | Vue 3 | Svelte 5 | Preact | Solid | Lit | Angular |
|---|---|---|---|---|---|---|---|---|
| Button helper/component | Yes | `Button` | Native HTML | Native HTML | Native HTML | Native HTML | Native HTML | Native HTML |
| Dialog / AlertDialog | Yes | `useDialog`, `useAlertDialog` | `useDialog`, `useAlertDialog`, `FDialog` | `createDialogStore`, `createAlertDialogStore` | `useDialog`, `useAlertDialog` | `createDialog`, `createAlertDialog` | Lifecycle bridge | Lifecycle bridge |
| Menu | Yes | `useMenu` | `useMenu` | `createMenuStore` | `useMenu` | `createMenu` | Lifecycle bridge | Lifecycle bridge |
| Tabs | Yes | `useTabs` | `useTabs` | `createTabsStore` | `useTabs` | `createTabs` | Lifecycle bridge | Lifecycle bridge |
| Tooltip | Yes | `useTooltip` | `useTooltip` | `createTooltipStore` | `useTooltip` | `createTooltip` | Lifecycle bridge | Lifecycle bridge |
| Select / MultiSelect | Yes | `useSelect`, `useMultiSelect` | `useSelect`, `useMultiSelect` | `createSelectStore`, `createMultiSelectStore` | `useSelect`, `useMultiSelect` | `createSelect`, `createMultiSelect` | Lifecycle bridge | Lifecycle bridge |
| Combobox | Yes | `useCombobox` | `useCombobox` | `createComboboxStore` | `useCombobox` | `createCombobox` | Lifecycle bridge | Lifecycle bridge |
| Accordion | Yes | `useAccordion` | `useAccordion` | `createAccordionStore` | `useAccordion` | `createAccordion` | Lifecycle bridge | Lifecycle bridge |
| Toast | Yes | `useToasts`, `ToastViewport` | `useToasts` | `createToastStore` | `useToasts` | `createToasts` | Subscription bridge | Signal bridge |
| Checkbox | Yes | `useCheckbox` | `useCheckbox` | `createCheckboxStore` | `useCheckbox` | `createCheckbox` | Native/custom composition | Signal helper |
| Switch | Yes | `useSwitch` | `useSwitch` | `createSwitchStore` | `useSwitch` | `createSwitch` | Native/custom composition | Signal helper |
| Disclosure | Yes | `useDisclosure` | `useDisclosure` | `createDisclosureStore` | `useDisclosure` | `createDisclosure` | Native/custom composition | Signal helper |
| Slider | Yes | `useSlider` | `useSlider` | `createSliderStore` | `useSlider` | `createSlider` | Native/custom composition | Signal helper |
| Pagination | Yes | `usePagination` | `usePagination` | `createPaginationStore` | `usePagination` | `createPagination` | Native/custom composition | Signal helper |
| Listbox | Yes | `useListbox` | `useListbox` | `createListboxStore` | `useListbox` | `createListbox` | Subscription bridge | Signal bridge |
| TreeView | Yes | `useTreeView` | `useTreeView` | `createTreeViewStore` | `useTreeView` | `createTreeView` | Subscription bridge | Signal bridge |
| NumberField | Yes | `useNumberField` | `useNumberField` | `createNumberFieldStore` | `useNumberField` | `createNumberField` | Subscription bridge | Signal bridge |
| SearchField | Yes | `useSearchField` | `useSearchField` | `createSearchFieldStore` | `useSearchField` | `createSearchField` | Subscription bridge | Signal bridge |
| ToggleGroup | Yes | `useToggleGroup` | `useToggleGroup` | `createToggleGroupStore` | `useToggleGroup` | `createToggleGroup` | Subscription bridge | Signal bridge |
| RadioGroup | Yes | `useRadioGroup` | `useRadioGroup` | `createRadioGroupStore` | `useRadioGroup` | `createRadioGroup` | Subscription bridge | Signal bridge |
| PinInput / RatingGroup / Avatar / Toolbar | Yes | Dedicated hooks | Dedicated composables | Dedicated stores | Dedicated hooks | Dedicated signals | Subscription bridge | Signal bridge |
| TextField / Meter / FormField / Progress / Breadcrumb / Separator | Yes | Consumer binds core props | Consumer binds core props | Consumer binds core props | Consumer binds core props | Consumer binds core props | Consumer binds core props | Consumer binds core props |
| External store | Store contracts | `useFormaStore` | `useFormaStore` | `fromFormaStore` | `useFormaStore` | `fromFormaStore` | `FormaControllerBridge` | `fromFormaStore` |

## Status by framework

### React

Exports `Button`, `ToastViewport`, `useFormaStore`, and dedicated hooks across core controllers (`useDialog`, `useAlertDialog`, `useMenu`, `useTabs`, `useTooltip`, `useSelect`, `useMultiSelect`, `useCombobox`, `useAccordion`, `useToasts`, `useCheckbox`, `useSwitch`, `useDisclosure`, `useSlider`, `usePagination`, `useListbox`, `useTreeView`, `useNumberField`, `useSearchField`, `useToggleGroup`, `useRadioGroup`, `usePinInput`, `useRatingGroup`, `useAvatar`, `useToolbar`). Full Vitest execution requires installed workspace `node_modules` (e.g., local NTFS filesystem or CI).

### Vue 3

Exports `FDialog`, `useFormaStore`, and composables across core controllers (`useDialog`, `useAlertDialog`, `useMenu`, `useTabs`, `useSelect`, `useMultiSelect`, `useCombobox`, `useTooltip`, `useAccordion`, `useToasts`, `useCheckbox`, `useSwitch`, `useDisclosure`, `usePagination`, `useSlider`, `useListbox`, `useTreeView`, `useNumberField`, `useSearchField`, `useToggleGroup`, `useRadioGroup`, `usePinInput`, `useRatingGroup`, `useAvatar`, `useToolbar`).

### Svelte 5

Exports `focusTrap`, `portal`, `createPortalHost`, `fromFormaStore`, and stores across core controllers (`createOpenStore`, `createDialogStore`, `createAlertDialogStore`, `createMenuStore`, `createTabsStore`, `createSelectStore`, `createMultiSelectStore`, `createComboboxStore`, `createTooltipStore`, `createAccordionStore`, `createToastStore`, `createCheckboxStore`, `createSwitchStore`, `createDisclosureStore`, `createPaginationStore`, `createSliderStore`, `createListboxStore`, `createTreeViewStore`, `createNumberFieldStore`, `createSearchFieldStore`, `createToggleGroupStore`, `createRadioGroupStore`, `createPinInputStore`, `createRatingGroupStore`, `createAvatarStore`, `createToolbarStore`). Svelte 5 runes and store contracts are not interchangeable; the adapter intentionally uses stores/actions and documents that choice.

### Preact

Exports `useFormaController`, `useFormaStore`, and hooks across core controllers (`useDialog`, `useAlertDialog`, `useMenu`, `useTabs`, `useTooltip`, `useSelect`, `useMultiSelect`, `useCombobox`, `useAccordion`, `useToasts`, `useCheckbox`, `useSwitch`, `useDisclosure`, `usePagination`, `useSlider`, `useListbox`, `useTreeView`, `useNumberField`, `useSearchField`, `useToggleGroup`, `useRadioGroup`, `usePinInput`, `useRatingGroup`, `useAvatar`, `useToolbar`). Preact runtime execution requires installed workspace `node_modules`.

### Solid

Exports `fromFormaStore` and signal bindings across core controllers (`createDialog`, `createAlertDialog`, `createMenu`, `createTabs`, `createTooltip`, `createSelect`, `createMultiSelect`, `createCombobox`, `createAccordion`, `createToasts`, `createCheckbox`, `createSwitch`, `createDisclosure`, `createPagination`, `createSlider`, `createListbox`, `createTreeView`, `createNumberField`, `createSearchField`, `createToggleGroup`, `createRadioGroup`, `createPinInput`, `createRatingGroup`, `createAvatar`, `createToolbar`). Signal wrappers synchronize from controller callbacks and clean up via `onCleanup`.

### Lit / Web Components

Intentionally kept as a lightweight `ReactiveController` lifecycle bridge (`FormaControllerBridge`, `dispatchFormaChange`, `defineOnce`) rather than duplicating prebuilt Web Components. `@forma-ui/core` primitives (`FocusTrap`, `DismissableLayer`, `ariaHideOutside`) now traverse open Shadow DOM trees so custom elements compose cleanly while owning their rendering, labels, and ARIA structure.

### Angular

Intentionally kept as signal and `DestroyRef` ownership helpers (`createFormaSignal`, `ownFormaController`, `createFormaControllerBinding`, `fromFormaStore`) for composing application components rather than re-implementing Angular CDK widgets.

## Adapter contract requirements

1. Keep behavior in core; framework adapters may bridge callbacks, state and refs but must not fork keyboard rules.
2. Ensure controlled options are synchronized when props change; uncontrolled values must not reset on rerender.
3. Register listeners/subscriptions exactly once and release them on unmount/disconnect/destroy.
4. Use each framework's official lifecycle: React effect/ref, Vue scope cleanup, Svelte action/store lifecycle, Solid owner cleanup, Lit `hostConnected`/`hostDisconnected`, Angular `DestroyRef`.
5. Use a shared set of interaction fixtures so every adapter covers the same selected component flows.
6. Update this matrix whenever an adapter public export changes. Do not claim framework runtime or browser E2E pass without running the suites in an environment with installed dependencies (`node_modules`) and Playwright browsers.

## Work remaining for 1.0 parity verification

- Execute full `pnpm vitest`, `rollup`, `tsc`, Storybook, and Playwright interaction suites across all framework adapters in CI / local NTFS workspace with installed `node_modules`.
- Add shared multi-framework browser conformance fixtures across React, Vue, Svelte, Preact, and Solid.
