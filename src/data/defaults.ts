import type { AssumptionItem, Inputs, ScenarioName } from '../types';
import {
  BASELINE_KEYS,
  CLAIM_KEYS,
  EVIDENCE_KEYS,
  VALUE_TYPES,
  claimInputs,
  type ValueTypeId,
} from './valueTypes';

/** Value types claimed by the sample case and by drafts saved before v0.6.0. */
export const CORE_VALUE_TYPES: readonly ValueTypeId[] = VALUE_TYPES.filter((t) => t.core).map(
  (t) => t.id,
);

export const defaultInputs: Inputs = {
  applicationName: 'Internal Workflow Application',
  sponsor: 'Business Operations',
  department: 'Shared Services',
  lifecycleStage: 'MVP',
  currency: 'USD',
  horizonYears: 3,
  discountRate: 0.08,
  benefitsGrowthRate: 0.04,
  costGrowthRate: 0.03,
  users: 80,
  managers: 8,
  loadedHourlyRate: 85,
  managerHourlyRate: 110,
  workWeeks: 48,
  annualProductiveHours: 1880,
  adoptionRate: 0.75,
  realizationRate: 0.7,
  minutesSavedPerUserWeek: 35,
  managerHoursSavedMonth: 5,
  reconciliationHoursSavedMonth: 18,
  analystHourlyRate: 95,
  capacityHoursRecoveredYear: 900,
  capacityRealizationRate: 0.6,
  contractorHoursAvoided: 120,
  contractorHourlyRate: 165,
  deferredHires: 0.5,
  monthsDeferred: 6,
  monthlyLoadedFteCost: 14500,
  influencedPipeline: 4_000_000,
  incrementalWinRate: 0.005,
  grossMargin: 0.8,
  contributionRate: 0.15,
  additionalOpportunities: 6,
  averageDealValue: 120000,
  opportunityWinRate: 0.22,
  riskExposure: 150000,
  riskProbability: 0.2,
  riskReduction: 0.25,
  // Illustrative figures for the additional value types. They are not claimed in the sample, so
  // they do not change its results until a claim is switched on.
  costRetiredSpend: 24000,
  costMonthsToExit: 4,
  retentionArr: 2_000_000,
  retentionLift: 0.01,
  retentionAttribution: 0.15,
  cycleTimeRevenue: 3_000_000,
  cycleTimeDaysSaved: 10,
  cashAnnualBilled: 6_000_000,
  cashDaysFaster: 5,
  reworkHoursMonth: 40,
  errorsAvoidedYear: 24,
  costPerError: 1500,
  auditPrepHoursYear: 200,
  auditExternalSavings: 10000,
  rampHiresYear: 12,
  rampWeeksSaved: 2,
  attritionAvoidedYear: 1,
  replacementCost: 40000,
  forecastMissCost: 100000,
  forecastImprovement: 0.1,
  cxContactsAvoidedYear: 2000,
  cxCostPerContact: 8,
  techDebtHoursYear: 150,
  techDebtRetiredSpend: 6000,
  strategicAnnualValue: 50000,
  pilotSuccessThreshold:
    'A 10-person pilot saves at least 25 minutes per user per week over six weeks.',
  killCriterion: 'Stop if adoption is below 40% after 90 days.',
  ...claimInputs(CORE_VALUE_TYPES, {
    productivity: 'Time study of 12 users, before and after',
    capacity: 'Contractor invoices, last 12 months',
    revenue: 'CRM opportunity history',
    risk: 'Operational risk register',
  }),
  initialLaborHours: 650,
  initialLaborRate: 95,
  discoveryHours: 60,
  architectureHours: 80,
  testingHours: 120,
  securityReviewHours: 40,
  documentationHours: 45,
  trainingHours: 24,
  aiInputTokens: 18_000_000,
  aiOutputTokens: 4_000_000,
  aiCachedTokens: 8_000_000,
  aiInputRatePerMillion: 3,
  aiOutputRatePerMillion: 15,
  aiCachedRatePerMillion: 0.75,
  aiSubscriptions: 1200,
  aiPromptingHours: 80,
  aiReviewHours: 120,
  aiDebuggingHours: 90,
  aiSecurityRemediationHours: 30,
  traditionalBuildHours: 1250,
  traditionalBuildRate: 115,
  monthsAccelerated: 3,
  otherInitialCost: 18000,
  monthlyHosting: 850,
  monthlyDatabase: 300,
  monthlyMonitoring: 180,
  monthlyAiRuntime: 250,
  monthlySupportHours: 18,
  supportHourlyRate: 100,
  annualMaintenance: 20000,
  annualEnhancements: 16000,
  annualGovernance: 8000,
  annualSecurity: 9000,
  annualTraining: 4000,
  technicalDebtReserveRate: 0.15,
  architectureScore: 2,
  testingScore: 3,
  documentationScore: 3,
  securityScore: 2,
  dependencyScore: 2,
  deploymentScore: 2,
  observabilityScore: 3,
  ownershipScore: 4,
  integrationScore: 3,
  portabilityScore: 3,
  actualAdoptionRate: 0.62,
  actualAnnualBenefits: 110000,
  actualAnnualRunCost: 76000,
  actualInitialCost: 92000,
  monthsSinceLaunch: 6,
  // Illustrative commercial alternative: replace with a real vendor quote.
  buySubscriptionPerUserMonth: 55,
  buyLicensedUsers: 88,
  buyAnnualPlatformFee: 12000,
  buyAnnualAdministration: 15000,
  buyImplementationCost: 40000,
  buyIntegrationCost: 30000,
  buyTrainingCost: 10000,
  buyPriceGrowthRate: 0.07,
  buyBenefitFit: 0.75,
  bvbFunctionalFit: 0,
  bvbExtensibility: 0,
  bvbDataOwnership: 0,
  bvbVendorLockIn: 0,
  bvbExitCost: 0,
  bvbSecurity: 0,
};

