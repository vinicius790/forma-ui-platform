export type ButtonType = 'button' | 'submit' | 'reset';
export interface ButtonOptions { disabled?: boolean; loading?: boolean; type?: ButtonType; name?: string; value?: string }
export function getButtonProps(options: ButtonOptions = {}) {
  const disabled = Boolean(options.disabled);
  return {
    type: options.type ?? 'button',
    disabled,
    'aria-busy': options.loading ? true : undefined,
    'data-disabled': disabled ? '' : undefined,
    'data-loading': options.loading ? '' : undefined,
    ...(options.name ? { name: options.name } : {}),
    ...(options.value !== undefined ? { value: options.value } : {}),
  } as const;
}
