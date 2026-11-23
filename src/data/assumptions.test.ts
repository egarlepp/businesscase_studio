import { describe, expect, it } from 'vitest';
import type { AssumptionItem } from '../types';
import {
  assessEvidence,
  assumptionsInCategory,
  blankAssumption,
  newAssumptionId,
} from './assumptions';

const item = (patch: Partial<AssumptionItem>): AssumptionItem => ({
  ...blankAssumption('Build vs buy'),
  name: 'Vendor quote',
  source: 'Quote #42',
  ...patch,
});

describe('assumption helpers', () => {
  it('creates unique ids and blank rows', () => {
    const ids = new Set(Array.from({ length: 50 }, newAssumptionId));
    expect(ids.size).toBe(50);
    expect(blankAssumption('Revenue')).toMatchObject({
      name: '',
      category: 'Revenue',
      status: 'Draft',
    });
  });

  it('matches categories case-insensitively', () => {
    const rows = [item({ category: ' build VS buy ' }), item({ category: 'Revenue' })];
    expect(assumptionsInCategory(rows, 'Build vs buy')).toHaveLength(1);
  });

  it('is undocumented with no rows or a row missing its source', () => {
    expect(assessEvidence([], 'Build vs buy').documented).toBe(false);
    expect(assessEvidence([item({ source: '  ' })], 'Build vs buy').documented).toBe(false);
  });

  it('flags weak confidence and unreviewed rows', () => {
    const rows = [
      item({ confidence: 'Validated', status: 'Approved' }),
      item({ confidence: 'Speculative', status: 'Approved' }),
      item({ confidence: 'Measured', status: 'Draft' }),
    ];
    const e = assessEvidence(rows, 'Build vs buy');
    expect(e.documented).toBe(true);
    expect(e.weak).toHaveLength(2);
  });
});
