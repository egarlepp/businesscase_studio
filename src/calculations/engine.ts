import type {
  ActualsResults,
  AnnualBreakdown,
  BenefitBreakdown,
  BuildVsBuyRecommendation,
  BuildVsBuyResults,
  ClaimResult,
  EvidenceBreakdown,
  Inputs,
  Results,
} from '../types';
import {
  VALUE_TYPES,
  evidenceOf,
  getValueType,
  isClaimed,
  type ValueTypeId,
} from '../data/valueTypes';
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
  /** Recurring saving that starts only after `delayedStartMonths` (a cancelled contract). */
  delayedAnnualBenefits?: number;
  delayedStartMonths?: number;
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
    const delayedShare = clamp(month - (p.delayedStartMonths ?? 0), 0, 1);
    const delayed =
      ((p.delayedAnnualBenefits ?? 0) *
        Math.pow(1 + p.benefitsGrowthRate, yearIndex) *
        delayedShare) /
      12;
    const net = recurring + delayed + p.oneTimeMonthly * oneTimeShare;
    if (net > 0 && cumulative + net >= p.initialCost)
      return month - 1 + (p.initialCost - cumulative) / net;
    cumulative += net;
  }
  return null;
}

/** NPVs within this share of the larger TCO are reported as a close call. */
export const CLOSE_CALL_SHARE = 0.05;

interface BuildCase {
  years: number;
  annualBreakdown: AnnualBreakdown[];
  totalCosts: number;
  npv: number;
}

/**
 * Compare the internal build with a commercial alternative over the same horizon and discount
 * rate. The commercial product is credited with `buyBenefitFit` of the build's benefits in each
 * year (recurring and one-time), and its recurring cost escalates at the vendor price growth rate.
 */
export function calculateBuildVsBuy(raw: Inputs, build: BuildCase): BuildVsBuyResults {
  const fit = clamp(raw.buyBenefitFit);
  const discount = positive(raw.discountRate);
  const buyInitialCost =
    positive(raw.buyImplementationCost) +
    positive(raw.buyIntegrationCost) +
    positive(raw.buyTrainingCost);
  const buyAnnualCost =
    positive(raw.buySubscriptionPerUserMonth) * 12 * positive(raw.buyLicensedUsers) +
    positive(raw.buyAnnualPlatformFee) +
    positive(raw.buyAnnualAdministration);
  const configured = buyInitialCost > 0 || buyAnnualCost > 0;

  let buyTotalCost = buyInitialCost,
    buyTotalBenefits = 0,
    buyNpv = -buyInitialCost;
  const annual = build.annualBreakdown.slice(0, build.years).map((y, i) => {
    const buyCost = buyAnnualCost * Math.pow(1 + raw.buyPriceGrowthRate, i);
    const buyBenefits = y.benefits * fit;
    buyTotalCost += buyCost;
    buyTotalBenefits += buyBenefits;
    buyNpv += (buyBenefits - buyCost) / Math.pow(1 + discount, y.year);
    return {
      year: y.year,
      buildBenefits: y.benefits,
      buildCost: y.costs,
      buyBenefits,
      buyCost,
    };
  });
  const buyRoi = buyTotalCost > 0 ? (buyTotalBenefits - buyTotalCost) / buyTotalCost : 0;
  const npvAdvantageOfBuild = build.npv - buyNpv;
  const closeCallBand = CLOSE_CALL_SHARE * Math.max(build.totalCosts, buyTotalCost);
  const recommendation: BuildVsBuyRecommendation = !configured
    ? 'not-configured'
    : Math.abs(npvAdvantageOfBuild) <= closeCallBand
      ? 'close'
      : npvAdvantageOfBuild > 0
        ? 'build'
        : 'buy';

  const warnings: string[] = [];
  if (configured) {
    if (fit >= 1)
      warnings.push(
        'Commercial fit is 100%; an off-the-shelf product rarely delivers every benefit of a purpose-built tool.',
      );
    if (raw.buyPriceGrowthRate <= 0)
      warnings.push('No vendor price escalation is modeled; renewals usually rise.');
    if (positive(raw.buyLicensedUsers) === 0 && positive(raw.buySubscriptionPerUserMonth) > 0)
      warnings.push('A per-user price is entered but licensed users is zero.');
    if (recommendation === 'close')
      warnings.push(
        `The NPVs are within ${Math.round(CLOSE_CALL_SHARE * 100)}% of total cost; decide on the non-financial checklist and evidence quality.`,
      );
  }

  return {
    configured,
    buyInitialCost,
    buyAnnualCost,
    buyTotalCost,
    buyTotalBenefits,
    buyNpv,
    buyRoi,
    buildTotalCost: build.totalCosts,
    buildNpv: build.npv,
    npvAdvantageOfBuild,
    tcoDifference: buyTotalCost - build.totalCosts,
    recommendation,
    annual,
    warnings,
  };
}

