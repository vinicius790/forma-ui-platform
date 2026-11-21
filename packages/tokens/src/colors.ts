export const primitiveColors = {
  gray: ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#020617'],
  blue: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  red: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
  green: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'],
  amber: ['#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
} as const;

export const semanticColors = {
  light: { surface: '#ffffff', surfaceRaised: '#ffffff', text: '#0f172a', textMuted: '#475569', border: '#cbd5e1', focus: '#2563eb', primary: '#1d4ed8', danger: '#b91c1c', success: '#15803d', warning: '#92400e' },
  dark: { surface: '#0f172a', surfaceRaised: '#1e293b', text: '#f8fafc', textMuted: '#cbd5e1', border: '#475569', focus: '#93c5fd', primary: '#93c5fd', danger: '#fca5a5', success: '#86efac', warning: '#fcd34d' },
} as const;
export type SemanticColorName = keyof typeof semanticColors.light;
