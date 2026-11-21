import { createFormFieldIds, getFormControlProps, getFormLabelProps } from '@forma-ui/core/components/form-field';

export type FieldName<Values extends object> = Extract<keyof Values, string>;
export type FormErrors<Values extends object> = Partial<Record<FieldName<Values>, string>>;
export type FormTouched<Values extends object> = Partial<Record<FieldName<Values>, boolean>>;
export type ValidationMode = 'change' | 'blur' | 'submit' | 'never';

export interface FormHelpers<Values extends object> {
  setFieldValue<Name extends FieldName<Values>>(name: Name, value: Values[Name]): void;
  setFieldError<Name extends FieldName<Values>>(name: Name, error?: string): void;
  setErrors(errors: FormErrors<Values>): void;
  resetForm(values?: Values): void;
}

export interface FormOptions<Values extends object> {
  initialValues: Values;
  validate?: (values: Readonly<Values>) => FormErrors<Values> | Promise<FormErrors<Values>>;
  validateOn?: ValidationMode;
  onSubmit: (values: Readonly<Values>, helpers: FormHelpers<Values>) => void | Promise<void>;
  onSubmitError?: (error: unknown) => void;
  formId?: string;
}

export interface FormSnapshot<Values extends object> {
  values: Readonly<Values>;
  errors: Readonly<FormErrors<Values>>;
  touched: Readonly<FormTouched<Values>>;
  dirtyFields: readonly FieldName<Values>[];
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isValidating: boolean;
  submitCount: number;
  submissionError?: unknown;
}

export interface FieldPropsOptions {
  type?: 'text' | 'number' | 'checkbox' | 'radio' | 'email' | 'search' | 'password' | 'tel' | 'url' | 'date';
  value?: unknown;
  required?: boolean;
  disabled?: boolean;
  description?: boolean;
}

interface InputTargetLike {
  value?: unknown;
  checked?: boolean;
  type?: string;
}
interface InputEventLike {
  target?: InputTargetLike | null;
  currentTarget?: InputTargetLike | null;
}

function cloneValues<Values extends object>(values: Values): Values {
  return { ...values };
}

function hasErrors<Values extends object>(errors: FormErrors<Values>): boolean {
  return Object.values(errors).some((error) => typeof error === 'string' && error.length > 0);
}

/**
 * Small framework-neutral form state manager. It intentionally handles only
 * top-level field keys; nested paths and schema-library APIs stay in adapters.
 */
export class FormController<Values extends object> {
  private options: FormOptions<Values>;
  private initialValues: Values;
  private values: Values;
  private errors: FormErrors<Values> = {};
  private touched: FormTouched<Values> = {};
  private isSubmitting = false;
  private isValidating = false;
  private submitCount = 0;
  private submissionError: unknown;
  private validationRevision = 0;
  private activeValidation?: Promise<Readonly<FormErrors<Values>>>;
  private destroyed = false;
  private listeners = new Set<() => void>();
  private snapshot: FormSnapshot<Values>;

  constructor(options: FormOptions<Values>) {
    this.options = { validateOn: 'submit', ...options };
    this.initialValues = cloneValues(options.initialValues);
    this.values = cloneValues(options.initialValues);
    this.snapshot = this.createSnapshot();
  }

  updateOptions(options: Partial<Omit<FormOptions<Values>, 'initialValues'>>): void {
    this.assertActive();
    this.options = { ...this.options, ...options };
  }

  getSnapshot = (): FormSnapshot<Values> => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.assertActive();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getFieldState<Name extends FieldName<Values>>(name: Name) {
    return {
      value: this.values[name],
      error: this.errors[name],
      touched: this.touched[name] ?? false,
      dirty: !Object.is(this.values[name], this.initialValues[name]),
    };
  }

  setFieldValue<Name extends FieldName<Values>>(name: Name, value: Values[Name], validate = true): void {
    this.assertActive();
    if (Object.is(this.values[name], value)) return;
    this.values = { ...this.values, [name]: value };
    this.submissionError = undefined;
    this.publish();
    if (validate && this.options.validateOn === 'change') void this.validate();
  }

