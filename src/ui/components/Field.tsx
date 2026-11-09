import type { Inputs } from '../../types';
import type { FieldDef } from '../fields';
import { SCORE_LABELS } from '../fields';
import { SUPPORTED_CURRENCIES, type Formatters } from '../format';

interface FieldProps {
  def: FieldDef;
  value: string | number;
  fmt: Formatters;
  onChange: (key: keyof Inputs, value: string | number) => void;
}

/** A labelled input for one `Inputs` key. Percent values are stored as fractions (0.75). */
export function Field({ def, value, fmt, onChange }: FieldProps) {
  const id = `field-${def.key}`;
  return (
    <div className="field">
      <label htmlFor={id}>{def.label}</label>
      <FieldControl id={id} def={def} value={value} fmt={fmt} onChange={onChange} />
    </div>
  );
}

function FieldControl({ id, def, value, fmt, onChange }: FieldProps & { id: string }) {
  switch (def.kind) {
    case 'text':
      return (
        <input
          id={id}
          className="input"
          value={String(value)}
          maxLength={500}
          onChange={(e) => onChange(def.key, e.target.value)}
        />
      );
    case 'currency': {
      const current = String(value);
      const options = (SUPPORTED_CURRENCIES as readonly string[]).includes(current)
        ? SUPPORTED_CURRENCIES
        : [current, ...SUPPORTED_CURRENCIES];
      return (
        <select
          id={id}
          className="input"
          value={current}
          onChange={(e) => onChange(def.key, e.target.value)}
        >
          {options.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      );
    }
    case 'score':
      return (
        <select
          id={id}
          className="input"
          value={Number(value)}
          onChange={(e) => onChange(def.key, Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((score) => (
            <option key={score} value={score}>
              {score} — {SCORE_LABELS[score]}
            </option>
          ))}
        </select>
      );
    default: {
      const percent = def.kind === 'percent';
      const money = def.kind === 'money';
      const numeric = Number(value);
      const display = percent ? Math.round(numeric * 100 * 1000) / 1000 : numeric;
      return (
        <div className="input-wrap">
          {money && (
            <span className="prefix" aria-hidden="true">
              {fmt.currencySymbol}
            </span>
          )}
          <input
            id={id}
            className="input"
            type="number"
            inputMode="decimal"
            min={def.key.endsWith('GrowthRate') ? undefined : 0}
            step={percent ? '0.1' : 'any'}
            style={
              money ? { paddingLeft: `${0.9 + fmt.currencySymbol.length * 0.6}em` } : undefined
            }
            value={Number.isFinite(display) ? display : 0}
            onChange={(e) => {
              const next = e.target.value === '' ? 0 : Number(e.target.value);
              if (!Number.isFinite(next)) return;
              onChange(def.key, percent ? next / 100 : next);
            }}
          />
          {percent && (
            <span className="suffix" aria-hidden="true">
              %
            </span>
          )}
        </div>
      );
    }
  }
}
