import { describe, expect, it } from 'vitest';
import { blankInputs, defaultInputs } from '../data/defaults';
import { VALUE_TYPES, claimKey, evidenceKey, type ValueTypeId } from '../data/valueTypes';
import type { Inputs } from '../types';
import { calculateBusinessCase, calculatePaybackMonths } from './engine';

const claim = (ids: ValueTypeId[], over: Partial<Inputs> = {}): Inputs => {
  const inputs: Inputs = { ...defaultInputs, ...over };
  for (const t of VALUE_TYPES) (inputs[claimKey(t.id)] as number) = ids.includes(t.id) ? 1 : 0;
  return inputs;
};

describe('value claims', () => {
  it('counts nothing from an unclaimed value type, even with figures entered', () => {
    const r = calculateBusinessCase(claim(['capacity']));
    expect(r.benefitBreakdown.productivity).toBe(0);
    expect(r.benefitBreakdown.riskReduction).toBe(0);
    expect(r.benefitBreakdown.costReduction).toBe(0);
    expect(r.benefitBreakdown.capacity).toBeGreaterThan(0);
    expect(r.claims.map((c) => c.id)).toEqual(['capacity']);
  });

  it('keeps the sample case results unchanged: only the four original types are claimed', () => {
    const r = calculateBusinessCase(defaultInputs);
    expect(r.claims.map((c) => c.id)).toEqual(['productivity', 'capacity', 'revenue', 'risk']);
    expect(Math.round(r.benefitBreakdown.productivity)).toBe(99960);
    expect(r.strategicValue).toBe(0);
  });

  it('counts hard cost reduction only from the contract exit month', () => {
    const inputs = claim(['costReduction'], { costRetiredSpend: 24000, costMonthsToExit: 4 });
    const r = calculateBusinessCase({ ...inputs, benefitsGrowthRate: 0 });
    expect(r.benefitBreakdown.costReduction).toBeCloseTo(16000);
    expect(r.annualBreakdown[0].benefits).toBeCloseTo(16000);
    expect(r.annualBreakdown[1].benefits).toBeCloseTo(24000);
    const late = calculateBusinessCase({ ...inputs, benefitsGrowthRate: 0, costMonthsToExit: 18 });
    expect(late.annualBreakdown[0].benefits).toBe(0);
    expect(late.annualBreakdown[1].benefits).toBeCloseTo(12000);
  });

  it('delays payback until the cancelled contract stops costing money', () => {
    const base = {
      initialCost: 12000,
      annualRecurringBenefits: 0,
      annualRunCost: 0,
      benefitsGrowthRate: 0,
      costGrowthRate: 0,
      oneTimeMonthly: 0,
      oneTimeMonths: 0,
      delayedAnnualBenefits: 24000,
    };
    expect(calculatePaybackMonths({ ...base, delayedStartMonths: 0 })).toBeCloseTo(6);
    expect(calculatePaybackMonths({ ...base, delayedStartMonths: 4 })).toBeCloseTo(10);
  });

  it('values cycle time and cash acceleration as timing, not new revenue', () => {
    const r = calculateBusinessCase(
      claim(['cycleTime', 'cashAcceleration'], {
        adoptionRate: 1,
        grossMargin: 0.8,
        discountRate: 0.1,
        cycleTimeRevenue: 3_650_000,
        cycleTimeDaysSaved: 10,
        cashAnnualBilled: 3_650_000,
        cashDaysFaster: 10,
      }),
    );
    // 3.65M × 80% × 10/365 × 10% = 8,000
    expect(r.benefitBreakdown.cycleTime).toBeCloseTo(8000);
    expect(r.workingCapitalReleased).toBeCloseTo(100000);
    expect(r.benefitBreakdown.cashAcceleration).toBeCloseTo(10000);
  });

  it('reports strategic optionality but never adds it to benefits', () => {
    const without = calculateBusinessCase(claim(['productivity']));
    const withStrategic = calculateBusinessCase(claim(['productivity', 'strategic']));
    expect(withStrategic.strategicValue).toBe(defaultInputs.strategicAnnualValue);
    expect(withStrategic.totalBenefits).toBeCloseTo(without.totalBenefits);
    expect(withStrategic.npv).toBeCloseTo(without.npv);
    const strategic = withStrategic.claims.find((c) => c.id === 'strategic')!;
    expect(strategic.countsTowardRoi).toBe(false);
    expect(strategic.evidence).toBe('soft');
  });

  it('splits claims by evidence class and removes soft claims from the backed NPV', () => {
    const inputs = claim(['productivity', 'costReduction']);
    const r = calculateBusinessCase(inputs);
    expect(r.evidenceBreakdown.soft).toBeCloseTo(
      r.benefitBreakdown.productivity +
        r.benefitBreakdown.management +
        r.benefitBreakdown.reconciliation,
    );
    expect(r.evidenceBreakdown.hard).toBeCloseTo(r.benefitBreakdown.costReduction);
    expect(r.evidenceBackedNpv).toBeLessThan(r.npv);
    const productivityOnly = calculateBusinessCase(claim(['costReduction']));
    expect(r.evidenceBackedNpv).toBeCloseTo(productivityOnly.npv);

    const reclassified = calculateBusinessCase({
      ...inputs,
      [evidenceKey('productivity')]: 'hard',
    });
    expect(reclassified.evidenceBreakdown.soft).toBe(0);
    expect(reclassified.evidenceBackedNpv).toBeCloseTo(reclassified.npv);
  });

  it('treats an unknown evidence override as the type default', () => {
    const r = calculateBusinessCase({
      ...claim(['costReduction']),
      evidenceCostReduction: 'weird',
    });
    expect(r.claims[0].evidence).toBe('hard');
  });

  it('returns no evidence share on a blank case', () => {
    const r = calculateBusinessCase(blankInputs);
    expect(r.claims).toEqual([]);
    expect(r.evidenceBackedShare).toBeNull();
    expect(r.evidenceBackedNpv).toBe(0);
  });
});
