export interface TextFieldOptions {
  id: string;
  labelId?: string;
  descriptionId?: string;
  errorId?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  description?: boolean;
  errorMessage?: string;
  describedBy?: string;
  multiline?: boolean;
}
export function getTextFieldProps(options: TextFieldOptions) {
  const describedBy = [options.description ? options.descriptionId : undefined, options.describedBy, options.invalid && options.errorMessage ? options.errorId : undefined]
    .filter((value): value is string => Boolean(value?.trim())).join(' ') || undefined;
  return {
    id: options.id,
    'aria-labelledby': options.labelId,
    'aria-describedby': describedBy,
    'aria-invalid': options.invalid || undefined,
    'aria-required': options.required || undefined,
    'aria-disabled': options.disabled || undefined,
    'aria-readonly': options.readOnly || undefined,
    disabled: options.disabled,
    readOnly: options.readOnly,
    required: options.required,
    'data-invalid': options.invalid ? '' : undefined,
  };
}
export function getTextFieldErrorProps(options: Pick<TextFieldOptions, 'errorId' | 'invalid'>) {
  return { id: options.errorId, role: options.invalid ? 'alert' as const : undefined, 'aria-live': options.invalid ? 'polite' as const : undefined, hidden: !options.invalid };
}
