export const colorScale = {
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  },
  brand: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81'
  },
  success: {
    50: '#ecfdf5',
    500: '#10b981',
    600: '#059669',
    700: '#047857'
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309'
  },
  danger: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c'
  },
  info: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  }
} as const;

export interface SemanticColorTokens {
  bgCanvas: string;
  bgSurface: string;
  bgSurfaceSubtle: string;
  bgSurfaceHover: string;
  bgOverlay: string;
  fgPrimary: string;
  fgSecondary: string;
  fgMuted: string;
  fgInverse: string;
  borderDefault: string;
  borderStrong: string;
  accentPrimary: string;
  accentPrimaryHover: string;
  accentSubtle: string;
  focusRing: string;
  statusSuccess: string;
  statusWarning: string;
  statusDanger: string;
  statusInfo: string;
}

export const semanticColorsLight: SemanticColorTokens = {
  bgCanvas: colorScale.neutral[0],
  bgSurface: colorScale.neutral[50],
  bgSurfaceSubtle: colorScale.neutral[100],
  bgSurfaceHover: colorScale.neutral[200],
  bgOverlay: 'rgba(2, 6, 23, 0.52)',
  fgPrimary: colorScale.neutral[900],
  fgSecondary: colorScale.neutral[700],
  fgMuted: colorScale.neutral[500],
  fgInverse: colorScale.neutral[0],
  borderDefault: colorScale.neutral[200],
  borderStrong: colorScale.neutral[400],
  accentPrimary: colorScale.brand[600],
  accentPrimaryHover: colorScale.brand[700],
  accentSubtle: colorScale.brand[50],
  focusRing: colorScale.brand[500],
  statusSuccess: colorScale.success[600],
  statusWarning: colorScale.warning[600],
  statusDanger: colorScale.danger[600],
  statusInfo: colorScale.info[600]
};
