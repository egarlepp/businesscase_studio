/** Currencies offered in the Profile selector. Imports accept any valid ISO 4217 code. */
export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'NZD',
  'CHF',
  'JPY',
  'SEK',
  'NOK',
  'DKK',
  'INR',
  'SGD',
  'BRL',
  'MXN',
  'ZAR',
] as const;

export const DEFAULT_CURRENCY = 'USD';
const LOCALE = 'en-US';

/** Returns an upper-case ISO 4217 code that Intl accepts, or the default currency. */
export function normalizeCurrency(code: unknown): string {
  if (typeof code !== 'string') return DEFAULT_CURRENCY;
  const upper = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(upper)) return DEFAULT_CURRENCY;
  try {
    new Intl.NumberFormat(LOCALE, { style: 'currency', currency: upper });
    return upper;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export interface Formatters {
  currency: string;
  currencySymbol: string;
  money: (value: number) => string;
  /** Compact form for chart axes, e.g. "$120K". */
  moneyCompact: (value: number) => string;
  percent: (value: number) => string;
  number: (value: number) => string;
  months: (value: number | null) => string;
}

export function createFormatters(currencyCode: string): Formatters {
  const currency = normalizeCurrency(currencyCode);
  const money = new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
  const compact = new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  const percent = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 1 });
  const number = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
  const currencySymbol =
    money.formatToParts(0).find((part) => part.type === 'currency')?.value ?? currency;
  return {
    currency,
    currencySymbol,
    money: (v) => money.format(v),
    moneyCompact: (v) => compact.format(v),
    percent: (v) => percent.format(v),
    number: (v) => number.format(v),
    months: (v) => (v === null ? 'Not reached' : `${v.toFixed(1)} mo.`),
  };
}
