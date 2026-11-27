import type { Inputs, Results } from '../types';

export type FormulaFormat = 'money' | 'percent' | 'months' | 'ratio' | 'score' | 'fte';

export interface FormulaDef {
  id: string;
  label: string;
  /** Human-readable expression. Must describe what `engine.ts` actually computes. */
  expression: string;
  /** Inputs read directly by this formula. Verified against the engine by formulas.test.ts. */
  inputs: (keyof Inputs)[];
  /** Other formulas this one is built from. Formulas without dependencies are "leaf" formulas. */
  dependsOn?: string[];
  format: FormulaFormat;
  value: (r: Results) => number | null;
}

const RECURRING_BENEFIT_IDS = [
  'productivity',
  'management',
  'reconciliation',
  'capacity',
  'contractorAvoidance',
  'winRate',
  'opportunityCoverage',
  'riskReduction',
  'costReduction',
  'retention',
  'cycleTime',
  'cashAcceleration',
  'quality',
  'compliance',
  'talent',
  'forecast',
  'customerExperience',
  'techDebt',
];

const BUILD_HOURS: (keyof Inputs)[] = [
  'initialLaborHours',
  'discoveryHours',
  'architectureHours',
  'testingHours',
  'securityReviewHours',
  'documentationHours',
  'trainingHours',
  'aiPromptingHours',
  'aiReviewHours',
  'aiDebuggingHours',
  'aiSecurityRemediationHours',
];
const AI_CASH: (keyof Inputs)[] = [
  'aiInputTokens',
  'aiOutputTokens',
  'aiCachedTokens',
  'aiInputRatePerMillion',
  'aiOutputRatePerMillion',
  'aiCachedRatePerMillion',
  'aiSubscriptions',
];
const BASE_RUN_COST: (keyof Inputs)[] = [
  'monthlyHosting',
  'monthlyDatabase',
  'monthlyMonitoring',
  'monthlyAiRuntime',
  'monthlySupportHours',
  'supportHourlyRate',
  'annualMaintenance',
  'annualEnhancements',
  'annualTraining',
  'annualGovernance',
  'annualSecurity',
];
const HEALTH_SCORES: (keyof Inputs)[] = [
  'architectureScore',
  'testingScore',
  'documentationScore',
  'securityScore',
  'dependencyScore',
  'deploymentScore',
  'observabilityScore',
  'ownershipScore',
  'integrationScore',
  'portabilityScore',
];

