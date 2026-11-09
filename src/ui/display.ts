import type { FormulaDef } from '../calculations/formulas';
import type { Inputs, Results } from '../types';
import { fieldLocation } from './fields';
import type { Formatters } from './format';

export function formatFormulaValue(f: FormulaDef, r: Results, fmt: Formatters): string {
  const value = f.value(r);
  if (value === null) return f.format === 'months' ? 'Not reached' : '—';
  switch (f.format) {
    case 'money':
      return fmt.money(value);
    case 'percent':
      return fmt.percent(value);
    case 'months':
      return fmt.months(value);
    case 'ratio':
      return `${value.toFixed(2)}×`;
    case 'score':
      return `${value.toFixed(0)}/100`;
    case 'fte':
      return `${value.toFixed(2)} FTE`;
  }
}

export function formatInputValue(key: keyof Inputs, inputs: Inputs, fmt: Formatters): string {
  const value = inputs[key];
  if (typeof value === 'string') return value;
  const kind = fieldLocation(key)?.kind;
  if (kind === 'money') return fmt.money(value);
  if (kind === 'percent') return fmt.percent(value);
  return fmt.number(value);
}
