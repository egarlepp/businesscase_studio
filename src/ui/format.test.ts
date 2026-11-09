import { describe, expect, it } from 'vitest';
import { createFormatters, normalizeCurrency } from './format';

describe('normalizeCurrency', () => {
  it('accepts valid ISO codes case-insensitively', () => {
    expect(normalizeCurrency('eur')).toBe('EUR');
    expect(normalizeCurrency(' GBP ')).toBe('GBP');
  });

  it('falls back to USD for invalid input', () => {
    expect(normalizeCurrency('DOLLARS')).toBe('USD');
    expect(normalizeCurrency('$')).toBe('USD');
    expect(normalizeCurrency(42)).toBe('USD');
  });
});

describe('createFormatters', () => {
  it('formats money in the selected currency', () => {
    expect(createFormatters('USD').money(1234)).toBe('$1,234');
    expect(createFormatters('EUR').money(1234)).toBe('€1,234');
    expect(createFormatters('EUR').currencySymbol).toBe('€');
  });

  it('uses compact notation for chart axes', () => {
    expect(createFormatters('USD').moneyCompact(120_000)).toBe('$120K');
  });

  it('formats payback months', () => {
    const f = createFormatters('USD');
    expect(f.months(null)).toBe('Not reached');
    expect(f.months(13.66)).toBe('13.7 months');
  });
});
