import type { ActualsResults, Inputs, Results } from '../types';
const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);
const positive = (v: number) => Math.max(v, 0);
const formatPercent = (v: number) => `${Math.round(v * 1000) / 10}%`;

/** Evaluation horizons are rounded and bounded to keep the model (and the UI) responsive. */
export const MAX_HORIZON_YEARS = 50;
export function clampHorizonYears(value: number): number {
  return Number.isFinite(value) ? Math.min(MAX_HORIZON_YEARS, Math.max(1, Math.round(value))) : 1;
}

/** Payback search stops after this many months (50 years) and reports "not reached". */
export const MAX_PAYBACK_MONTHS = 600;

/** Technical-debt reserve suggested at perfect (100) and worst (0) technical health. */
export const SUGGESTED_RESERVE_AT_BEST_HEALTH = 0.05;
export const SUGGESTED_RESERVE_AT_WORST_HEALTH = 0.3;
/** Tolerance before an entered reserve below the suggestion raises a warning. */
export const RESERVE_WARNING_TOLERANCE = 0.025;

export interface PaybackParams {
  initialCost: number;
  /** Year-one recurring benefits; grows by `benefitsGrowthRate` each year. */
  annualRecurringBenefits: number;
  /** Year-one run cost; grows by `costGrowthRate` each year. */
  annualRunCost: number;
  benefitsGrowthRate: number;
  costGrowthRate: number;
  /** One-time saving per month (e.g. deferred hiring), applied for the first `oneTimeMonths`. */
  oneTimeMonthly: number;
  oneTimeMonths: number;
}

/**
 * Months until cumulative net value covers the initial investment. Simulates month by month:
 * recurring benefits and costs grow once per year, the one-time saving applies only during its
 * window, and the crossing month is interpolated. Returns null if not reached within
 * MAX_PAYBACK_MONTHS. With zero growth this equals the closed-form payback.
 */
export function calculatePaybackMonths(p: PaybackParams): number | null {
  if (p.initialCost <= 0) return 0;
  let cumulative = 0;
  for (let month = 1; month <= MAX_PAYBACK_MONTHS; month++) {
    const yearIndex = Math.floor((month - 1) / 12);
    const recurring =
      (p.annualRecurringBenefits * Math.pow(1 + p.benefitsGrowthRate, yearIndex) -
        p.annualRunCost * Math.pow(1 + p.costGrowthRate, yearIndex)) /
      12;
    const oneTimeShare = clamp(p.oneTimeMonths - (month - 1), 0, 1);
    const net = recurring + p.oneTimeMonthly * oneTimeShare;
    if (net > 0 && cumulative + net >= p.initialCost)
      return month - 1 + (p.initialCost - cumulative) / net;
    cumulative += net;
  }
  return null;
}

/** Linear heuristic: 5% reserve at health 100, rising to 30% at health 0. Not a benchmark. */
export function suggestTechnicalDebtReserveRate(technicalHealthScore: number): number {
  const risk = 1 - clamp(technicalHealthScore / 100);
  return (
    SUGGESTED_RESERVE_AT_BEST_HEALTH +
    risk * (SUGGESTED_RESERVE_AT_WORST_HEALTH - SUGGESTED_RESERVE_AT_BEST_HEALTH)
  );
}

