export interface FormFieldIds { id: string; labelId: string; descriptionId: string; errorId: string }
export function createFormFieldIds(id: string): FormFieldIds { const base = id.trim() || 'forma-field'; return { id: base, labelId: `${base}-label`, descriptionId: `${base}-description`, errorId: `${base}-error` }; }
export interface FormFieldOptions extends FormFieldIds { invalid?: boolean; required?: boolean; disabled?: boolean; description?: boolean; describedBy?: string }
export function getFormControlProps(options: FormFieldOptions) { const describedBy = [options.description ? options.descriptionId : undefined, options.describedBy, options.invalid ? options.errorId : undefined].filter(Boolean).join(' ') || undefined; return { id: options.id, 'aria-labelledby': options.labelId, 'aria-describedby': describedBy, 'aria-invalid': options.invalid || undefined, 'aria-required': options.required || undefined, 'aria-disabled': options.disabled || undefined, disabled: options.disabled }; }
export function getFormLabelProps(options: FormFieldIds) { return { id: options.labelId, htmlFor: options.id }; }
export function getFormDescriptionProps(options: FormFieldIds) { return { id: options.descriptionId }; }
export function getFormErrorProps(options: FormFieldIds) { return { id: options.errorId, role: 'alert' as const, 'aria-live': 'polite' as const }; }