  setFieldTouched<Name extends FieldName<Values>>(name: Name, touched = true, validate = true): void {
    this.assertActive();
    if (this.touched[name] === touched) return;
    this.touched = { ...this.touched, [name]: touched };
    this.publish();
    if (validate && touched && this.options.validateOn === 'blur') void this.validate();
  }

  setFieldError<Name extends FieldName<Values>>(name: Name, error?: string): void {
    this.assertActive();
    const next = { ...this.errors };
    if (error) next[name] = error;
    else delete next[name];
    this.errors = next;
    this.publish();
  }

  setErrors(errors: FormErrors<Values>): void {
    this.assertActive();
    this.errors = { ...errors };
    this.publish();
  }

  async validate(): Promise<Readonly<FormErrors<Values>>> {
    this.assertActive();
    const validator = this.options.validate;
    if (!validator) return this.errors;

    const revision = ++this.validationRevision;
    const values = cloneValues(this.values);
    this.isValidating = true;
    this.publish();
    const task = Promise.resolve()
      .then(() => validator(values))
      .then((result) => {
        if (!this.destroyed && revision === this.validationRevision) {
          this.errors = { ...result };
        }
        return this.errors;
      })
      .finally(() => {
        if (!this.destroyed && revision === this.validationRevision) {
          this.isValidating = false;
          this.activeValidation = undefined;
          this.publish();
        }
      });
    this.activeValidation = task;
    return task;
  }

  async validateField<Name extends FieldName<Values>>(name: Name): Promise<string | undefined> {
    await this.validate();
    return this.errors[name];
  }

  getFieldProps<Name extends FieldName<Values>>(
    name: Name,
    options: FieldPropsOptions = {},
  ) {
    const fieldId = `${this.options.formId ?? 'forma'}-${name}`;
    const ids = createFormFieldIds(fieldId);
    const error = this.errors[name];
    const ariaProps = getFormControlProps({
      ...ids,
      invalid: Boolean(error),
      required: options.required,
      disabled: options.disabled,
      description: options.description,
    });
    const value = this.values[name];
    return {
      ...ariaProps,
      name,
      value: options.type === 'checkbox' || options.type === 'radio'
        ? undefined
        : value === null || value === undefined ? '' : String(value),
      checked: options.type === 'checkbox' ? Boolean(value) : options.type === 'radio' ? Object.is(value, options.value) : undefined,
      required: options.required,
      disabled: options.disabled,
      onChange: (event: InputEventLike) => this.readInputEvent(name, event, options.type, options.value),
      onInput: (event: InputEventLike) => this.readInputEvent(name, event, options.type, options.value),
      onBlur: () => this.setFieldTouched(name, true),
    };
  }

  getFieldLabelProps<Name extends FieldName<Values>>(name: Name) {
    const ids = createFormFieldIds(`${this.options.formId ?? 'forma'}-${name}`);
    return getFormLabelProps(ids);
  }

  getFieldDescriptionProps<Name extends FieldName<Values>>(name: Name) {
    return { id: `${this.options.formId ?? 'forma'}-${name}-description` };
  }

  getFieldErrorProps<Name extends FieldName<Values>>(name: Name) {
    const error = this.errors[name];
    return {
      id: `${this.options.formId ?? 'forma'}-${name}-error`,
      role: 'alert' as const,
      'aria-live': 'polite' as const,
      hidden: !error,
    };
  }

  getFormProps() {
    return {
      noValidate: true,
      onSubmit: (event?: { preventDefault?: () => void }) => {
        event?.preventDefault?.();
        void this.submit();
      },
    };
  }

