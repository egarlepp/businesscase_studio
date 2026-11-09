import { describe, expect, it } from 'vitest';
import { calculateBusinessCase, calculatePaybackMonths } from './engine';
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

describe('deferred hiring', () => {
  // Isolate deferred hiring: zero every other benefit and all costs.
  const deferralOnly = {
    ...defaultInputs,
    users: 0,
    managers: 0,
    reconciliationHoursSavedMonth: 0,
    capacityHoursRecoveredYear: 0,
    contractorHoursAvoided: 0,
    influencedPipeline: 0,
    additionalOpportunities: 0,
    riskExposure: 0,
    deferredHires: 1,
    monthsDeferred: 6,
    monthlyLoadedFteCost: 10_000,
    adoptionRate: 1,
    benefitsGrowthRate: 0.1,
    horizonYears: 3,
  };

  it('is recognized once, not every year of the horizon', () => {
    const r = calculateBusinessCase(deferralOnly);
    expect(r.oneTimeBenefitBreakdown.hiringDeferral).toBe(60_000);
    expect(r.annualBreakdown.map((y) => y.oneTimeBenefits)).toEqual([60_000, 0, 0]);
    expect(r.totalBenefits).toBeCloseTo(60_000);
  });

  it('is excluded from recurring annual benefits and the recurring benefit mix', () => {
    const r = calculateBusinessCase(deferralOnly);
    expect(r.annualBenefits).toBe(0);
    expect(r.benefitBreakdown).not.toHaveProperty('hiringDeferral');
    expect(r.timeToMarketBenefit).toBe(0);
  });

  it('is not subject to benefit growth', () => {
    const r = calculateBusinessCase({ ...deferralOnly, monthsDeferred: 18 });
    expect(r.annualBreakdown.map((y) => y.oneTimeBenefits)).toEqual([120_000, 60_000, 0]);
  });

  it('spreads across years and is capped at the evaluation horizon', () => {
    const r = calculateBusinessCase({ ...deferralOnly, monthsDeferred: 48 });
    expect(r.annualBreakdown.map((y) => y.oneTimeBenefits)).toEqual([120_000, 120_000, 120_000]);
    expect(r.oneTimeBenefitBreakdown.hiringDeferral).toBe(360_000);
  });

  it('is discounted in the year it occurs', () => {
    const r = calculateBusinessCase({
      ...deferralOnly,
      discountRate: 0.1,
      initialLaborHours: 0,
      discoveryHours: 0,
      architectureHours: 0,
      testingHours: 0,
      securityReviewHours: 0,
      documentationHours: 0,
      trainingHours: 0,
      aiPromptingHours: 0,
      aiReviewHours: 0,
      aiDebuggingHours: 0,
      aiSecurityRemediationHours: 0,
      aiInputTokens: 0,
      aiOutputTokens: 0,
      aiCachedTokens: 0,
      aiSubscriptions: 0,
      otherInitialCost: 0,
      monthlyHosting: 0,
      monthlyDatabase: 0,
      monthlyMonitoring: 0,
      monthlyAiRuntime: 0,
      monthlySupportHours: 0,
      annualMaintenance: 0,
      annualEnhancements: 0,
      annualGovernance: 0,
      annualSecurity: 0,
      annualTraining: 0,
    });
    expect(r.npv).toBeCloseTo(60_000 / 1.1);
  });

  it('is scaled by adoption', () => {
    const r = calculateBusinessCase({ ...deferralOnly, adoptionRate: 0.5 });
    expect(r.oneTimeBenefitBreakdown.hiringDeferral).toBe(30_000);
  });
});

describe('calculatePaybackMonths', () => {
  it('matches initial cost / monthly net when there is no one-time benefit', () => {
    expect(calculatePaybackMonths(12_000, 1_000, 0, 0)).toBe(12);
  });

  it('pays back during the one-time window when the boost is large enough', () => {
    // 3,000/month for the first 6 months covers 12,000 in month 4
    expect(calculatePaybackMonths(12_000, 1_000, 2_000, 6)).toBe(4);
  });

  it('pays back after the one-time window ends', () => {
    // First 2 months: 2 x 3,000 = 6,000; remaining 6,000 at 1,000/month -> month 8
    expect(calculatePaybackMonths(12_000, 1_000, 2_000, 2)).toBe(8);
  });

  it('can pay back on the one-time benefit alone when recurring net is negative', () => {
    expect(calculatePaybackMonths(10_000, -500, 3_000, 6)).toBe(4);
  });

  it('returns null when the one-time benefit runs out before payback and recurring net is not positive', () => {
    expect(calculatePaybackMonths(100_000, -500, 3_000, 6)).toBeNull();
    expect(calculatePaybackMonths(1_000, 0, 0, 0)).toBeNull();
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
