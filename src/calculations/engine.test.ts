import { describe, expect, it } from 'vitest';
import {
  MAX_HORIZON_YEARS,
  MAX_PAYBACK_MONTHS,
  clampHorizonYears,
  calculateActuals,
  calculateBusinessCase,
  calculatePaybackMonths,
  suggestTechnicalDebtReserveRate,
} from './engine';
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
  // Zero-growth helper: reproduces the original closed-form cases.
  const flat = (initialCost: number, monthlyNet: number, oneTimeMonthly = 0, oneTimeMonths = 0) =>
    calculatePaybackMonths({
      initialCost,
      annualRecurringBenefits: monthlyNet * 12,
      annualRunCost: 0,
      benefitsGrowthRate: 0,
      costGrowthRate: 0,
      oneTimeMonthly,
      oneTimeMonths,
    });

  it('matches initial cost / monthly net when there is no one-time benefit', () => {
    expect(flat(12_000, 1_000)).toBeCloseTo(12);
  });

  it('pays back during the one-time window when the boost is large enough', () => {
    expect(flat(12_000, 1_000, 2_000, 6)).toBeCloseTo(4);
  });

  it('pays back after the one-time window ends', () => {
    expect(flat(12_000, 1_000, 2_000, 2)).toBeCloseTo(8);
  });

  it('can pay back on the one-time benefit alone when recurring net is negative', () => {
    expect(flat(10_000, -500, 3_000, 6)).toBeCloseTo(4);
  });

  it('returns null when payback is never reached', () => {
    expect(flat(100_000, -500, 3_000, 6)).toBeNull();
    expect(flat(1_000, 0)).toBeNull();
  });

  it('returns 0 when there is no initial investment', () => {
    expect(flat(0, 1_000)).toBe(0);
  });

  it('applies benefit and cost growth once per year', () => {
    // Year 1 net 0; year 2 benefits grow 100% -> 1,000/month net -> 6,000 needs 6 months of year 2.
    const months = calculatePaybackMonths({
      initialCost: 6_000,
      annualRecurringBenefits: 12_000,
      annualRunCost: 12_000,
      benefitsGrowthRate: 1,
      costGrowthRate: 0,
      oneTimeMonthly: 0,
      oneTimeMonths: 0,
    });
    expect(months).toBeCloseTo(18);
  });

  it('stops at MAX_PAYBACK_MONTHS', () => {
    expect(flat(1e12, 1)).toBeNull();
    expect(MAX_PAYBACK_MONTHS).toBe(600);
  });

  it('is earlier than the flat estimate when benefits grow faster than costs', () => {
    const r = calculateBusinessCase({ ...defaultInputs, horizonYears: 5 });
    const noGrowth = calculateBusinessCase({
      ...defaultInputs,
      horizonYears: 5,
      benefitsGrowthRate: 0,
      costGrowthRate: 0,
    });
    expect(r.paybackMonths).not.toBeNull();
    expect(r.paybackMonths!).toBeLessThanOrEqual(noGrowth.paybackMonths!);
  });
});

describe('technical-debt reserve suggestion', () => {
  it('runs linearly from 5% at perfect health to 30% at worst health', () => {
    expect(suggestTechnicalDebtReserveRate(100)).toBeCloseTo(0.05);
    expect(suggestTechnicalDebtReserveRate(0)).toBeCloseTo(0.3);
    expect(suggestTechnicalDebtReserveRate(50)).toBeCloseTo(0.175);
  });

  it('is exposed on results but not applied automatically', () => {
    const r = calculateBusinessCase(defaultInputs);
    expect(r.suggestedTechnicalDebtReserveRate).toBeCloseTo(
      suggestTechnicalDebtReserveRate(r.technicalHealthScore),
    );
    const applied = calculateBusinessCase({
      ...defaultInputs,
      technicalDebtReserveRate: r.suggestedTechnicalDebtReserveRate,
    });
    expect(applied.costBreakdown.technicalDebt).not.toBe(r.costBreakdown.technicalDebt);
  });

  it('warns when the entered reserve is well below the suggestion', () => {
    const low = calculateBusinessCase({ ...defaultInputs, technicalDebtReserveRate: 0.05 });
    expect(low.warnings.some((w) => w.includes('suggested by the technical-health score'))).toBe(
      true,
    );
    const ok = calculateBusinessCase(defaultInputs);
    expect(ok.warnings.some((w) => w.includes('suggested by the technical-health score'))).toBe(
      false,
    );
  });
});

describe('calculateActuals', () => {
  const r = calculateBusinessCase(defaultInputs);

  it('uses the actual initial cost for variance and payback', () => {
    const a = calculateActuals(defaultInputs, r);
    expect(a.initialCostVariance).toBeCloseTo(defaultInputs.actualInitialCost - r.initialCost);
    const monthlyNet =
      (defaultInputs.actualAnnualBenefits - defaultInputs.actualAnnualRunCost) / 12;
    expect(a.actualPaybackMonths).toBeCloseTo(defaultInputs.actualInitialCost / monthlyNet);
  });

  it('tracks payback progress from months since launch', () => {
    const a = calculateActuals(
      {
        ...defaultInputs,
        actualAnnualBenefits: 120_000,
        actualAnnualRunCost: 0,
        actualInitialCost: 60_000,
        monthsSinceLaunch: 3,
      },
      r,
    );
    expect(a.netToDate).toBe(30_000);
    expect(a.paybackProgress).toBeCloseTo(0.5);
    expect(a.actualPaybackMonths).toBeCloseTo(6);
  });

  it('reports no payback and negative progress when actual net is negative', () => {
    const a = calculateActuals(
      { ...defaultInputs, actualAnnualBenefits: 10_000, actualAnnualRunCost: 40_000 },
      r,
    );
    expect(a.actualPaybackMonths).toBeNull();
    expect(a.paybackProgress!).toBeLessThan(0);
  });

  it('handles zero initial cost and zero modeled benefits', () => {
    const zero = calculateBusinessCase({
      ...defaultInputs,
      users: 0,
      managers: 0,
      reconciliationHoursSavedMonth: 0,
      capacityHoursRecoveredYear: 0,
      contractorHoursAvoided: 0,
      influencedPipeline: 0,
      additionalOpportunities: 0,
      riskExposure: 0,
    });
    const a = calculateActuals({ ...defaultInputs, actualInitialCost: 0 }, zero);
    expect(a.actualPaybackMonths).toBe(0);
    expect(a.paybackProgress).toBeNull();
    expect(a.benefitRealization).toBeNull();
  });

  it('computes run-rate ROI over the horizon', () => {
    const a = calculateActuals(
      {
        ...defaultInputs,
        horizonYears: 2,
        actualAnnualBenefits: 100_000,
        actualAnnualRunCost: 25_000,
        actualInitialCost: 50_000,
      },
      r,
    );
    // benefits 200k, costs 50k + 50k = 100k -> ROI 100%
    expect(a.actualRoi).toBeCloseTo(1);
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

describe('horizon bounds', () => {
  it('clamps the evaluation horizon to 1–50 years', () => {
    expect(clampHorizonYears(0)).toBe(1);
    expect(clampHorizonYears(2.6)).toBe(3);
    expect(clampHorizonYears(1e9)).toBe(MAX_HORIZON_YEARS);
    expect(clampHorizonYears(Number.NaN)).toBe(1);
    expect(
      calculateBusinessCase({ ...defaultInputs, horizonYears: 1e9 }).annualBreakdown,
    ).toHaveLength(MAX_HORIZON_YEARS);
  });
});
