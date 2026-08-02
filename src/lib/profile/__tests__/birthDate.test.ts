import { describe, expect, it } from 'vitest';

import { formatBirthDateInput, isValidBirthDate } from '../birthDate';

const TODAY = new Date(Date.UTC(2026, 7, 1)); // 2026-08-01

describe('formatBirthDateInput', () => {
  it('inserts dashes as digits are typed', () => {
    expect(formatBirthDateInput('1')).toBe('1');
    expect(formatBirthDateInput('1990')).toBe('1990');
    expect(formatBirthDateInput('19900')).toBe('1990-0');
    expect(formatBirthDateInput('199005')).toBe('1990-05');
    expect(formatBirthDateInput('19900514')).toBe('1990-05-14');
  });

  it('is idempotent so an already formatted value can be fed back in', () => {
    expect(formatBirthDateInput('1990-05-14')).toBe('1990-05-14');
  });

  it('strips non-digits and caps the length at a full date', () => {
    expect(formatBirthDateInput('19a90/05.14')).toBe('1990-05-14');
    expect(formatBirthDateInput('199005149999')).toBe('1990-05-14');
  });
});

describe('isValidBirthDate', () => {
  it('accepts a real past date', () => {
    expect(isValidBirthDate('1990-05-14', TODAY)).toBe(true);
  });

  it('accepts a leap day that exists', () => {
    expect(isValidBirthDate('2000-02-29', TODAY)).toBe(true);
  });

  it('rejects a leap day in a non-leap year rather than rolling it over', () => {
    expect(isValidBirthDate('2001-02-29', TODAY)).toBe(false);
  });

  it('rejects impossible calendar days', () => {
    expect(isValidBirthDate('2023-02-30', TODAY)).toBe(false);
    expect(isValidBirthDate('2023-13-01', TODAY)).toBe(false);
    expect(isValidBirthDate('2023-00-10', TODAY)).toBe(false);
  });

  it('rejects incomplete or malformed input', () => {
    expect(isValidBirthDate('', TODAY)).toBe(false);
    expect(isValidBirthDate('1990-05', TODAY)).toBe(false);
    expect(isValidBirthDate('14/05/1990', TODAY)).toBe(false);
  });

  it('rejects today and any future date', () => {
    expect(isValidBirthDate('2026-08-01', TODAY)).toBe(false);
    expect(isValidBirthDate('2026-08-02', TODAY)).toBe(false);
  });

  it('accepts the day before today', () => {
    expect(isValidBirthDate('2026-07-31', TODAY)).toBe(true);
  });

  it('rejects an implausibly old date beyond 120 years', () => {
    expect(isValidBirthDate('1906-08-01', TODAY)).toBe(false);
    expect(isValidBirthDate('1906-08-02', TODAY)).toBe(true);
  });
});
