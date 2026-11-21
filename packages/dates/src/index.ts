import type { Direction } from '@forma-ui/core';

/** A timezone-free Gregorian calendar date represented as YYYY-MM-DD. */
export type ISODate = string & { readonly __isoDate: unique symbol };
export interface DateParts { year: number; month: number; day: number }
export interface CalendarDay { date: ISODate; day: number; inCurrentMonth: boolean; disabled: boolean; selected: boolean; today: boolean }

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/u;
const utcDate = (year: number, monthIndex: number, day: number): Date => {
  const value = new Date(0);
  value.setUTCHours(0, 0, 0, 0);
  value.setUTCFullYear(year, monthIndex, day);
  return value;
};

export function parseISODate(value: string): DateParts | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  if (year < 1 || year > 9999 || month < 1 || month > 12) return null;
  const date = utcDate(year, month - 1, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { year, month, day };
}

export function toISODate(parts: DateParts): ISODate {
  const value = `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  if (!parseISODate(value)) throw new RangeError(`Invalid ISO date: ${value}`);
  return value as ISODate;
}

export function todayISODate(now = new Date()): ISODate {
  return toISODate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
}

export function compareISODate(a: string, b: string): number {
  const left = parseISODate(a); const right = parseISODate(b);
  if (!left || !right) throw new RangeError('compareISODate expects valid YYYY-MM-DD values.');
  return a === b ? 0 : a < b ? -1 : 1;
}

export function daysInMonth(year: number, month: number): number {
  if (year < 1 || year > 9999 || month < 1 || month > 12) throw new RangeError('Invalid year or month.');
  return utcDate(year, month, 0).getUTCDate();
}

export function addDays(value: string, amount: number): ISODate {
  const parts = parseISODate(value);
  if (!parts || !Number.isInteger(amount)) throw new RangeError('addDays expects a valid date and an integer offset.');
  const date = utcDate(parts.year, parts.month - 1, parts.day + amount);
  return toISODate({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
}

export function addMonths(value: string, amount: number): ISODate {
  const parts = parseISODate(value);
  if (!parts || !Number.isInteger(amount)) throw new RangeError('addMonths expects a valid date and an integer offset.');
  const absoluteMonth = parts.year * 12 + parts.month - 1 + amount;
  const year = Math.floor(absoluteMonth / 12);
  const month = ((absoluteMonth % 12) + 12) % 12 + 1;
  if (year < 1 || year > 9999) throw new RangeError('Resulting date is outside the supported year range.');
  return toISODate({ year, month, day: Math.min(parts.day, daysInMonth(year, month)) });
}

export function getDayOfWeek(value: string): number {
  const parts = parseISODate(value);
  if (!parts) throw new RangeError('getDayOfWeek expects a valid date.');
  return utcDate(parts.year, parts.month - 1, parts.day).getUTCDay();
}

export function getFirstDayOfWeek(locale: string, fallback?: number): number {
  if (fallback !== undefined) return ((Math.floor(fallback) % 7) + 7) % 7;
  // Invalid or unavailable locale data falls back to the CLDR world default.
  // Intl.Locale.getWeekInfo is used when the runtime exposes it.
  let localeObject: (Intl.Locale & { getWeekInfo?: () => { firstDay: number } }) | undefined;
  try { localeObject = new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number } }; }
  catch { localeObject = undefined; }
  const region = localeObject?.maximize().region ?? '001';
  const info = localeObject?.getWeekInfo?.();
  if (info) return info.firstDay % 7;
  const territory = region ?? '001';
  const sundayFirst = new Set(['AG', 'AS', 'BD', 'BR', 'BS', 'BT', 'BW', 'BZ', 'CA', 'CO', 'DM', 'DO', 'ET', 'GT', 'GU', 'HK', 'HN', 'ID', 'IL', 'IN', 'IS', 'JM', 'JP', 'KE', 'KH', 'KR', 'LA', 'MH', 'MM', 'MO', 'MT', 'MX', 'MZ', 'NI', 'NP', 'PA', 'PE', 'PH', 'PK', 'PR', 'PT', 'PY', 'SA', 'SG', 'SV', 'TH', 'TT', 'TW', 'UM', 'US', 'VE', 'VI', 'WS', 'YE', 'ZA', 'ZW']);
  const saturdayFirst = new Set(['AF', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'IR', 'JO', 'KW', 'LY', 'OM', 'QA', 'SD', 'SY']);
  if (territory === 'MV') return 5;
  if (saturdayFirst.has(territory)) return 6;
  return sundayFirst.has(territory) ? 0 : 1;
}

export function getMonthGrid(
  month: string,
  options: { locale?: string; firstDayOfWeek?: number; fixedWeeks?: boolean; selected?: string; today?: string; min?: string; max?: string; isDateDisabled?: (date: ISODate) => boolean } = {},
): CalendarDay[][] {
  const parts = parseISODate(month);
  if (!parts) throw new RangeError('month must be a valid ISO date.');
  const first = toISODate({ year: parts.year, month: parts.month, day: 1 });
  const offset = (getDayOfWeek(first) - getFirstDayOfWeek(options.locale ?? 'en-US', options.firstDayOfWeek) + 7) % 7;
  const count = daysInMonth(parts.year, parts.month);
  const rows = options.fixedWeeks ? 6 : Math.ceil((offset + count) / 7);
  const start = addDays(first, -offset);
  const days = Array.from({ length: rows * 7 }, (_, index) => {
    const date = addDays(start, index);
    const dateParts = parseISODate(date)!;
    const disabled = (options.min && compareISODate(date, options.min) < 0)
      || (options.max && compareISODate(date, options.max) > 0)
      || Boolean(options.isDateDisabled?.(date));
    return {
      date,
      day: dateParts.day,
      inCurrentMonth: dateParts.year === parts.year && dateParts.month === parts.month,
      disabled: Boolean(disabled),
      selected: options.selected === date,
      today: options.today === date,
    };
  });
  return Array.from({ length: rows }, (_, index) => days.slice(index * 7, index * 7 + 7));
}

export function formatISODate(value: string, locale: string, options: Intl.DateTimeFormatOptions = {}): string {
  const parts = parseISODate(value);
  if (!parts) throw new RangeError('formatISODate expects a valid date.');
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', ...options, timeZone: 'UTC' }).format(utcDate(parts.year, parts.month - 1, parts.day));
}

export interface CalendarOptions {
  value?: string;
  defaultValue?: string;
  focusedDate?: string;
  defaultFocusedDate?: string;
  min?: string;
  max?: string;
  locale?: string;
  direction?: Direction;
  firstDayOfWeek?: number;
  today?: string;
  isDateDisabled?: (date: ISODate) => boolean;
  onValueChange?: (value: ISODate) => void;
  onFocusedDateChange?: (value: ISODate) => void;
}

/** Calendar interaction model. Consumers render the returned grid/day props using their preferred markup. */
export class CalendarController {
  private options: CalendarOptions;
  private internalValue?: string;
  private internalFocused: string;
  private dayButtons = new Map<string, HTMLButtonElement>();
  constructor(options: CalendarOptions = {}) {
    this.options = { locale: 'en-US', direction: 'ltr', ...options };
    this.internalValue = options.defaultValue;
    this.internalFocused = options.defaultFocusedDate ?? options.focusedDate ?? options.defaultValue ?? options.today ?? todayISODate();
    if (!parseISODate(this.internalFocused)) throw new RangeError('Calendar focusedDate must be a valid ISO date.');
  }
  get value(): string | undefined { return this.options.value ?? this.internalValue; }
  get focusedDate(): ISODate { return (this.options.focusedDate ?? this.internalFocused) as ISODate; }
  get visibleMonth(): ISODate { const parts = parseISODate(this.focusedDate)!; return toISODate({ ...parts, day: 1 }); }
  updateOptions(options: Partial<CalendarOptions>): void { this.options = { ...this.options, ...options }; }
  getGrid(): CalendarDay[][] { return getMonthGrid(this.visibleMonth, { locale: this.options.locale, firstDayOfWeek: this.options.firstDayOfWeek, fixedWeeks: true, selected: this.value, today: this.options.today ?? todayISODate(), min: this.options.min, max: this.options.max, isDateDisabled: this.options.isDateDisabled }); }
  isDisabled(date: string): boolean {
    return Boolean((this.options.min && compareISODate(date, this.options.min) < 0)
      || (this.options.max && compareISODate(date, this.options.max) > 0)
      || this.options.isDateDisabled?.(date as ISODate));
  }
  focusDate(date: string): void { if (!parseISODate(date) || this.isDisabled(date)) return; this.commitFocused(date as ISODate); this.dayButtons.get(date)?.focus(); }
  registerDayButton(date: string, element: HTMLButtonElement | null): () => void {
    if (element) this.dayButtons.set(date, element);
    else this.dayButtons.delete(date);
    return () => { if (this.dayButtons.get(date) === element) this.dayButtons.delete(date); };
  }
  destroy(): void { this.dayButtons.clear(); }
  selectDate(date: string): void {
    if (!parseISODate(date) || this.isDisabled(date)) return;
    const value = date as ISODate;
    if (this.options.value === undefined) this.internalValue = value;
    this.options.onValueChange?.(value);
    this.commitFocused(value);
  }
  getGridProps(label?: string) { return { role: 'grid' as const, 'aria-label': label, 'aria-multiselectable': undefined }; }
  getDayCellProps(date: string) { const disabled = this.isDisabled(date); return { role: 'gridcell' as const, 'aria-selected': this.value === date, 'aria-disabled': disabled || undefined, 'data-outside-month': !date.startsWith(this.visibleMonth.slice(0, 7)) ? '' : undefined }; }
  getDayButtonProps(date: string) {
    const disabled = this.isDisabled(date);
    return { type: 'button' as const, disabled, tabIndex: this.focusedDate === date ? 0 : -1, 'aria-label': formatISODate(date, this.options.locale ?? 'en-US', { dateStyle: 'full' }), 'aria-current': (this.options.today ?? todayISODate()) === date ? 'date' as const : undefined, 'data-selected': this.value === date ? '' : undefined, ref: (element: HTMLButtonElement | null) => this.registerDayButton(date, element), onFocus: () => this.focusDate(date), onClick: () => this.selectDate(date), onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event) };
  }
  private commitFocused(value: ISODate): void { if (this.options.focusedDate === undefined) this.internalFocused = value; this.options.onFocusedDateChange?.(value); }
  private onKeyDown(event: KeyboardEvent): void {
    const current = this.focusedDate;
    const rtl = this.options.direction === 'rtl';
    let next: string | null = null;
    switch (event.key) {
      case 'ArrowLeft': next = addDays(current, rtl ? 1 : -1); break;
      case 'ArrowRight': next = addDays(current, rtl ? -1 : 1); break;
      case 'ArrowUp': next = addDays(current, -7); break;
      case 'ArrowDown': next = addDays(current, 7); break;
      case 'Home': { const first = getFirstDayOfWeek(this.options.locale ?? 'en-US', this.options.firstDayOfWeek); next = addDays(current, -((getDayOfWeek(current) - first + 7) % 7)); break; }
      case 'End': { const first = getFirstDayOfWeek(this.options.locale ?? 'en-US', this.options.firstDayOfWeek); next = addDays(current, 6 - ((getDayOfWeek(current) - first + 7) % 7)); break; }
      case 'PageUp': next = addMonths(current, event.shiftKey ? -12 : -1); break;
      case 'PageDown': next = addMonths(current, event.shiftKey ? 12 : 1); break;
      case 'Enter': case ' ': event.preventDefault(); this.selectDate(current); return;
      default: return;
    }
    event.preventDefault();
    if (next) {
      const direction = event.key;
      let candidate = next;
      if (this.isDisabled(candidate)) {
        const step = direction === 'ArrowLeft'
          ? (rtl ? 1 : -1)
          : direction === 'ArrowRight'
            ? (rtl ? -1 : 1)
            : direction === 'ArrowUp'
              ? -7
              : direction === 'ArrowDown'
                ? 7
                : 0;
        if (step) for (let attempt = 0; attempt < 366 && this.isDisabled(candidate); attempt += 1) candidate = addDays(candidate, step);
      }
      if (!this.isDisabled(candidate)) this.focusDate(candidate);
    }
  }
}
export function createCalendarController(options: CalendarOptions = {}): CalendarController { return new CalendarController(options); }

export * from './range-and-time';
export * from './recurrence-and-relative';
