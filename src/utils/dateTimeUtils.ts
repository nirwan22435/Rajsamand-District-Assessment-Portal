/**
 * Standard Indian Standard Time (IST, UTC+05:30) Date & Time Utilities
 * Official Standard for Rajsamand District Administration Portal
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Safely parse any date input to a valid Date instance
 */
export function parseToDate(dateInput?: string | number | Date | null): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? new Date() : dateInput;
  }
  const parsed = new Date(dateInput);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Format date & time into standard Indian Standard Time (IST)
 * Example: "10 Sep 2026, 03:05 PM IST"
 */
export function formatISTDateTime(
  dateInput?: string | number | Date | null,
  options?: {
    includeSeconds?: boolean;
    includeTimezoneSuffix?: boolean;
    monthFormat?: 'short' | 'long' | 'numeric' | '2-digit';
  }
): string {
  const d = parseToDate(dateInput);
  const includeSeconds = options?.includeSeconds ?? false;
  const includeTz = options?.includeTimezoneSuffix ?? true;
  const monthFormat = options?.monthFormat ?? 'short';

  try {
    const formatted = d.toLocaleString('en-IN', {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: monthFormat,
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true,
    });

    return includeTz ? `${formatted} IST` : formatted;
  } catch (err) {
    return d.toLocaleString('en-IN') + (includeTz ? ' IST' : '');
  }
}

/**
 * Format date only into standard IST
 * Example: "10 Sep 2026" or "10 September 2026"
 */
export function formatISTDate(
  dateInput?: string | number | Date | null,
  monthFormat: 'short' | 'long' | '2-digit' = 'short'
): string {
  const d = parseToDate(dateInput);
  try {
    return d.toLocaleDateString('en-IN', {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: monthFormat,
      year: 'numeric',
    });
  } catch (err) {
    return d.toLocaleDateString('en-IN');
  }
}

/**
 * Format time only into standard IST
 * Example: "03:05 PM IST"
 */
export function formatISTTime(
  dateInput?: string | number | Date | null,
  options?: { includeSeconds?: boolean; includeTimezoneSuffix?: boolean }
): string {
  const d = parseToDate(dateInput);
  const includeSeconds = options?.includeSeconds ?? false;
  const includeTz = options?.includeTimezoneSuffix ?? true;

  try {
    const timeStr = d.toLocaleTimeString('en-IN', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true,
    });

    return includeTz ? `${timeStr} IST` : timeStr;
  } catch (err) {
    return d.toLocaleTimeString('en-IN') + (includeTz ? ' IST' : '');
  }
}

/**
 * Get YYYY-MM-DD in IST timezone.
 * Essential for accurate exam date filtering across timezones.
 */
export function getISTDateKey(dateInput?: string | number | Date | null): string {
  const d = parseToDate(dateInput);
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d); // Outputs YYYY-MM-DD
  } catch (err) {
    return d.toISOString().slice(0, 10);
  }
}

/**
 * Standardized format for official district reports and scorecards.
 * Example: "10 September 2026 at 03:05 PM IST"
 */
export function formatISTOfficialReportDate(dateInput?: string | number | Date | null): string {
  const d = parseToDate(dateInput);
  const dateStr = formatISTDate(d, 'long');
  const timeStr = formatISTTime(d, { includeSeconds: false, includeTimezoneSuffix: true });
  return `${dateStr} at ${timeStr}`;
}