export function calculateBusinessCase(raw: Inputs): Results {
  const adoption = clamp(raw.adoptionRate),
    realization = clamp(raw.realizationRate),
    capRealization = clamp(raw.capacityRealizationRate);
  const grossMargin = clamp(raw.grossMargin),
    contribution = clamp(raw.contributionRate),
    years = clampHorizonYears(raw.horizonYears);
  const productivity =
    raw.users *
    (raw.minutesSavedPerUserWeek / 60) *
    raw.loadedHourlyRate *
    raw.workWeeks *
    adoption *
    realization;
  const management =
    raw.managers * raw.managerHoursSavedMonth * 12 * raw.managerHourlyRate * adoption * realization;
  const reconciliation =
    raw.reconciliationHoursSavedMonth * 12 * raw.analystHourlyRate * adoption * realization;
  const capacity =
    raw.capacityHoursRecoveredYear * raw.loadedHourlyRate * capRealization * adoption;
  const contractorAvoidance = raw.contractorHoursAvoided * raw.contractorHourlyRate * adoption;
  // Deferred hiring is a one-time saving: the loaded cost of each deferred FTE is avoided only
  // for the months the hire is postponed, starting at go-live. It is not a recurring benefit.
  const hiringDeferralMonthly =
    positive(raw.deferredHires) * positive(raw.monthlyLoadedFteCost) * adoption;
  const deferralMonths = positive(raw.monthsDeferred);
  const winRate =
    raw.influencedPipeline *
    positive(raw.incrementalWinRate) *
    grossMargin *
    contribution *
    adoption;
  const opportunityCoverage =
    raw.additionalOpportunities *
    raw.averageDealValue *
    clamp(raw.opportunityWinRate) *
    grossMargin *
    contribution *
    adoption;
  const riskReduction = raw.riskExposure * clamp(raw.riskProbability) * clamp(raw.riskReduction);
  const annualBenefits =
    productivity +
    management +
    reconciliation +
    capacity +
    contractorAvoidance +
    winRate +
    opportunityCoverage +
    riskReduction;

  const aiCash =
    (raw.aiInputTokens / 1e6) * raw.aiInputRatePerMillion +
    (raw.aiOutputTokens / 1e6) * raw.aiOutputRatePerMillion +
    (raw.aiCachedTokens / 1e6) * raw.aiCachedRatePerMillion +
    raw.aiSubscriptions;
  const laborHours =
    raw.initialLaborHours +
    raw.discoveryHours +
    raw.architectureHours +
    raw.testingHours +
    raw.securityReviewHours +
    raw.documentationHours +
    raw.trainingHours +
    raw.aiPromptingHours +
    raw.aiReviewHours +
    raw.aiDebuggingHours +
    raw.aiSecurityRemediationHours;
  const labor = laborHours * raw.initialLaborRate;
  const initialCost = labor + aiCash + raw.otherInitialCost;
  const platform =
    (raw.monthlyHosting + raw.monthlyDatabase + raw.monthlyMonitoring + raw.monthlyAiRuntime) * 12;
  const support = raw.monthlySupportHours * raw.supportHourlyRate * 12;
  const maintenance = raw.annualMaintenance + raw.annualEnhancements + raw.annualTraining;
  const governance = raw.annualGovernance + raw.annualSecurity;
  const annualBaseRunCost = platform + support + maintenance + governance;
  const technicalDebt = annualBaseRunCost * positive(raw.technicalDebtReserveRate);
  const annualRunCost = annualBaseRunCost + technicalDebt;

  const hiringDeferral = hiringDeferralMonthly * Math.min(deferralMonths, years * 12);

  let cumulativeNet = -initialCost,
    npv = -initialCost,
    totalBenefits = 0,
    recurringCosts = 0;
  const annualBreakdown = Array.from({ length: years }, (_, i) => {
    const year = i + 1;
    const deferralMonthsThisYear = clamp(deferralMonths - i * 12, 0, 12);
    const oneTimeBenefits = hiringDeferralMonthly * deferralMonthsThisYear;
    const benefits = annualBenefits * Math.pow(1 + raw.benefitsGrowthRate, i) + oneTimeBenefits;
    const costs = annualRunCost * Math.pow(1 + raw.costGrowthRate, i);
    totalBenefits += benefits;
    recurringCosts += costs;
    const net = benefits - costs;
    cumulativeNet += net;
    const discountedNet = net / Math.pow(1 + positive(raw.discountRate), year);
    npv += discountedNet;
    return { year, benefits, oneTimeBenefits, costs, net, discountedNet, cumulativeNet };
  });
  const totalCosts = initialCost + recurringCosts,
    netBenefit = totalBenefits - totalCosts;
  const roi = totalCosts ? netBenefit / totalCosts : 0,
    benefitCostRatio = totalCosts ? totalBenefits / totalCosts : 0;
  const paybackMonths = calculatePaybackMonths({
    initialCost,
    annualRecurringBenefits: annualBenefits,
    annualRunCost,
    benefitsGrowthRate: raw.benefitsGrowthRate,
    costGrowthRate: raw.costGrowthRate,
    oneTimeMonthly: hiringDeferralMonthly,
    oneTimeMonths: deferralMonths,
  });
  const traditionalBuildCost = raw.traditionalBuildHours * raw.traditionalBuildRate;
  const aiAssistedBuildCost = labor + aiCash;
  const aiDevelopmentSavings = traditionalBuildCost - aiAssistedBuildCost;
  const timeToMarketBenefit = Math.max(raw.monthsAccelerated, 0) * (annualBenefits / 12);
  const scores = [
    raw.architectureScore,
    raw.testingScore,
    raw.documentationScore,
    raw.securityScore,
    raw.dependencyScore,
    raw.deploymentScore,
    raw.observabilityScore,
    raw.ownershipScore,
    raw.integrationScore,
    raw.portabilityScore,
  ];
  const technicalHealthScore =
    100 - ((scores.reduce((a, b) => a + b, 0) / scores.length - 1) / 4) * 100;
  const technicalRisk =
    technicalHealthScore >= 80
      ? 'Low'
      : technicalHealthScore >= 60
        ? 'Moderate'
        : technicalHealthScore >= 40
          ? 'High'
          : 'Critical';
  const confidenceScore = Math.round(
    55 +
      adoption * 12 +
      realization * 10 +
      (raw.testingScore <= 2 ? 8 : 3) +
      (raw.securityScore <= 2 ? 8 : 3) +
      (raw.documentationScore <= 2 ? 7 : 3),
  );
  const warnings: string[] = [];
  if (raw.adoptionRate >= 1)
    warnings.push('Adoption is modeled at 100%; use a phased rollout assumption.');
  if (raw.contributionRate > 0.25)
    warnings.push('Revenue contribution exceeds 25%; document causal evidence.');
  if (raw.technicalDebtReserveRate === 0) warnings.push('No technical debt reserve is included.');
  if (raw.annualMaintenance === 0) warnings.push('No annual maintenance cost is included.');
  if (aiCash > 0 && laborHours === 0)
    warnings.push('AI spend is included without human oversight effort.');
  if (annualBenefits <= annualRunCost)
    warnings.push(
      'Recurring annual run costs exceed or equal recurring annual benefits; net value is not sustained.',
    );
  if (raw.deferredHires > 0 && raw.capacityHoursRecoveredYear > 0)
    warnings.push('Check that recovered capacity and deferred hiring are not double-counted.');
  if (raw.incrementalWinRate > 0.03)
    warnings.push('Win-rate improvement exceeds 3%; validate against historical cohorts.');
  if (technicalRisk === 'High' || technicalRisk === 'Critical')
    warnings.push('Technical-health assessment indicates elevated maintenance risk.');
  const suggestedTechnicalDebtReserveRate = suggestTechnicalDebtReserveRate(technicalHealthScore);
  if (
    raw.technicalDebtReserveRate > 0 &&
    raw.technicalDebtReserveRate < suggestedTechnicalDebtReserveRate - RESERVE_WARNING_TOLERANCE
  )
    warnings.push(
      `Technical-debt reserve (${formatPercent(raw.technicalDebtReserveRate)}) is below the ${formatPercent(suggestedTechnicalDebtReserveRate)} suggested by the technical-health score.`,
    );
  if (paybackMonths !== null && paybackMonths > years * 12)
    warnings.push(
      `Payback (${Math.round(paybackMonths)} months) falls after the ${years}-year evaluation horizon.`,
    );

  return {
    annualBenefits,
    initialCost,
    annualRunCost,
    totalBenefits,
    totalCosts,
    netBenefit,
    roi,
    benefitCostRatio,
    paybackMonths,
    npv,
    equivalentFte: raw.annualProductiveHours
      ? raw.capacityHoursRecoveredYear / raw.annualProductiveHours
      : 0,
    aiAssistedBuildCost,
    traditionalBuildCost,
    aiDevelopmentSavings,
    timeToMarketBenefit,
    technicalHealthScore,
    technicalRisk,
    suggestedTechnicalDebtReserveRate,
    confidenceScore,
    benefitBreakdown: {
      productivity,
      management,
      reconciliation,
      capacity,
      contractorAvoidance,
      winRate,
      opportunityCoverage,
      riskReduction,
    },
    oneTimeBenefitBreakdown: { hiringDeferral },
    costBreakdown: {
      labor,
      aiCash,
      otherInitial: raw.otherInitialCost,
      platform,
      support,
      maintenance,
      governance,
      technicalDebt,
    },
    annualBreakdown,
    warnings,
  };
}

