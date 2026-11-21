import { addDays, compareISODate, parseISODate, type ISODate } from './index';

/** Computes the ISO-8601 week number (1..53) for a YYYY-MM-DD date. */
export function getISOWeekNumber(value: string): number {
  const parts = parseISODate(value);
  if (!parts) throw new RangeError('getISOWeekNumber expects a valid YYYY-MM-DD date.');
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export interface DateRangeValue {
  start: ISODate | null;
  end: ISODate | null;
}

export interface DateRangeOptions {
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  min?: string;
  max?: string;
  onValueChange?: (range: DateRangeValue) => void;
}

export class DateRangeController {
  private options: DateRangeOptions;
  private internal: DateRangeValue;
  private hovered: ISODate | null = null;

  constructor(options: DateRangeOptions = {}) {
    this.options = { ...options };
    this.internal = options.defaultValue ?? { start: null, end: null };
  }

  get value(): DateRangeValue {
    return this.options.value ?? this.internal;
  }

  get hoveredDate(): ISODate | null {
    return this.hovered;
  }

  setHoveredDate(date: string | null): void {
    this.hovered = date && parseISODate(date) ? (date as ISODate) : null;
  }

  selectDate(date: string): void {
    if (!parseISODate(date)) return;
    if (this.options.min && compareISODate(date, this.options.min) < 0) return;
    if (this.options.max && compareISODate(date, this.options.max) > 0) return;
    const iso = date as ISODate;
    const current = this.value;
    let next: DateRangeValue;
    if (!current.start || (current.start && current.end)) {
      next = { start: iso, end: null };
    } else if (compareISODate(iso, current.start) < 0) {
      next = { start: iso, end: current.start };
    } else {
      next = { start: current.start, end: iso };
    }
    if (this.options.value === undefined) this.internal = next;
    this.options.onValueChange?.(next);
  }

  isInRange(date: string): boolean {
    if (!parseISODate(date)) return false;
    const { start, end } = this.value;
    const effectiveEnd = end ?? this.hovered;
    if (!start || !effectiveEnd) return false;
    const [low, high] = compareISODate(start, effectiveEnd) <= 0 ? [start, effectiveEnd] : [effectiveEnd, start];
    return compareISODate(date, low) >= 0 && compareISODate(date, high) <= 0;
  }

  getDaysCount(): number {
    const { start, end } = this.value;
    if (!start || !end) return 0;
    let count = 1;
    let cursor: string = start;
    while (compareISODate(cursor, end) < 0 && count < 36600) {
      cursor = addDays(cursor, 1);
      count += 1;
    }
    return count;
  }

  clear(): void {
    const empty: DateRangeValue = { start: null, end: null };
    if (this.options.value === undefined) this.internal = empty;
    this.hovered = null;
    this.options.onValueChange?.(empty);
  }
}

export function createDateRangeController(options: DateRangeOptions = {}): DateRangeController {
  return new DateRangeController(options);
}

export interface TimeValue {
  hours: number;
  minutes: number;
}

export interface TimePickerOptions {
  value?: TimeValue;
  defaultValue?: TimeValue;
  hourCycle?: 12 | 24;
  minuteStep?: number;
  disabled?: boolean;
  onValueChange?: (value: TimeValue) => void;
}

export class TimePickerController {
  private options: TimePickerOptions;
  private internal: TimeValue;

  constructor(options: TimePickerOptions = {}) {
    this.options = { hourCycle: 24, minuteStep: 1, ...options };
    this.internal = this.normalize(options.defaultValue ?? { hours: 9, minutes: 0 });
  }

  private normalize(t: TimeValue): TimeValue {
    const hours = ((Math.trunc(t.hours) % 24) + 24) % 24;
    const minutes = ((Math.trunc(t.minutes) % 60) + 60) % 60;
    return { hours, minutes };
  }

  get value(): TimeValue {
    return this.normalize(this.options.value ?? this.internal);
  }

  get formatted(): string {
    const { hours, minutes } = this.value;
    const mm = String(minutes).padStart(2, '0');
    if (this.options.hourCycle === 12) {
      const period = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      return `${String(h12).padStart(2, '0')}:${mm} ${period}`;
    }
    return `${String(hours).padStart(2, '0')}:${mm}`;
  }

  setTime(next: Partial<TimeValue>): void {
    if (this.options.disabled) return;
    const merged = this.normalize({ ...this.value, ...next });
    if (this.options.value === undefined) this.internal = merged;
    this.options.onValueChange?.(merged);
  }

  stepHours(delta: number): void {
    this.setTime({ hours: this.value.hours + delta });
  }

  stepMinutes(delta: number): void {
    const step = Math.max(1, this.options.minuteStep ?? 1);
    const total = this.value.hours * 60 + this.value.minutes + delta * step;
    const wrapped = ((total % 1440) + 1440) % 1440;
    this.setTime({ hours: Math.floor(wrapped / 60), minutes: wrapped % 60 });
  }

  getHourSpinbuttonProps() {
    return {
      role: 'spinbutton' as const,
      'aria-label': 'Hours',
      'aria-valuemin': 0,
      'aria-valuemax': 23,
      'aria-valuenow': this.value.hours,
      tabIndex: this.options.disabled ? -1 : 0,
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === 'ArrowUp') { e.preventDefault(); this.stepHours(1); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); this.stepHours(-1); }
        else if (e.key === 'Home') { e.preventDefault(); this.setTime({ hours: 0 }); }
        else if (e.key === 'End') { e.preventDefault(); this.setTime({ hours: 23 }); }
      },
    };
  }

  getMinuteSpinbuttonProps() {
    return {
      role: 'spinbutton' as const,
      'aria-label': 'Minutes',
      'aria-valuemin': 0,
      'aria-valuemax': 59,
      'aria-valuenow': this.value.minutes,
      tabIndex: this.options.disabled ? -1 : 0,
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === 'ArrowUp') { e.preventDefault(); this.stepMinutes(1); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); this.stepMinutes(-1); }
        else if (e.key === 'Home') { e.preventDefault(); this.setTime({ minutes: 0 }); }
        else if (e.key === 'End') { e.preventDefault(); this.setTime({ minutes: 59 }); }
      },
    };
  }
}

export function createTimePickerController(options: TimePickerOptions = {}): TimePickerController {
  return new TimePickerController(options);
}
