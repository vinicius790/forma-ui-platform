export interface MeterOptions { value: number; min?: number; max?: number; label?: string; labelledBy?: string; valueText?: string }
export function getMeterProps(options: MeterOptions) {
  const min = Number.isFinite(options.min) ? options.min! : 0;
  const max = Number.isFinite(options.max) && options.max! > min ? options.max! : min + 100;
  const value = Math.min(max, Math.max(min, Number.isFinite(options.value) ? options.value : min));
  return { role: 'meter' as const, 'aria-valuemin': min, 'aria-valuemax': max, 'aria-valuenow': value, 'aria-valuetext': options.valueText, 'aria-label': options.label, 'aria-labelledby': options.labelledBy, 'data-state': value <= min ? 'empty' : value >= max ? 'full' : 'partial' };
}
