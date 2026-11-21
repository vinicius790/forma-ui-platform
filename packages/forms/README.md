# @forma-ui/forms

A framework-neutral form state engine that complements the core's accessible field-ID helpers. It provides typed top-level field values, touched/dirty state, asynchronous validation, submit lifecycle, reset helpers, and field props that link labels, descriptions and errors through the same contracts used by `@forma-ui/core`.

## Install

```bash
pnpm add @forma-ui/core @forma-ui/forms
```

## Create a typed form

```ts
import { createFormController } from '@forma-ui/forms';

type Values = { email: string; marketing: boolean };
const form = createFormController<Values>({
  formId: 'account',
  initialValues: { email: '', marketing: false },
  validate: ({ email }) => email.includes('@') ? {} : { email: 'Enter a valid email address.' },
  onSubmit: async (values) => saveAccount(values),
});
```

Compose with native HTML:

```ts
const emailProps = form.getFieldProps('email', { type: 'email', required: true, description: true });
const labelProps = form.getFieldLabelProps('email');
const descriptionProps = form.getFieldDescriptionProps('email');
const errorProps = form.getFieldErrorProps('email');
```

```html
<label id="account-email-label" for="account-email">Email</label>
<input id="account-email" name="email" type="email" required aria-describedby="account-email-description">
<p id="account-email-description">Used for account notifications.</p>
<p id="account-email-error" role="alert" aria-live="polite" hidden></p>
```

Apply the returned event handlers/attributes in your framework rather than copying the example HTML literally. The controller is framework-neutral; it does not render inputs, own focus, submit a network request or ship validation messages.

## Behavior and lifecycle

- `validateOn` supports `change`, `blur`, `submit` (default) and `never`.
- Async validation is revision-guarded: stale results cannot overwrite newer validation state.
- `submit()` touches every field, validates, prevents duplicate concurrent submissions and returns `true` only after a successful submit handler.
- `getSnapshot()` returns a stable immutable snapshot until the next state transition; `subscribe()` supports framework external-store patterns.
- `resetForm()` resets to the initial or supplied baseline. Dirty checking is shallow (`Object.is`) and fields are top-level keys; replace nested objects/arrays immutably.
- `destroy()` is idempotent and invalidates pending validations.

Zod, Valibot, Yup or custom schema validators can be connected through the `validate(values)` function without making any schema library a mandatory dependency. Map a schema's issues to `FormErrors` in the application layer.

This package is intentionally not a full nested form DSL. For nested data, arrays, field arrays, wizard flows or server actions, build a typed adapter on top of this controller or use a dedicated form library when it better matches the application.

Field `aria-describedby` only references a description element when `getFieldProps(name, { description: true })` is requested; validation error IDs are added automatically while an error is present. Render error text from `getFieldState(name).error` and use `getFieldErrorProps(name)` for its accessible container attributes.