/** Linear heuristic: 5% reserve at health 100, rising to 30% at health 0. Not a benchmark. */
export function suggestTechnicalDebtReserveRate(technicalHealthScore: number): number {
  const risk = 1 - clamp(technicalHealthScore / 100);
  return (
    SUGGESTED_RESERVE_AT_BEST_HEALTH +
    risk * (SUGGESTED_RESERVE_AT_WORST_HEALTH - SUGGESTED_RESERVE_AT_BEST_HEALTH)
  );
}

/** Which value type each recurring benefit line belongs to. */
export const BENEFIT_LINE_TYPES: Record<keyof BenefitBreakdown, ValueTypeId> = {
  productivity: 'productivity',
  management: 'productivity',
  reconciliation: 'productivity',
  capacity: 'capacity',
  contractorAvoidance: 'capacity',
  winRate: 'revenue',
  opportunityCoverage: 'revenue',
  riskReduction: 'risk',
  costReduction: 'costReduction',
  retention: 'retention',
  cycleTime: 'cycleTime',
  cashAcceleration: 'cashAcceleration',
  quality: 'quality',
  compliance: 'compliance',
  talent: 'talent',
  forecast: 'forecast',
  customerExperience: 'customerExperience',
  techDebt: 'techDebt',
};

/** Share of year `yearIndex` (0-based) after `startMonths` have passed. */
const activeShare = (startMonths: number, yearIndex: number) =>
  clamp((12 * (yearIndex + 1) - startMonths) / 12, 0, 1);

interface BenefitStreams {
  /** Run-rate recurring benefits, excluding the delayed hard cost reduction. */
  recurring: number;
  /** Hard cost reduction run rate, counted only after `delayMonths`. */
  delayed: number;
  delayMonths: number;
  oneTimeMonthly: number;
  oneTimeMonths: number;
}

interface CashFlows {
  annualBreakdown: AnnualBreakdown[];
  totalBenefits: number;
  totalCosts: number;
  npv: number;
}

function projectCashFlows(
  raw: Inputs,
  years: number,
  streams: BenefitStreams,
  initialCost: number,
  annualRunCost: number,
): CashFlows {
  let cumulativeNet = -initialCost,
    npv = -initialCost,
    totalBenefits = 0,
    recurringCosts = 0;
  const annualBreakdown = Array.from({ length: years }, (_, i) => {
    const year = i + 1;
    const oneTimeBenefits = streams.oneTimeMonthly * clamp(streams.oneTimeMonths - i * 12, 0, 12);
    const recurring = streams.recurring + streams.delayed * activeShare(streams.delayMonths, i);
    const benefits = recurring * Math.pow(1 + raw.benefitsGrowthRate, i) + oneTimeBenefits;
    const costs = annualRunCost * Math.pow(1 + raw.costGrowthRate, i);
    totalBenefits += benefits;
    recurringCosts += costs;
    const net = benefits - costs;
    cumulativeNet += net;
    const discountedNet = net / Math.pow(1 + positive(raw.discountRate), year);
    npv += discountedNet;
    return { year, benefits, oneTimeBenefits, costs, net, discountedNet, cumulativeNet };
  });
  return { annualBreakdown, totalBenefits, totalCosts: initialCost + recurringCosts, npv };
}