  async submit(): Promise<boolean> {
    this.assertActive();
    if (this.isSubmitting) return false;
    this.submitCount += 1;
    this.isSubmitting = true;
    this.submissionError = undefined;
    const submittedValues = cloneValues(this.values);
    const names = Object.keys(this.values) as FieldName<Values>[];
    this.touched = Object.fromEntries(names.map((name) => [name, true])) as FormTouched<Values>;
    this.publish();

    try {
      await this.validate();
      while (!this.destroyed && this.isValidating && this.activeValidation) await this.activeValidation;
      if (this.destroyed || !this.sameValues(submittedValues, this.values) || hasErrors(this.errors)) return false;
      await this.options.onSubmit(submittedValues, this.helpers());
      return true;
    } catch (error) {
      if (!this.destroyed) {
        this.submissionError = error;
        this.options.onSubmitError?.(error);
        this.publish();
      }
      return false;
    } finally {
      if (!this.destroyed) {
        this.isSubmitting = false;
        this.publish();
      }
    }
  }

  resetForm(values?: Values): void {
    this.assertActive();
    this.validationRevision += 1;
    this.activeValidation = undefined;
    this.initialValues = cloneValues(values ?? this.initialValues);
    this.values = cloneValues(this.initialValues);
    this.errors = {};
    this.touched = {};
    this.isSubmitting = false;
    this.isValidating = false;
    this.submitCount = 0;
    this.submissionError = undefined;
    this.publish();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.validationRevision += 1;
    this.activeValidation = undefined;
    this.isValidating = false;
    this.isSubmitting = false;
    this.listeners.clear();
  }

  private readInputEvent<Name extends FieldName<Values>>(
    name: Name,
    event: InputEventLike,
    configuredType?: FieldPropsOptions['type'],
    configuredValue?: unknown,
  ): void {
    const target = event.currentTarget ?? event.target;
    if (!target) return;
    const type = configuredType ?? target.type;
    let next: unknown = target.value;
    if (type === 'checkbox') next = Boolean(target.checked);
    else if (type === 'radio') {
      if (!target.checked) return;
      next = configuredValue ?? target.value;
    }
    else if (type === 'number') {
      const numeric = Number(target.value);
      next = target.value === '' || !Number.isFinite(numeric) ? '' : numeric;
    }
    this.setFieldValue(name, next as Values[Name]);
  }

  private helpers(): FormHelpers<Values> {
    return {
      setFieldValue: (name, value) => this.setFieldValue(name, value),
      setFieldError: (name, error) => this.setFieldError(name, error),
      setErrors: (errors) => this.setErrors(errors),
      resetForm: (values) => this.resetForm(values),
    };
  }

  private createSnapshot(): FormSnapshot<Values> {
    const fields = Object.keys(this.values) as FieldName<Values>[];
    const dirtyFields = fields.filter((name) => !Object.is(this.values[name], this.initialValues[name]));
    return Object.freeze({
      values: Object.freeze(cloneValues(this.values)),
      errors: Object.freeze({ ...this.errors }),
      touched: Object.freeze({ ...this.touched }),
      dirtyFields: Object.freeze(dirtyFields),
      isDirty: dirtyFields.length > 0,
      isValid: !hasErrors(this.errors),
      isSubmitting: this.isSubmitting,
      isValidating: this.isValidating,
      submitCount: this.submitCount,
      ...(this.submissionError === undefined ? {} : { submissionError: this.submissionError }),
    });
  }

  private publish(): void {
    this.snapshot = this.createSnapshot();
    for (const listener of [...this.listeners]) listener();
  }

  private sameValues(left: Values, right: Values): boolean {
    const keys = Object.keys(left) as FieldName<Values>[];
    return keys.length === Object.keys(right).length && keys.every((key) => Object.is(left[key], right[key]));
  }

  private assertActive(): void {
    if (this.destroyed) throw new Error('Forma UI FormController has been destroyed.');
  }
}

export function createFormController<Values extends object>(options: FormOptions<Values>): FormController<Values> {
  return new FormController(options);
}
export { isStandardSchema, standardSchemaToValidator, validateWithStandardSchema } from './standard-schema';
export type { StandardSchemaIssue, StandardSchemaResult, StandardSchemaV1, StandardSchemaValidation } from './standard-schema';

export * from './arrays-and-wizard';
export * from './computed-and-schema';
