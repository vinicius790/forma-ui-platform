import {
  addDays,
  addMonths,
  compareISODate,
  daysInMonth,
  getDayOfWeek,
  getMonthGrid,
  parseISODate,
  toISODate,
  type CalendarDay,
  type ISODate,
} from './index';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  readonly start: string;
  readonly freq: RecurrenceFrequency;
  readonly interval?: number;
  readonly count?: number;
  readonly until?: string;
  /** Zero-based Gregorian weekdays: 0 = Sunday .. 6 = Saturday. */
  readonly byWeekday?: readonly number[];
}

const DEFAULT_UNBOUNDED_LIMIT = 365;
const MAX_UNTIL_SAFETY_LIMIT = 10_000;
const MAX_SCAN_STEPS = 50_000;
const MS_PER_DAY = 86_400_000;

function normalizeWeekdays(byWeekday?: readonly number[]): number[] | null {
  if (!byWeekday || byWeekday.length === 0) return null;
  const unique = new Set<number>();
  for (const day of byWeekday) {
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new RangeError('byWeekday entries must be integers between 0 (Sunday) and 6 (Saturday).');
    }
    unique.add(day);
  }
  return [...unique].sort((a, b) => a - b);
}

/**
 * Deterministic Gregorian RRULE expander using timezone-free ISO dates.
 */
export function expandRecurrence(rule: RecurrenceRule): ISODate[] {
  const startParts = parseISODate(rule.start);
  if (!startParts) throw new RangeError('expandRecurrence expects a valid YYYY-MM-DD start date.');

  let untilIso: ISODate | null = null;
  if (rule.until !== undefined) {
    const untilParts = parseISODate(rule.until);
    if (!untilParts) throw new RangeError('expandRecurrence expects a valid YYYY-MM-DD until date.');
    untilIso = toISODate(untilParts);
  }

  const interval = rule.interval ?? 1;
  if (!Number.isInteger(interval) || interval < 1) {
    throw new RangeError('expandRecurrence interval must be a positive integer.');
  }

  if (rule.count !== undefined) {
    if (!Number.isFinite(rule.count) || rule.count <= 0) return [];
  }

  const startIso = toISODate(startParts);
  if (untilIso && compareISODate(startIso, untilIso) > 0) return [];

  const maxCount =
    rule.count !== undefined
      ? Math.floor(rule.count)
      : untilIso !== null
        ? MAX_UNTIL_SAFETY_LIMIT
        : DEFAULT_UNBOUNDED_LIMIT;

  const weekdays = normalizeWeekdays(rule.byWeekday);
  const weekdaySet = weekdays ? new Set(weekdays) : null;
  const results: ISODate[] = [];

  const pushCandidate = (candidate: ISODate): 'continue' | 'stop' => {
    if (compareISODate(candidate, startIso) < 0) return 'continue';
    if (untilIso && compareISODate(candidate, untilIso) > 0) return 'stop';
    results.push(candidate);
    return results.length >= maxCount ? 'stop' : 'continue';
  };

  try {
    switch (rule.freq) {
      case 'daily': {
        for (let step = 0; results.length < maxCount && step < MAX_SCAN_STEPS; step += 1) {
          const candidate = addDays(startIso, step * interval);
          if (untilIso && compareISODate(candidate, untilIso) > 0) break;
          if (!weekdaySet || weekdaySet.has(getDayOfWeek(candidate))) {
            if (pushCandidate(candidate) === 'stop') break;
          }
        }
        break;
      }

      case 'weekly': {
        if (!weekdays) {
          for (let step = 0; results.length < maxCount && step < MAX_SCAN_STEPS; step += 1) {
            const candidate = addDays(startIso, step * 7 * interval);
            if (pushCandidate(candidate) === 'stop') break;
          }
        } else {
          const startDow = getDayOfWeek(startIso);
          for (let week = 0; results.length < maxCount && week < MAX_SCAN_STEPS; week += 1) {
            let exceededUntil = false;
            for (const wd of weekdays) {
              const delta = week * 7 * interval + (wd - startDow);
              if (delta < 0) continue;
              const candidate = addDays(startIso, delta);
              const state = pushCandidate(candidate);
              if (state === 'stop') {
                exceededUntil = true;
                break;
              }
            }
            if (exceededUntil) break;
          }
        }
        break;
      }

      case 'monthly': {
        if (!weekdaySet) {
          for (let step = 0; results.length < maxCount && step < MAX_SCAN_STEPS; step += 1) {
            const candidate = addMonths(startIso, step * interval);
            if (pushCandidate(candidate) === 'stop') break;
          }
        } else {
          const baseMonth = toISODate({ year: startParts.year, month: startParts.month, day: 1 });
          for (let step = 0; results.length < maxCount && step < MAX_SCAN_STEPS; step += 1) {
            const monthStart = addMonths(baseMonth, step * interval);
            if (untilIso && compareISODate(monthStart, untilIso) > 0) break;
            const monthParts = parseISODate(monthStart);
            if (!monthParts) break;
            const totalDays = daysInMonth(monthParts.year, monthParts.month);
            let done = false;
            for (let dayOffset = 0; dayOffset < totalDays; dayOffset += 1) {
              const candidate = addDays(monthStart, dayOffset);
              if (untilIso && compareISODate(candidate, untilIso) > 0) {
                done = true;
                break;
              }
              if (weekdaySet.has(getDayOfWeek(candidate))) {
                if (pushCandidate(candidate) === 'stop') {
                  done = true;
                  break;
                }
              }
            }
            if (done) break;
          }
        }
        break;
      }

      case 'yearly': {
        if (!weekdaySet) {
          for (let step = 0; results.length < maxCount && step < MAX_SCAN_STEPS; step += 1) {
            const candidate = addMonths(startIso, step * 12 * interval);
            if (pushCandidate(candidate) === 'stop') break;
          }
        } else {
          for (let step = 0; results.length < maxCount && step < MAX_SCAN_STEPS; step += 1) {
            const year = startParts.year + step * interval;
            if (year > 9999) break;
            const yearStart = toISODate({ year, month: 1, day: 1 });
            if (untilIso && compareISODate(yearStart, untilIso) > 0) break;
            const yearEnd = toISODate({ year, month: 12, day: 31 });
            let cursor: ISODate = step === 0 ? startIso : yearStart;
            let done = false;
            while (compareISODate(cursor, yearEnd) <= 0) {
              if (untilIso && compareISODate(cursor, untilIso) > 0) {
                done = true;
                break;
              }
              if (weekdaySet.has(getDayOfWeek(cursor))) {
                if (pushCandidate(cursor) === 'stop') {
                  done = true;
                  break;
                }
              }
              if (cursor === yearEnd) break;
              cursor = addDays(cursor, 1);
            }
            if (done) break;
          }
        }
        break;
      }
    }
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
  }

  return results;
}

