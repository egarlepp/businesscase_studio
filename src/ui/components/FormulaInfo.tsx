import { useId, useState } from 'react';
import { Info } from 'lucide-react';
import { getFormula, type FormulaDef } from '../../calculations/formulas';
import type { Inputs, Results } from '../../types';
import { formatFormulaValue, formatInputValue } from '../display';
import { fieldLocation } from '../fields';
import type { Formatters } from '../format';

interface FormulaDetailsProps {
  formula: FormulaDef;
  inputs: Inputs;
  results: Results;
  fmt: Formatters;
}

/** Expression, input sources with live values, and dependencies for one formula. */
export function FormulaDetails({ formula, inputs, results, fmt }: FormulaDetailsProps) {
  return (
    <div className="formula-details">
      <p className="formula-expression">
        <code>{formula.expression}</code>
      </p>
      {formula.inputs.length > 0 && (
        <ul className="formula-inputs">
          {formula.inputs.map((key) => {
            const loc = fieldLocation(key);
            return (
              <li key={key}>
                <span>{loc ? `${loc.section} › ${loc.group} › ${loc.label}` : key}</span>
                <strong>{formatInputValue(key, inputs, fmt)}</strong>
              </li>
            );
          })}
        </ul>
      )}
      {formula.dependsOn && (
        <p className="formula-deps">
          Built from:{' '}
          {formula.dependsOn
            .map((id) => getFormula(id))
            .filter((f): f is FormulaDef => Boolean(f))
            .map((f) => `${f.label} (${formatFormulaValue(f, results, fmt)})`)
            .join(', ')}
        </p>
      )}
    </div>
  );
}

interface FormulaInfoProps {
  id: string;
  inputs: Inputs;
  results: Results;
  fmt: Formatters;
}

/** An info toggle that reveals how a result is calculated. */
export function FormulaInfo({ id, inputs, results, fmt }: FormulaInfoProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const formula = getFormula(id);
  if (!formula) return null;
  return (
    <>
      <button
        type="button"
        className="info-button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`How ${formula.label} is calculated`}
        title={`How ${formula.label} is calculated`}
        onClick={() => setOpen((o) => !o)}
      >
        <Info size={15} />
      </button>
      {open && (
        <div id={panelId} className="formula-popover">
          <FormulaDetails formula={formula} inputs={inputs} results={results} fmt={fmt} />
        </div>
      )}
    </>
  );
}
