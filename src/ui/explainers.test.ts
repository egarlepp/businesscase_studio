import { describe, expect, it } from 'vitest';
import { SCENARIO_MULTIPLIERS, SCENARIOS } from '../data/defaults';
import { confidenceBand, explainScenario } from './explainers';
import { FIELD_HELP, searchUrl } from './fieldHelp';
import { FIELD_GROUPS } from './fields';

describe('explainScenario', () => {
  it('lists one adjustment per multiplier, using field labels', () => {
    for (const name of SCENARIOS) {
      expect(explainScenario(name).adjustments).toHaveLength(
        Object.keys(SCENARIO_MULTIPLIERS[name]).length,
      );
    }
    expect(explainScenario('Conservative').adjustments).toContain('Annual maintenance +20%');
    expect(explainScenario('Upside').adjustments).toContain('Adoption rate +15%');
    expect(explainScenario('Expected').adjustments).toEqual([]);
  });
});

describe('confidenceBand', () => {
  it('maps scores to high, moderate, and low bands', () => {
    expect(confidenceBand(90)).toMatch(/^High/);
    expect(confidenceBand(80)).toMatch(/^Moderate/);
    expect(confidenceBand(65)).toMatch(/^Low/);
  });
});

describe('FIELD_HELP', () => {
  it('explains every editable field', () => {
    const missing = Object.values(FIELD_GROUPS)
      .flat()
      .flatMap((g) => g.fields)
      .filter((f) => !FIELD_HELP[f.key]?.text)
      .map((f) => f.key);
    expect(missing).toEqual([]);
  });

  it('builds an encoded Google search link', () => {
    expect(searchUrl('discount rate NPV')).toBe(
      'https://www.google.com/search?q=discount%20rate%20NPV',
    );
  });
});