export function calculateBusinessCase(raw: Inputs): Results {
  const adoption = clamp(raw.adoptionRate),
    realization = clamp(raw.realizationRate),
    capRealization = clamp(raw.capacityRealizationRate);
  const grossMargin = clamp(raw.grossMargin),
    contribution = clamp(raw.contributionRate),
    years = clampHorizonYears(raw.horizonYears);
  const costOfCapital = positive(raw.discountRate);
  /** 1 while a value type is claimed, 0 otherwise: unclaimed types contribute nothing. */
  const gate = (id: ValueTypeId) => (isClaimed(raw, id) ? 1 : 0);
  const productivityOn = gate('productivity'),
    capacityOn = gate('capacity'),
    revenueOn = gate('revenue');
  const productivity =
    productivityOn *
    raw.users *
    (raw.minutesSavedPerUserWeek / 60) *
    raw.loadedHourlyRate *
    raw.workWeeks *
    adoption *
    realization;
  const management =
    productivityOn *
    raw.managers *
    raw.managerHoursSavedMonth *
    12 *
    raw.managerHourlyRate *
    adoption *
    realization;
  const reconciliation =
    productivityOn *
    raw.reconciliationHoursSavedMonth *
    12 *
    raw.analystHourlyRate *
    adoption *
    realization;
  const capacity =
    capacityOn * raw.capacityHoursRecoveredYear * raw.loadedHourlyRate * capRealization * adoption;
  const contractorAvoidance =
    capacityOn * raw.contractorHoursAvoided * raw.contractorHourlyRate * adoption;
  // Deferred hiring is a one-time saving: the loaded cost of each deferred FTE is avoided only
  // for the months the hire is postponed, starting at go-live. It is not a recurring benefit.
  const hiringDeferralMonthly =
    capacityOn * positive(raw.deferredHires) * positive(raw.monthlyLoadedFteCost) * adoption;
  const deferralMonths = positive(raw.monthsDeferred);
  const winRate =
    revenueOn *
    raw.influencedPipeline *
    positive(raw.incrementalWinRate) *
    grossMargin *
    contribution *
    adoption;
  const opportunityCoverage =
    revenueOn *
    raw.additionalOpportunities *
    raw.averageDealValue *
    clamp(raw.opportunityWinRate) *
    grossMargin *
    contribution *
    adoption;
  const riskReduction =
    gate('risk') * raw.riskExposure * clamp(raw.riskProbability) * clamp(raw.riskReduction);

  // Additional value types. Each is a year-one recurring value.
  // Hard cost reduction counts only from the month the contracts end (no adoption factor: a
  // cancelled contract is cancelled for everyone).
  const costReductionRunRate = gate('costReduction') * positive(raw.costRetiredSpend);
  const costExitMonths = positive(raw.costMonthsToExit);
  const costReduction = costReductionRunRate * activeShare(costExitMonths, 0);
  const retention =
    gate('retention') *
    positive(raw.retentionArr) *
    clamp(raw.retentionLift) *
    grossMargin *
    clamp(raw.retentionAttribution) *
    adoption;
  // Revenue that closes sooner is not new revenue: only its timing value counts, priced at the
  // cost of capital (the discount rate).
  const cycleTime =
    gate('cycleTime') *
    positive(raw.cycleTimeRevenue) *
    grossMargin *
    (positive(raw.cycleTimeDaysSaved) / 365) *
    costOfCapital *
    adoption;
  // Collecting cash sooner releases working capital once; the recurring benefit is the financing
  // cost saved on that balance.
  const workingCapitalReleased =
    gate('cashAcceleration') *
    positive(raw.cashAnnualBilled) *
    (positive(raw.cashDaysFaster) / 365) *
    adoption;
  const cashAcceleration = workingCapitalReleased * costOfCapital;
  const quality =
    gate('quality') *
    (positive(raw.reworkHoursMonth) * 12 * raw.loadedHourlyRate * realization +
      positive(raw.errorsAvoidedYear) * positive(raw.costPerError)) *
    adoption;
  const compliance =
    gate('compliance') *
    (positive(raw.auditPrepHoursYear) * raw.analystHourlyRate * adoption +
      positive(raw.auditExternalSavings));
  const hoursPerWeek = raw.workWeeks > 0 ? raw.annualProductiveHours / raw.workWeeks : 0;
  const talent =
    gate('talent') *
    (positive(raw.rampHiresYear) *
      positive(raw.rampWeeksSaved) *
      hoursPerWeek *
      raw.loadedHourlyRate *
      realization +
      positive(raw.attritionAvoidedYear) * positive(raw.replacementCost)) *
    adoption;
  const forecast =
    gate('forecast') * positive(raw.forecastMissCost) * clamp(raw.forecastImprovement) * adoption;
  const customerExperience =
    gate('customerExperience') *
    positive(raw.cxContactsAvoidedYear) *
    positive(raw.cxCostPerContact) *
    adoption;
  const techDebt =
    gate('techDebt') *
    (positive(raw.techDebtHoursYear) * raw.supportHourlyRate + positive(raw.techDebtRetiredSpend));
  const strategicValue = gate('strategic') * positive(raw.strategicAnnualValue);

  const benefitBreakdown: BenefitBreakdown = {
    productivity,
    management,
    reconciliation,
    capacity,
    contractorAvoidance,
    winRate,
    opportunityCoverage,
    riskReduction,
    costReduction,
    retention,
    cycleTime,
    cashAcceleration,
    quality,
    compliance,
    talent,
    forecast,
    customerExperience,
    techDebt,
  };
  const annualBenefits = Object.values(benefitBreakdown).reduce((a, b) => a + b, 0);

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

  const streams = (include: (id: ValueTypeId) => boolean): BenefitStreams => {
    let recurring = 0;
    for (const [line, value] of Object.entries(benefitBreakdown) as [
      keyof BenefitBreakdown,
      number,
    ][])
      if (line !== 'costReduction' && include(BENEFIT_LINE_TYPES[line])) recurring += value;
    return {
      recurring,
      delayed: include('costReduction') ? costReductionRunRate : 0,
      delayMonths: costExitMonths,
      oneTimeMonthly: include('capacity') ? hiringDeferralMonthly : 0,
      oneTimeMonths: deferralMonths,
    };
  };
  const fullStreams = streams(() => true);
  const { annualBreakdown, totalBenefits, totalCosts, npv } = projectCashFlows(
    raw,
    years,
    fullStreams,
    initialCost,
    annualRunCost,
  );
  const netBenefit = totalBenefits - totalCosts;
  const roi = totalCosts ? netBenefit / totalCosts : 0,
    benefitCostRatio = totalCosts ? totalBenefits / totalCosts : 0;
  const paybackMonths = calculatePaybackMonths({
    initialCost,
    annualRecurringBenefits: fullStreams.recurring,
    annualRunCost,
    benefitsGrowthRate: raw.benefitsGrowthRate,
    costGrowthRate: raw.costGrowthRate,
    oneTimeMonthly: hiringDeferralMonthly,
    oneTimeMonths: deferralMonths,
    delayedAnnualBenefits: costReductionRunRate,
    delayedStartMonths: costExitMonths,
  });

  // Claims by value type, and the case Finance will underwrite (soft claims removed).
  const typeValues = new Map<ValueTypeId, number>();
  for (const [line, value] of Object.entries(benefitBreakdown) as [
    keyof BenefitBreakdown,
    number,
  ][])
    typeValues.set(
      BENEFIT_LINE_TYPES[line],
      (typeValues.get(BENEFIT_LINE_TYPES[line]) ?? 0) + value,
    );
  typeValues.set('capacity', (typeValues.get('capacity') ?? 0) + hiringDeferral);
  typeValues.set('strategic', strategicValue);
  const claims: ClaimResult[] = VALUE_TYPES.filter((t) => isClaimed(raw, t.id)).map((t) => ({
    id: t.id,
    evidence: evidenceOf(raw, t.id),
    value: typeValues.get(t.id) ?? 0,
    countsTowardRoi: t.countsTowardRoi,
  }));
  const evidenceBreakdown: EvidenceBreakdown = { hard: 0, semiHard: 0, soft: 0 };
  for (const c of claims) {
    if (!c.countsTowardRoi) continue;
    if (c.evidence === 'hard') evidenceBreakdown.hard += c.value;
    else if (c.evidence === 'semi-hard') evidenceBreakdown.semiHard += c.value;
    else evidenceBreakdown.soft += c.value;
  }
  const claimedValue = evidenceBreakdown.hard + evidenceBreakdown.semiHard + evidenceBreakdown.soft;
  const evidenceBackedShare =
    claimedValue > 0 ? (evidenceBreakdown.hard + evidenceBreakdown.semiHard) / claimedValue : null;
  const backed = projectCashFlows(
    raw,
    years,
    streams((id) => getValueType(id).countsTowardRoi && evidenceOf(raw, id) !== 'soft'),
    initialCost,
    annualRunCost,
  );
  const evidenceBackedRoi = backed.totalCosts
    ? (backed.totalBenefits - backed.totalCosts) / backed.totalCosts
    : 0;

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
    claims,
    evidenceBreakdown,
    evidenceBackedShare,
    evidenceBackedNpv: backed.npv,
    evidenceBackedRoi,
    strategicValue,
    workingCapitalReleased,
    benefitBreakdown,
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
    buildVsBuy: calculateBuildVsBuy(raw, { years, annualBreakdown, totalCosts, npv }),
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
