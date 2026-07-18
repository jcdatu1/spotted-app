/** Space Mono "boarding-pass" formatting for day-granular trip dates.
 *  Inputs are YYYY-MM-DD strings; parsing avoids Date-object timezone shifts. */

const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const;

function parts(iso: string): { year: number; month: string; day: number } {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month: MONTHS[month - 1] ?? '???', day };
}

/** '2026-02-12' → 'FEB 12 2026'. */
export function formatTripDate(iso: string): string {
  const d = parts(iso);
  return `${d.month} ${d.day} ${d.year}`;
}

/** Inclusive day count of a trip: '2026-02-08' → '2026-02-24' = 17.
 *  UTC parse on both ends keeps the difference timezone-proof. */
export function tripDayCount(startIso: string, endIso: string): number {
  const ms = Date.parse(`${endIso}T00:00:00Z`) - Date.parse(`${startIso}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

/** Collapses shared month/year: 'FEB 12–26 2026', 'FEB 12 – MAR 3 2026',
 *  'DEC 28 2025 – JAN 4 2026'. */
export function formatTripRange(startIso: string, endIso: string): string {
  const start = parts(startIso);
  const end = parts(endIso);
  if (start.year === end.year && start.month === end.month) {
    if (start.day === end.day) return formatTripDate(startIso);
    return `${start.month} ${start.day}–${end.day} ${start.year}`;
  }
  if (start.year === end.year) {
    return `${start.month} ${start.day} – ${end.month} ${end.day} ${start.year}`;
  }
  return `${formatTripDate(startIso)} – ${formatTripDate(endIso)}`;
}
