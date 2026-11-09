import { describe, expect, it } from 'vitest';
import { defaultInputs } from '../data/defaults';
import { calculateBusinessCase } from './engine';
import { runSensitivity } from './sensitivity';

describe('runSensitivity', () => {
  it('reports the unflexed base value', () => {
    const s = runSensitivity(defaultInputs, 'npv', 0.2);
    expect(s.base).toBeCloseTo(calculateBusinessCase(defaultInputs).npv);
  });

  it('sorts drivers by swing, largest first, and omits drivers with no effect', () => {
    const s = runSensitivity(defaultInputs, 'npv', 0.2);
    expect(s.rows.length).toBeGreaterThan(5);
    for (let i = 1; i < s.rows.length; i++)
      expect(s.rows[i - 1].swing).toBeGreaterThanOrEqual(s.rows[i].swing);
    expect(s.rows.every((r) => r.swing > 0)).toBe(true);
  });

  it('flexes inputs symmetrically and clamps share inputs to 100%', () => {
    const s = runSensitivity({ ...defaultInputs, adoptionRate: 0.95 }, 'roi', 0.3, [
      'adoptionRate',
      'users',
    ]);
    const adoption = s.rows.find((r) => r.key === 'adoptionRate')!;
    expect(adoption.highInput).toBe(1);
    expect(adoption.lowInput).toBeCloseTo(0.665);
    const users = s.rows.find((r) => r.key === 'users')!;
    expect(users.lowInput).toBeCloseTo(56);
    expect(users.highInput).toBeCloseTo(104);
  });

  it('moves benefits up and costs down in the expected direction', () => {
    const s = runSensitivity(defaultInputs, 'npv', 0.2, ['users', 'annualMaintenance']);
    const users = s.rows.find((r) => r.key === 'users')!;
    const maintenance = s.rows.find((r) => r.key === 'annualMaintenance')!;
    expect(users.high).toBeGreaterThan(users.low);
    expect(maintenance.high).toBeLessThan(maintenance.low);
  });

  it('does not mutate the base inputs', () => {
    const base = { ...defaultInputs };
    runSensitivity(base, 'npv', 0.2);
    expect(base).toEqual(defaultInputs);
  });

  it('rejects ranges outside (0, 1)', () => {
    expect(() => runSensitivity(defaultInputs, 'npv', 0)).toThrow(RangeError);
    expect(() => runSensitivity(defaultInputs, 'npv', 1)).toThrow(RangeError);
  });
});
