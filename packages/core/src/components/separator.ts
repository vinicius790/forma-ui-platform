export interface SeparatorOptions { orientation?: 'horizontal' | 'vertical'; decorative?: boolean }
export function getSeparatorProps(options: SeparatorOptions = {}) { const decorative = options.decorative ?? true; return { role: decorative ? 'none' as const : 'separator' as const, 'aria-orientation': decorative ? undefined : options.orientation ?? 'horizontal' }; }
