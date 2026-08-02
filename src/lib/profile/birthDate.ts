/**
 * Helpers for the optional birth-date field on registration.
 *
 * The app has no date-picker dependency, so the field is a plain numeric text
 * input. These helpers keep what the user types in the `YYYY-MM-DD` shape the
 * API expects and reject impossible dates before a request is ever made.
 */

const MAX_AGE_YEARS = 120;

/**
 * Format digits as the user types: `19900514` -> `1990-05-14`.
 *
 * Non-digits are stripped, so pasting an already-formatted date is a no-op and
 * the caller can feed the result straight back into the input value.
 */
export function formatBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 4) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

/**
 * True when `value` is a real calendar date in the past and within living
 * memory. Rejects things `new Date()` would silently roll over, such as
 * `2023-02-30`, by round-tripping the parsed parts.
 */
export function isValidBirthDate(value: string, today: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  // Date rolls invalid days forward (Feb 30 -> Mar 2), so compare the parts back.
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return false;
  }

  const startOfToday = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  if (parsed.getTime() >= startOfToday) {
    return false;
  }

  const oldest = Date.UTC(
    today.getUTCFullYear() - MAX_AGE_YEARS,
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  return parsed.getTime() > oldest;
}
