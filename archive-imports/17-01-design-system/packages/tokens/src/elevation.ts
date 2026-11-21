export const radiiTokens = {
  none: '0px',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px'
} as const;

export const shadowTokens = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(15, 23, 42, 0.06)',
  md: '0 4px 12px -2px rgba(15, 23, 42, 0.10)',
  lg: '0 12px 24px -4px rgba(15, 23, 42, 0.14)',
  overlay: '0 20px 38px -8px rgba(2, 6, 23, 0.25)'
} as const;

export const zIndexTokens = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600
} as const;

export const motionTokens = {
  duration: {
    instant: '0ms',
    fast: '120ms',
    normal: '200ms',
    slow: '320ms'
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)'
  }
} as const;
