import { composeEventHandlers, dataAttr } from '../primitives/dom.js';

export type ButtonElementType = 'button' | 'a' | 'div' | 'span';

export interface ButtonOptions {
  elementType?: ButtonElementType;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  pressed?: boolean;
  onPress?: (event: MouseEvent | KeyboardEvent) => void;
}

export interface ButtonProps {
  role?: 'button';
  type?: 'button' | 'submit' | 'reset';
  tabIndex?: number;
  disabled?: boolean;
  'aria-disabled'?: boolean;
  'aria-busy'?: boolean;
  'aria-pressed'?: boolean;
  'data-forma-button': '';
  'data-disabled'?: '';
  'data-loading'?: '';
  'data-state'?: 'pressed' | 'unpressed' | 'idle';
  onClick: (event: MouseEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export function getButtonProps(
  options: ButtonOptions = {},
  userHandlers: {
    onClick?: (event: MouseEvent) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
  } = {}
): ButtonProps {
  const {
    elementType = 'button',
    type = 'button',
    disabled = false,
    loading = false,
    pressed,
    onPress
  } = options;

  const isNativeButton = elementType === 'button';
  const isInactive = disabled || loading;

  const handleClick = composeEventHandlers<MouseEvent>(userHandlers.onClick, (event) => {
    if (isInactive) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onPress?.(event);
  });

  const handleKeyDown = composeEventHandlers<KeyboardEvent>(userHandlers.onKeyDown, (event) => {
    if (isInactive) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    // Non-native button elements (e.g., <a role="button">, <div role="button">) must activate on Enter & Space
    if (!isNativeButton && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onPress?.(event);
    }
  });

  const state: 'pressed' | 'unpressed' | 'idle' =
    typeof pressed === 'boolean' ? (pressed ? 'pressed' : 'unpressed') : 'idle';

  return {
    ...(isNativeButton ? { type, disabled } : { role: 'button' as const, tabIndex: disabled ? -1 : 0 }),
    ...(isInactive ? { 'aria-disabled': true } : {}),
    ...(loading ? { 'aria-busy': true } : {}),
    ...(typeof pressed === 'boolean' ? { 'aria-pressed': pressed } : {}),
    'data-forma-button': '',
    'data-disabled': dataAttr(disabled),
    'data-loading': dataAttr(loading),
    'data-state': state,
    onClick: handleClick,
    onKeyDown: handleKeyDown
  };
}