export const FORMULAS: FormulaDef[] = [
  {
    id: 'roi',
    label: 'ROI',
    expression: '(total benefits − total cost of ownership) ÷ total cost of ownership',
    inputs: [],
    dependsOn: ['totalBenefits', 'totalCosts'],
    format: 'percent',
    value: (r) => r.roi,
  },
  {
    id: 'npv',
    label: 'Net present value',
    expression:
      '−initial cost + Σ (benefits in year t − run cost in year t) ÷ (1 + discount rate)^t, with benefits and costs grown annually',
    inputs: ['discountRate', 'horizonYears', 'benefitsGrowthRate', 'costGrowthRate'],
    dependsOn: ['annualBenefits', 'hiringDeferral', 'initialCost', 'annualRunCost'],
    format: 'money',
    value: (r) => r.npv,
  },
  {
    id: 'paybackMonths',
    label: 'Payback',
    expression:
      'First month in which cumulative net value covers the initial cost; recurring benefits and costs grow annually, the hiring deferral applies only during its window, and a hard cost reduction starts in its exit month',
    inputs: ['benefitsGrowthRate', 'costGrowthRate'],
    dependsOn: ['initialCost', 'annualBenefits', 'annualRunCost', 'hiringDeferral'],
    format: 'months',
    value: (r) => r.paybackMonths,
  },
  {
    id: 'benefitCostRatio',
    label: 'Benefit-cost ratio',
    expression: 'total benefits ÷ total cost of ownership',
    inputs: [],
    dependsOn: ['totalBenefits', 'totalCosts'],
    format: 'ratio',
    value: (r) => r.benefitCostRatio,
  },
  {
    id: 'totalBenefits',
    label: 'Total benefits',
    expression:
      'Σ over the horizon of (recurring annual benefits × (1 + benefit growth)^(t−1)) + one-time hiring deferral',
    inputs: ['horizonYears', 'benefitsGrowthRate'],
    dependsOn: ['annualBenefits', 'hiringDeferral'],
    format: 'money',
    value: (r) => r.totalBenefits,
  },
  {
    id: 'totalCosts',
    label: 'Total cost of ownership',
    expression: 'initial cost + Σ over the horizon of (annual run cost × (1 + cost growth)^(t−1))',
    inputs: ['horizonYears', 'costGrowthRate'],
    dependsOn: ['initialCost', 'annualRunCost'],
    format: 'money',
    value: (r) => r.totalCosts,
  },
  {
    id: 'annualBenefits',
    label: 'Recurring annual benefits',
    expression:
      'Sum of the recurring benefit lines of every claimed value type (year one). Unclaimed types and strategic optionality count as zero.',
    inputs: [],
    dependsOn: RECURRING_BENEFIT_IDS,
    format: 'money',
    value: (r) => r.annualBenefits,
  },
  {
    id: 'productivity',
    label: 'Productivity',
    expression:
      'users × (minutes saved per week ÷ 60) × loaded hourly rate × working weeks × adoption × realization',
    inputs: [
      'users',
      'minutesSavedPerUserWeek',
      'loadedHourlyRate',
      'workWeeks',
      'adoptionRate',
      'realizationRate',
    ],
    format: 'money',
    value: (r) => r.benefitBreakdown.productivity,
  },
  {
    id: 'management',
    label: 'Management',
    expression: 'managers × hours saved per month × 12 × manager rate × adoption × realization',
    inputs: [
      'managers',
      'managerHoursSavedMonth',
      'managerHourlyRate',
      'adoptionRate',
      'realizationRate',
    ],
    format: 'money',
    value: (r) => r.benefitBreakdown.management,
  },
  {
    id: 'reconciliation',
    label: 'Reconciliation',
    expression: 'hours saved per month × 12 × analyst rate × adoption × realization',
    inputs: [
      'reconciliationHoursSavedMonth',
      'analystHourlyRate',
      'adoptionRate',
      'realizationRate',
    ],
    format: 'money',
    value: (r) => r.benefitBreakdown.reconciliation,
  },
  {
    id: 'capacity',
    label: 'Recovered capacity',
    expression: 'capacity hours per year × loaded hourly rate × capacity realization × adoption',
    inputs: [
      'capacityHoursRecoveredYear',
      'loadedHourlyRate',
      'capacityRealizationRate',
      'adoptionRate',
    ],
    format: 'money',
    value: (r) => r.benefitBreakdown.capacity,
  },
  {
    id: 'contractorAvoidance',
    label: 'Contractor avoidance',
    expression: 'contractor hours avoided × contractor rate × adoption',
    inputs: ['contractorHoursAvoided', 'contractorHourlyRate', 'adoptionRate'],
    format: 'money',
    value: (r) => r.benefitBreakdown.contractorAvoidance,
  },
  {
    id: 'winRate',
    label: 'Win-rate influence',
    expression:
      'influenced pipeline × incremental win rate × gross margin × contribution × adoption',
    inputs: [
      'influencedPipeline',
      'incrementalWinRate',
      'grossMargin',
      'contributionRate',
      'adoptionRate',
    ],
    format: 'money',
    value: (r) => r.benefitBreakdown.winRate,
  },
  {
    id: 'opportunityCoverage',
    label: 'Opportunity coverage',
    expression:
      'additional opportunities × average deal value × win rate × gross margin × contribution × adoption',
    inputs: [
      'additionalOpportunities',
      'averageDealValue',
      'opportunityWinRate',
      'grossMargin',
      'contributionRate',
      'adoptionRate',
    ],
    format: 'money',
    value: (r) => r.benefitBreakdown.opportunityCoverage,
  },
  {
    id: 'riskReduction',
    label: 'Risk reduction',
    expression: 'financial exposure × probability × expected risk reduction',
    inputs: ['riskExposure', 'riskProbability', 'riskReduction'],
    format: 'money',
    value: (r) => r.benefitBreakdown.riskReduction,
  },
  {
    id: 'costReduction',
    label: 'Hard cost reduction',
    expression:
      'annual spend retired × share of year one after the contract exit month (full run rate from year two)',
    inputs: ['costRetiredSpend', 'costMonthsToExit'],
    format: 'money',
    value: (r) => r.benefitBreakdown.costReduction,
  },
  {
    id: 'retention',
    label: 'Retention and expansion',
    expression: 'ARR in scope × retention lift × gross margin × attribution × adoption',
    inputs: [
      'retentionArr',
      'retentionLift',
      'grossMargin',
      'retentionAttribution',
      'adoptionRate',
    ],
    format: 'money',
    value: (r) => r.benefitBreakdown.retention,
  },
  {
    id: 'cycleTime',
    label: 'Cycle-time compression',
    expression:
      'revenue through the process × gross margin × (days saved ÷ 365) × discount rate × adoption: the timing value of earlier revenue, not new revenue',
    inputs: [
      'cycleTimeRevenue',
      'grossMargin',
      'cycleTimeDaysSaved',
      'discountRate',
      'adoptionRate',
    ],
    format: 'money',
    value: (r) => r.benefitBreakdown.cycleTime,
  },
  {
    id: 'cashAcceleration',
    label: 'Cash acceleration',
    expression:
      'annual billed revenue × (days faster ÷ 365) × adoption × discount rate: financing cost saved on the working capital released',
    inputs: ['cashAnnualBilled', 'cashDaysFaster', 'adoptionRate', 'discountRate'],
    format: 'money',
    value: (r) => r.benefitBreakdown.cashAcceleration,
  },
  {
    id: 'workingCapitalReleased',
    label: 'Working capital released',
    expression:
      'annual billed revenue × (days faster ÷ 365) × adoption (one-time, balance sheet; shown for context, not added to totals)',
    inputs: ['cashAnnualBilled', 'cashDaysFaster', 'adoptionRate'],
    format: 'money',
    value: (r) => r.workingCapitalReleased,
  },
  {
    id: 'quality',
    label: 'Quality and rework',
    expression:
      '(rework hours per month × 12 × loaded hourly rate × realization + errors avoided × cost per error) × adoption',
    inputs: [
      'reworkHoursMonth',
      'loadedHourlyRate',
      'realizationRate',
      'errorsAvoidedYear',
      'costPerError',
      'adoptionRate',
    ],
    format: 'money',
    value: (r) => r.benefitBreakdown.quality,
  },
  {
    id: 'compliance',
    label: 'Compliance and audit readiness',
    expression: 'audit prep hours saved × analyst rate × adoption + external audit fees that stop',
    inputs: ['auditPrepHoursYear', 'analystHourlyRate', 'adoptionRate', 'auditExternalSavings'],
    format: 'money',
    value: (r) => r.benefitBreakdown.compliance,
  },
  {
    id: 'talent',
    label: 'Employee ramp and retention',
    expression:
      '(new hires × weeks of ramp saved × productive hours per week × loaded hourly rate × realization + regretted departures avoided × replacement cost) × adoption',
    inputs: [
      'rampHiresYear',
      'rampWeeksSaved',
      'annualProductiveHours',
      'workWeeks',
      'loadedHourlyRate',
      'realizationRate',
      'attritionAvoidedYear',
      'replacementCost',
      'adoptionRate',
    ],
    format: 'money',
    value: (r) => r.benefitBreakdown.talent,
  },
  {
    id: 'forecast',
    label: 'Forecast and decision quality',
    expression: 'annual cost of forecast misses × improvement × adoption',
    inputs: ['forecastMissCost', 'forecastImprovement', 'adoptionRate'],
    format: 'money',
    value: (r) => r.benefitBreakdown.forecast,
  },
  {
    id: 'customerExperience',
    label: 'Customer experience',
    expression: 'support contacts avoided × cost per contact × adoption',
    inputs: ['cxContactsAvoidedYear', 'cxCostPerContact', 'adoptionRate'],
    format: 'money',
    value: (r) => r.benefitBreakdown.customerExperience,
  },
  {
    id: 'techDebt',
    label: 'Tech debt and consolidation',
    expression: 'maintenance hours retired × support hourly rate + annual spend on retired tools',
    inputs: ['techDebtHoursYear', 'supportHourlyRate', 'techDebtRetiredSpend'],
    format: 'money',
    value: (r) => r.benefitBreakdown.techDebt,
  },
  {
    id: 'strategicValue',
    label: 'Strategic optionality',
    expression: 'stated annual strategic value (reported beside the case, never added to totals)',
    inputs: ['strategicAnnualValue'],
    format: 'money',
    value: (r) => r.strategicValue,
  },
  {
    id: 'evidenceBackedShare',
    label: 'Evidence-backed share',
    expression:
      '(hard + semi-hard claims) ÷ all claimed year-one value, using each claim’s evidence class',
    inputs: [],
    dependsOn: ['annualBenefits', 'hiringDeferral'],
    format: 'percent',
    value: (r) => r.evidenceBackedShare,
  },
  {
    id: 'evidenceBackedNpv',
    label: 'Evidence-backed NPV',
    expression: 'NPV recalculated with every soft claim removed: the case Finance will underwrite',
    inputs: ['discountRate', 'horizonYears', 'benefitsGrowthRate', 'costGrowthRate'],
    dependsOn: ['annualBenefits', 'hiringDeferral', 'initialCost', 'annualRunCost'],
    format: 'money',
    value: (r) => r.evidenceBackedNpv,
  },
  {
    id: 'evidenceBackedRoi',
    label: 'Evidence-backed ROI',
    expression: 'ROI recalculated with every soft claim removed',
    inputs: [],
    dependsOn: ['evidenceBackedNpv', 'totalCosts'],
    format: 'percent',
    value: (r) => r.evidenceBackedRoi,
  },
  {
    id: 'hiringDeferral',
    label: 'One-time hiring deferral',
    expression:
      'FTE hires deferred × monthly loaded FTE cost × adoption × min(months deferred, horizon in months)',
    inputs: [
      'deferredHires',
      'monthlyLoadedFteCost',
      'adoptionRate',
      'monthsDeferred',
      'horizonYears',
    ],
    format: 'money',
    value: (r) => r.oneTimeBenefitBreakdown.hiringDeferral,
  },
  {
    id: 'initialCost',
    label: 'Initial investment',
    expression:
      '(all build and AI-oversight hours × build rate) + AI token and subscription cost + other initial costs',
    inputs: [...BUILD_HOURS, 'initialLaborRate', ...AI_CASH, 'otherInitialCost'],
    format: 'money',
    value: (r) => r.initialCost,
  },
  {
    id: 'annualRunCost',
    label: 'Annual run cost',
    expression:
      '(platform × 12 + support hours × rate × 12 + maintenance, enhancements, training, governance, security) × (1 + technical-debt reserve)',
    inputs: [...BASE_RUN_COST, 'technicalDebtReserveRate'],
    format: 'money',
    value: (r) => r.annualRunCost,
  },
  {
    id: 'technicalDebt',
    label: 'Technical-debt reserve',
    expression: 'base annual run cost × technical-debt reserve %',
    inputs: [...BASE_RUN_COST, 'technicalDebtReserveRate'],
    format: 'money',
    value: (r) => r.costBreakdown.technicalDebt,
  },
  {
    id: 'aiAssistedBuildCost',
    label: 'AI-assisted build cost',
    expression: '(all build and AI-oversight hours × build rate) + AI token and subscription cost',
    inputs: [...BUILD_HOURS, 'initialLaborRate', ...AI_CASH],
    format: 'money',
    value: (r) => r.aiAssistedBuildCost,
  },
  {
    id: 'traditionalBuildCost',
    label: 'Traditional build estimate',
    expression: 'traditional build hours × traditional hourly rate',
    inputs: ['traditionalBuildHours', 'traditionalBuildRate'],
    format: 'money',
    value: (r) => r.traditionalBuildCost,
  },
  {
    id: 'timeToMarketBenefit',
    label: 'Time-to-market value',
    expression:
      'months accelerated × recurring annual benefits ÷ 12 (shown for context, not added to totals)',
    inputs: ['monthsAccelerated'],
    dependsOn: ['annualBenefits'],
    format: 'money',
    value: (r) => r.timeToMarketBenefit,
  },
  {
    id: 'buyTotalCost',
    label: 'Commercial TCO',
    expression:
      'implementation + integration + training + Σ over the horizon of ((per-user price × 12 × licensed users + platform fee + administration) × (1 + vendor price growth)^(t−1))',
    inputs: [
      'buyImplementationCost',
      'buyIntegrationCost',
      'buyTrainingCost',
      'buySubscriptionPerUserMonth',
      'buyLicensedUsers',
      'buyAnnualPlatformFee',
      'buyAnnualAdministration',
      'buyPriceGrowthRate',
      'horizonYears',
    ],
    format: 'money',
    value: (r) => r.buildVsBuy.buyTotalCost,
  },
  {
    id: 'buyNpv',
    label: 'Commercial NPV',
    expression:
      '−commercial one-time cost + Σ (build benefits in year t × benefit fit − commercial cost in year t) ÷ (1 + discount rate)^t',
    inputs: [
      'buyBenefitFit',
      'discountRate',
      'horizonYears',
      'benefitsGrowthRate',
      'buyPriceGrowthRate',
    ],
    dependsOn: ['annualBenefits', 'hiringDeferral', 'buyTotalCost'],
    format: 'money',
    value: (r) => r.buildVsBuy.buyNpv,
  },
  {
    id: 'npvAdvantageOfBuild',
    label: 'NPV advantage of building',
    expression: 'build NPV − commercial NPV (positive favors building)',
    inputs: [],
    dependsOn: ['npv', 'buyNpv'],
    format: 'money',
    value: (r) => r.buildVsBuy.npvAdvantageOfBuild,
  },
  {
    id: 'technicalHealthScore',
    label: 'Technical health',
    expression: '100 − ((average of the ten 1–5 scores − 1) ÷ 4) × 100',
    inputs: HEALTH_SCORES,
    format: 'score',
    value: (r) => r.technicalHealthScore,
  },
  {
    id: 'suggestedTechnicalDebtReserveRate',
    label: 'Suggested technical-debt reserve',
    expression: '5% + (1 − health ÷ 100) × 25% (heuristic, not applied automatically)',
    inputs: [],
    dependsOn: ['technicalHealthScore'],
    format: 'percent',
    value: (r) => r.suggestedTechnicalDebtReserveRate,
  },
  {
    id: 'equivalentFte',
    label: 'Recovered capacity (FTE)',
    expression: 'capacity hours recovered per year ÷ productive hours per FTE per year',
    inputs: ['capacityHoursRecoveredYear', 'annualProductiveHours'],
    format: 'fte',
    value: (r) => r.equivalentFte,
  },
];

const byId = new Map(FORMULAS.map((f) => [f.id, f]));

export function getFormula(id: string): FormulaDef | undefined {
  return byId.get(id);
}