export interface MonthGridOptions {
  locale?: string;
  firstDayOfWeek?: number;
  fixedWeeks?: boolean;
  selected?: string;
  today?: string;
  min?: string;
  max?: string;
  isDateDisabled?: (date: ISODate) => boolean;
}

export interface MultiMonthGrid {
  readonly month: ISODate;
  readonly year: number;
  readonly monthNumber: number;
  readonly weeks: CalendarDay[][];
}

/**
 * Generates `monthCount` adjacent calendar month grids starting at `startMonth`.
 */
export function getMultiMonthGrids(
  startMonth: string,
  monthCount: number,
  options: MonthGridOptions = {},
): MultiMonthGrid[] {
  const parts = parseISODate(startMonth);
  if (!parts) throw new RangeError('startMonth must be a valid YYYY-MM-DD date.');
  const count = Number.isFinite(monthCount) ? Math.max(0, Math.floor(monthCount)) : 0;
  if (count === 0) return [];

  const anchor = toISODate({ year: parts.year, month: parts.month, day: 1 });
  const grids: MultiMonthGrid[] = [];
  for (let i = 0; i < count; i += 1) {
    const month = addMonths(anchor, i);
    const monthParts = parseISODate(month)!;
    grids.push({
      month,
      year: monthParts.year,
      monthNumber: monthParts.month,
      weeks: getMonthGrid(month, options),
    });
  }
  return grids;
}

function toUtcEpochDay(year: number, month: number, day: number): number {
  const value = new Date(0);
  value.setUTCHours(0, 0, 0, 0);
  value.setUTCFullYear(year, month - 1, day);
  return Math.round(value.getTime() / MS_PER_DAY);
}

/**
 * Returns the exact signed calendar day difference `a - b` between two YYYY-MM-DD dates.
 * Positive when `a > b`, negative when `a < b`, and `0` when equal.
 */
export function diffISODates(a: string, b: string): number {
  const left = parseISODate(a);
  const right = parseISODate(b);
  if (!left || !right) throw new RangeError('diffISODates expects valid YYYY-MM-DD values.');
  const diff = toUtcEpochDay(left.year, left.month, left.day) - toUtcEpochDay(right.year, right.month, right.day);
  return diff === 0 ? 0 : diff;
}

/**
 * Formats a relative day offset (e.g. -1 -> "yesterday", 0 -> "today", 3 -> "in 3 days")
 * using `Intl.RelativeTimeFormat`.
 */
export function formatRelativeDays(
  days: number,
  locale = 'en',
  options: Intl.RelativeTimeFormatOptions = { numeric: 'auto' },
): string {
  if (!Number.isFinite(days)) throw new RangeError('formatRelativeDays expects a finite number of days.');
  const value = Math.trunc(days);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', ...options });
  return formatter.format(value === 0 ? 0 : value, 'day');
}
