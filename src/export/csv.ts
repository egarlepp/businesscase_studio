import type { Results } from '../types';

/**
 * Quote a CSV cell when needed. Text cells that start with a spreadsheet formula trigger
 * (= + - @ tab CR) are prefixed with an apostrophe to prevent CSV injection.
 */
export function csvCell(value: string | number): string {
  if (typeof value === 'number') return Number.isFinite(value) ? String(round2(value)) : '';
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** Annual cash flow, year 0 (initial investment) through the horizon. */
export function buildCashFlowCsv(results: Results, currency: string): string {
  const header = [
    'Year',
    `Recurring benefits (${currency})`,
    `One-time benefits (${currency})`,
    `Costs (${currency})`,
    `Net (${currency})`,
    `Discounted net (${currency})`,
    `Cumulative net (${currency})`,
  ];
  const yearZero = [
    0,
    0,
    0,
    results.initialCost,
    -results.initialCost,
    -results.initialCost,
    -results.initialCost,
  ];
  const years = results.annualBreakdown.map((y) => [
    y.year,
    y.benefits - y.oneTimeBenefits,
    y.oneTimeBenefits,
    y.costs,
    y.net,
    y.discountedNet,
    y.cumulativeNet,
  ]);
  return toCsv([header, yearZero, ...years]);
}

/** Trigger a browser download of `content`. */
export function downloadFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** A filesystem-safe slug for export filenames. */
export function fileSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'business-case';
}
