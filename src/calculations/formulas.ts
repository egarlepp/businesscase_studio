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
      'First month in which cumulative net value covers the initial cost; recurring benefits and costs grow annually and the hiring deferral applies only during its window',
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
    expression: 'Sum of the eight recurring benefit lines (year one)',
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