/**
 * Model conventions kept on a blank case: they describe how the model is evaluated, not the
 * initiative, and zeroing them would make the model meaningless (a 0-year horizon, 0 work weeks).
 * Everything else starts at zero or empty so no sample figure leaks into a real case.
 */
export const BLANK_MODEL_SETTINGS = {
  currency: 'USD',
  horizonYears: 3,
  discountRate: 0.08,
  workWeeks: 48,
  annualProductiveHours: 1880,
} as const satisfies Partial<Inputs>;

/** Neutral technical-health score (3, "Moderate") used until the user assesses each area. */
export const UNASSESSED_SCORE = 3;

/** An empty business case: no names, no figures, neutral technical-health scores. */
export const blankInputs: Inputs = (() => {
  const blank = { ...defaultInputs };
  for (const key of Object.keys(blank) as (keyof Inputs)[]) {
    const value = blank[key];
    if (typeof value === 'string') (blank[key] as string) = '';
    else if (key.endsWith('Score')) (blank[key] as number) = UNASSESSED_SCORE;
    else (blank[key] as number) = 0;
  }
  return { ...blank, ...BLANK_MODEL_SETTINGS };
})();

/** Commercial cost inputs; when all are zero the build-vs-buy comparison is not configured. */
export const BUY_COST_KEYS = [
  'buySubscriptionPerUserMonth',
  'buyAnnualPlatformFee',
  'buyAnnualAdministration',
  'buyImplementationCost',
  'buyIntegrationCost',
  'buyTrainingCost',
] as const satisfies readonly (keyof Inputs)[];

/** Every input added for build versus buy (v0.4.0). Drafts saved earlier have none of them. */
export const BUILD_VS_BUY_KEYS = [
  ...BUY_COST_KEYS,
  'buyLicensedUsers',
  'buyPriceGrowthRate',
  'buyBenefitFit',
  'bvbFunctionalFit',
  'bvbExtensibility',
  'bvbDataOwnership',
  'bvbVendorLockIn',
  'bvbExitCost',
  'bvbSecurity',
] as const satisfies readonly (keyof Inputs)[];

/** Inputs for the additional value types (v0.6.0). Drafts saved earlier have none of them. */
export const VALUE_TYPE_DRIVER_KEYS = [
  'costRetiredSpend',
  'costMonthsToExit',
  'retentionArr',
  'retentionLift',
  'retentionAttribution',
  'cycleTimeRevenue',
  'cycleTimeDaysSaved',
  'cashAnnualBilled',
  'cashDaysFaster',
  'reworkHoursMonth',
  'errorsAvoidedYear',
  'costPerError',
  'auditPrepHoursYear',
  'auditExternalSavings',
  'rampHiresYear',
  'rampWeeksSaved',
  'attritionAvoidedYear',
  'replacementCost',
  'forecastMissCost',
  'forecastImprovement',
  'cxContactsAvoidedYear',
  'cxCostPerContact',
  'techDebtHoursYear',
  'techDebtRetiredSpend',
  'strategicAnnualValue',
  'pilotSuccessThreshold',
  'killCriterion',
] as const satisfies readonly (keyof Inputs)[];

/** Every input added for value claims (v0.6.0): drivers plus claim, evidence, and baseline. */
export const VALUE_CLAIM_KEYS: readonly (keyof Inputs)[] = [
  ...VALUE_TYPE_DRIVER_KEYS,
  ...CLAIM_KEYS,
  ...EVIDENCE_KEYS,
  ...BASELINE_KEYS,
];

