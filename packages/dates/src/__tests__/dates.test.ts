import { describe, expect, it, vi } from 'vitest';
import { addDays, addMonths, CalendarController, compareISODate, daysInMonth, getMonthGrid, parseISODate, toISODate, getFirstDayOfWeek } from '../index';

describe('date-only Gregorian arithmetic', () => {
  it('validates dates and leap years', () => {
    expect(parseISODate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseISODate('2023-02-29')).toBeNull();
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
  });
  it('adds days and months without local-timezone drift', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2024-03-31', -1)).toBe('2024-02-29');
  });
  it('compares and serializes strict ISO dates', () => {
    expect(compareISODate('2025-01-01', '2025-01-02')).toBe(-1);
    expect(toISODate({ year: 2025, month: 1, day: 2 })).toBe('2025-01-02');
  });
  it('uses region-specific CLDR week starts and fallback table when Intl.Locale weekInfo is unavailable', () => {
    expect(getFirstDayOfWeek('pt-BR')).toBe(0);
    expect(getFirstDayOfWeek('en-US')).toBe(0);
    expect(getFirstDayOfWeek('en-GB')).toBe(1);
    expect(getFirstDayOfWeek('ar-EG')).toBe(6);
    expect(getFirstDayOfWeek('dv-MV')).toBe(5);
    expect(getFirstDayOfWeek('not_a_locale_###')).toBe(1);
    const descriptor = Object.getOwnPropertyDescriptor(Intl.Locale.prototype, 'getWeekInfo');
    try {
      Object.defineProperty(Intl.Locale.prototype, 'getWeekInfo', { value: undefined, configurable: true });
      expect(getFirstDayOfWeek('pt-BR')).toBe(0);
      expect(getFirstDayOfWeek('en-GB')).toBe(1);
      expect(getFirstDayOfWeek('ar-EG')).toBe(6);
      expect(getFirstDayOfWeek('dv-MV')).toBe(5);
    } finally {
      if (descriptor) Object.defineProperty(Intl.Locale.prototype, 'getWeekInfo', descriptor);
    }
  });
  it('creates a six-week calendar grid with boundaries', () => {
    const weeks = getMonthGrid('2024-02-01', { locale: 'en-US', fixedWeeks: true, min: '2024-02-10', max: '2024-02-20' });
    expect(weeks).toHaveLength(6);
    expect(weeks.flat()).toHaveLength(42);
    expect(weeks.flat().find((day) => day.date === '2024-02-09')?.disabled).toBe(true);
  });
});

describe('calendar controller', () => {
  it('moves real DOM focus between calendar day buttons', () => {
    const calendar = new CalendarController({ defaultFocusedDate: '2024-02-28' });
    const current = document.createElement('button');
    const next = document.createElement('button');
    document.body.append(current, next);
    calendar.registerDayButton('2024-02-28', current);
    calendar.registerDayButton('2024-02-29', next);
    current.focus();
    calendar.getDayButtonProps('2024-02-28').onKeyDown({ key: 'ArrowRight', preventDefault: vi.fn(), shiftKey: false } as unknown as KeyboardEvent);
    expect(calendar.focusedDate).toBe('2024-02-29');
    expect(document.activeElement).toBe(next);
    calendar.destroy();
    current.remove();
    next.remove();
  });

  it('moves focus by logical day and selects only enabled dates', () => {
    const onValueChange = vi.fn();
    const calendar = new CalendarController({ defaultFocusedDate: '2024-02-28', min: '2024-02-28', max: '2024-03-02', onValueChange });
    const preventDefault = vi.fn();
    calendar.getDayButtonProps('2024-02-28').onKeyDown({ key: 'ArrowRight', preventDefault, shiftKey: false } as unknown as KeyboardEvent);
    expect(calendar.focusedDate).toBe('2024-02-29');
    calendar.selectDate('2024-03-03');
    expect(onValueChange).not.toHaveBeenCalled();
    calendar.selectDate('2024-03-01');
    expect(onValueChange).toHaveBeenCalledWith('2024-03-01');
  });
});
