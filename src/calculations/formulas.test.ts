import { describe, expect, it } from 'vitest';
import { defaultInputs } from '../data/defaults';
import type { Inputs } from '../types';
import { fieldLocation } from '../ui/fields';
import { calculateBusinessCase } from './engine';
import { FORMULAS, getFormula } from './formulas';

const numericKeys = (Object.keys(defaultInputs) as (keyof Inputs)[]).filter(
  (k) => typeof defaultInputs[k] === 'number',
);

/** Probe values that make every listed input observable for a given formula. */
const PROBES: Record<string, Partial<Inputs>> = {
  // 30 months sits inside the 36-month horizon; perturbing either side crosses the cap.
  hiringDeferral: { monthsDeferred: 30 },
};

/** Change a value enough to move any formula that reads it. */
function perturb(key: keyof Inputs, value: number): number {
  if (key.endsWith('Score')) return value >= 3 ? 1 : 5;
  if (key === 'horizonYears') return value > 1 ? value - 1 : value + 1;
  return value === 0 ? 0.5 : value * 1.5;
}

const valueFor = (id: string, inputs: Inputs) =>
  getFormula(id)!.value(calculateBusinessCase(inputs));

describe('formula registry', () => {
  it('has unique ids and valid dependencies', () => {
    const ids = FORMULAS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FORMULAS) for (const dep of f.dependsOn ?? []) expect(ids).toContain(dep);
  });

  it('only references inputs that have a UI location', () => {
    for (const f of FORMULAS)
      for (const key of f.inputs) expect(fieldLocation(key), `${f.id}.${key}`).toBeDefined();
  });

  for (const f of FORMULAS) {
    const base = { ...defaultInputs, ...PROBES[f.id] };

    it(`${f.id}: every listed input changes the result`, () => {
      const before = valueFor(f.id, base);
      for (const key of f.inputs) {
        const after = valueFor(f.id, { ...base, [key]: perturb(key, base[key] as number) });
        expect(after, `${f.id} should depend on ${key}`).not.toBeCloseTo(before as number, 6);
      }
    });

    if (!f.dependsOn) {
      it(`${f.id}: unlisted inputs do not change the result (leaf formula)`, () => {
        const before = valueFor(f.id, base);
        for (const key of numericKeys.filter((k) => !f.inputs.includes(k))) {
          const after = valueFor(f.id, { ...base, [key]: perturb(key, base[key] as number) });
          expect(after, `${f.id} should not depend on ${key}`).toBeCloseTo(before as number, 6);
        }
      });
    }
  }
});

describe('field registry', () => {
  it('gives every input a UI location', () => {
    for (const key of Object.keys(defaultInputs) as (keyof Inputs)[])
      expect(fieldLocation(key), key).toBeDefined();
  });
});