/** Assumption-register category that records evidence for the commercial alternative. */
export const BUILD_VS_BUY_CATEGORY = 'Build vs buy';

export const defaultAssumptions: AssumptionItem[] = [
  {
    id: 'a1',
    name: '75% user adoption in year one',
    category: 'Adoption',
    owner: 'Product owner',
    source: 'Pilot estimate',
    confidence: 'Estimated',
    status: 'Reviewed',
  },
  {
    id: 'a2',
    name: '35 minutes saved per user each week',
    category: 'Productivity',
    owner: 'Operations',
    source: 'Time study',
    confidence: 'Validated',
    status: 'Approved',
  },
  {
    id: 'a3',
    name: '0.5% incremental win-rate effect',
    category: 'Revenue',
    owner: 'Sales operations',
    source: 'Proxy model',
    confidence: 'Proxy',
    status: 'Draft',
  },
  {
    id: 'a4',
    name: '15% technical debt reserve',
    category: 'Technology',
    owner: 'Engineering',
    source: 'Architecture review',
    confidence: 'Estimated',
    status: 'Reviewed',
  },
  {
    id: 'a5',
    name: '3-month faster time to value',
    category: 'AI delivery',
    owner: 'Engineering',
    source: 'Traditional estimate comparison',
    confidence: 'Estimated',
    status: 'Draft',
  },
  {
    id: 'a6',
    name: 'Vendor pricing and 75% benefit fit',
    category: BUILD_VS_BUY_CATEGORY,
    owner: 'Procurement',
    source: 'Illustrative; replace with a written vendor quote',
    confidence: 'Speculative',
    status: 'Draft',
  },
];

export const SCENARIO_MULTIPLIERS: Record<ScenarioName, Partial<Record<keyof Inputs, number>>> = {
  Conservative: {
    adoptionRate: 0.8,
    realizationRate: 0.8,
    capacityHoursRecoveredYear: 0.7,
    incrementalWinRate: 0.5,
    contributionRate: 0.75,
    additionalOpportunities: 0.7,
    costMonthsToExit: 1.5,
    retentionLift: 0.5,
    retentionAttribution: 0.75,
    cycleTimeDaysSaved: 0.7,
    reworkHoursMonth: 0.8,
    errorsAvoidedYear: 0.8,
    rampWeeksSaved: 0.7,
    attritionAvoidedYear: 0.5,
    forecastImprovement: 0.5,
    cxContactsAvoidedYear: 0.7,
    techDebtHoursYear: 0.8,
    annualMaintenance: 1.2,
    annualEnhancements: 1.2,
    technicalDebtReserveRate: 1.2,
  },
  Expected: {},
  Upside: {
    adoptionRate: 1.15,
    realizationRate: 1.1,
    capacityHoursRecoveredYear: 1.25,
    incrementalWinRate: 1.5,
    contributionRate: 1.15,
    additionalOpportunities: 1.25,
    costMonthsToExit: 0.75,
    retentionLift: 1.25,
    retentionAttribution: 1.15,
    cycleTimeDaysSaved: 1.25,
    reworkHoursMonth: 1.15,
    errorsAvoidedYear: 1.15,
    rampWeeksSaved: 1.25,
    attritionAvoidedYear: 1.25,
    forecastImprovement: 1.25,
    cxContactsAvoidedYear: 1.2,
    techDebtHoursYear: 1.15,
    annualMaintenance: 0.9,
    technicalDebtReserveRate: 0.85,
  },
};

/** Inputs that represent a share (0–100%) and must never exceed 1. */
export const RATE_KEYS = [
  'adoptionRate',
  'realizationRate',
  'capacityRealizationRate',
  'contributionRate',
  'grossMargin',
  'opportunityWinRate',
  'riskProbability',
  'riskReduction',
  'actualAdoptionRate',
  'buyBenefitFit',
  'retentionLift',
  'retentionAttribution',
  'forecastImprovement',
] as const satisfies readonly (keyof Inputs)[];

export const SCENARIOS: readonly ScenarioName[] = ['Conservative', 'Expected', 'Upside'];

export function applyScenario(base: Inputs, scenario: ScenarioName): Inputs {
  const next = { ...base };
  for (const [key, multiplier] of Object.entries(SCENARIO_MULTIPLIERS[scenario])) {
    const typedKey = key as keyof Inputs;
    if (typeof base[typedKey] === 'number')
      (next[typedKey] as number) = Number(base[typedKey]) * Number(multiplier);
  }
  for (const key of RATE_KEYS) next[key] = Math.min(next[key], 1);
  return next;
}
