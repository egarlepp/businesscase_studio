import { describe, expect, it } from 'vitest';
import { calculateBusinessCase } from './engine';
import { applyScenario, defaultInputs } from '../data/defaults';

describe('calculateBusinessCase', () => {
  it('calculates a full business case from the defaults', () => {
    const r = calculateBusinessCase(defaultInputs);
    expect(r.totalBenefits).toBeGreaterThan(0);
    expect(r.totalCosts).toBeGreaterThan(0);
    expect(r.annualBreakdown).toHaveLength(3);
    expect(r.benefitBreakdown.productivity).toBeGreaterThan(0);
    expect(r.costBreakdown.aiCash).toBeGreaterThan(0);
  });

  it('computes the productivity benefit with adoption and realization applied', () => {
    // 80 users x (35/60) h x $85 x 48 weeks x 75% adoption x 70% realization
    const r = calculateBusinessCase(defaultInputs);
    expect(Math.round(r.benefitBreakdown.productivity)).toBe(99960);
  });

  it('clamps adoption and realization rates to 100%', () => {
    const capped = calculateBusinessCase({ ...defaultInputs, adoptionRate: 1, realizationRate: 1 });
    const over = calculateBusinessCase({ ...defaultInputs, adoptionRate: 3, realizationRate: 2 });
    expect(over.benefitBreakdown.productivity).toBeCloseTo(capped.benefitBreakdown.productivity);
  });

  it('keeps ROI, net benefit, and benefit-cost ratio internally consistent', () => {
    const r = calculateBusinessCase(defaultInputs);
    expect(r.netBenefit).toBeCloseTo(r.totalBenefits - r.totalCosts);
    expect(r.roi).toBeCloseTo(r.netBenefit / r.totalCosts);
    expect(r.benefitCostRatio).toBeCloseTo(r.totalBenefits / r.totalCosts);
  });

  it('returns no payback when value is removed', () => {
    const r = calculateBusinessCase({
      ...defaultInputs,
      users: 0,
      managers: 0,
      reconciliationHoursSavedMonth: 0,
      capacityHoursRecoveredYear: 0,
      contractorHoursAvoided: 0,
      deferredHires: 0,
      influencedPipeline: 0,
      additionalOpportunities: 0,
      riskExposure: 0,
    });
    expect(r.paybackMonths).toBeNull();
  });

  it('calculates the AI-assisted versus traditional build comparison', () => {
    const r = calculateBusinessCase(defaultInputs);
    expect(r.aiAssistedBuildCost).toBeGreaterThan(0);
    expect(r.traditionalBuildCost).toBe(
      defaultInputs.traditionalBuildHours * defaultInputs.traditionalBuildRate,
    );
  });

  it('flags potential double counting of capacity and deferred hiring', () => {
    const r = calculateBusinessCase(defaultInputs);
    expect(r.warnings.some((x) => x.includes('double-counted'))).toBe(true);
  });

  it('scores perfect technical health as 100 / Low risk', () => {
    const r = calculateBusinessCase({
      ...defaultInputs,
      architectureScore: 1,
      testingScore: 1,
      documentationScore: 1,
      securityScore: 1,
      dependencyScore: 1,
      deploymentScore: 1,
      observabilityScore: 1,
      ownershipScore: 1,
      integrationScore: 1,
      portabilityScore: 1,
    });
    expect(r.technicalHealthScore).toBe(100);
    expect(r.technicalRisk).toBe('Low');
  });
});

describe('applyScenario', () => {
  it('orders scenarios Conservative < Expected < Upside on total benefits', () => {
    const [c, e, u] = (['Conservative', 'Expected', 'Upside'] as const).map(
      (s) => calculateBusinessCase(applyScenario(defaultInputs, s)).totalBenefits,
    );
    expect(c).toBeLessThan(e);
    expect(e).toBeLessThan(u);
  });

  it('never pushes rate inputs above 100%', () => {
    const upside = applyScenario({ ...defaultInputs, adoptionRate: 0.95 }, 'Upside');
    expect(upside.adoptionRate).toBeLessThanOrEqual(1);
  });

  it('does not mutate the base inputs', () => {
    const base = { ...defaultInputs };
    applyScenario(base, 'Conservative');
    expect(base).toEqual(defaultInputs);
  });
});