/**
 * Compare observed actuals with the modeled case. `modeled` must be the scenario-adjusted inputs
 * that produced `results`. Actual ROI is a run-rate projection over the evaluation horizon
 * (actual annual figures held flat, no growth).
 */
export function calculateActuals(modeled: Inputs, results: Results): ActualsResults {
  const years = clampHorizonYears(modeled.horizonYears);
  const actualInitialCost = positive(modeled.actualInitialCost);
  const actualAnnualNet = modeled.actualAnnualBenefits - modeled.actualAnnualRunCost;
  const actualMonthlyNet = actualAnnualNet / 12;
  const netToDate = actualMonthlyNet * positive(modeled.monthsSinceLaunch);
  const actualPaybackMonths =
    actualInitialCost === 0
      ? 0
      : actualMonthlyNet > 0
        ? actualInitialCost / actualMonthlyNet
        : null;
  const horizonCosts = actualInitialCost + modeled.actualAnnualRunCost * years;
  const horizonBenefits = modeled.actualAnnualBenefits * years;
  const modeledAnnualNet = results.annualBenefits - results.annualRunCost;
  return {
    adoptionVariance: modeled.actualAdoptionRate - clamp(modeled.adoptionRate),
    annualBenefitsVariance: modeled.actualAnnualBenefits - results.annualBenefits,
    annualRunCostVariance: modeled.actualAnnualRunCost - results.annualRunCost,
    initialCostVariance: actualInitialCost - results.initialCost,
    actualAnnualNet,
    annualNetVariance: actualAnnualNet - modeledAnnualNet,
    benefitRealization: results.annualBenefits
      ? modeled.actualAnnualBenefits / results.annualBenefits
      : null,
    netToDate,
    paybackProgress: actualInitialCost > 0 ? netToDate / actualInitialCost : null,
    actualPaybackMonths,
    actualRoi: horizonCosts > 0 ? (horizonBenefits - horizonCosts) / horizonCosts : 0,
  };
}
