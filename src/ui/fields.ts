import type { Inputs } from '../types';
import {
  VALUE_TYPES,
  baselineKey,
  claimKey,
  evidenceKey,
  type ValueTypeId,
} from '../data/valueTypes';

export type Section =
  | 'Overview'
  | 'Profile'
  | 'Benefits'
  | 'TCO'
  | 'Build vs Buy'
  | 'AI Development'
  | 'Technical Health'
  | 'Scenarios'
  | 'Assumptions'
  | 'Actuals'
  | 'Reports';

export type FieldKind =
  | 'text'
  | 'number'
  | 'money'
  | 'percent'
  | 'score'
  | 'currency'
  | 'preference'
  /** Claim flag and evidence class: edited in the value-claims picker, not as a field. */
  | 'claim'
  | 'evidence';

export interface FieldDef {
  key: keyof Inputs;
  label: string;
  kind?: FieldKind;
}

export interface FieldGroup {
  title: string;
  description: string;
  fields: FieldDef[];
  /** Shown only while this value type is claimed. */
  valueType?: ValueTypeId;
}

/** Every editable input, grouped by the page and panel where it appears. */
export const FIELD_GROUPS: Partial<Record<Section, FieldGroup[]>> = {
  Profile: [
    {
      title: 'Application profile',
      description: 'Define the initiative, owner, scope, and financial horizon.',
      fields: [
        { key: 'applicationName', label: 'Application or initiative', kind: 'text' },
        { key: 'sponsor', label: 'Executive sponsor', kind: 'text' },
        { key: 'department', label: 'Department', kind: 'text' },
        { key: 'lifecycleStage', label: 'Lifecycle stage', kind: 'text' },
        { key: 'currency', label: 'Currency', kind: 'currency' },
        { key: 'horizonYears', label: 'Evaluation years' },
        { key: 'discountRate', label: 'Discount rate', kind: 'percent' },
        { key: 'benefitsGrowthRate', label: 'Annual benefit growth', kind: 'percent' },
        { key: 'costGrowthRate', label: 'Annual cost growth', kind: 'percent' },
      ],
    },
    {
      title: 'Organization and scope',
      description: 'Use segmented economics instead of one magical blended rate.',
      fields: [
        { key: 'users', label: 'Target users' },
        { key: 'managers', label: 'Managers' },
        { key: 'loadedHourlyRate', label: 'User loaded hourly rate', kind: 'money' },
        { key: 'managerHourlyRate', label: 'Manager loaded hourly rate', kind: 'money' },
        { key: 'analystHourlyRate', label: 'Analyst loaded hourly rate', kind: 'money' },
        { key: 'workWeeks', label: 'Working weeks/year' },
        { key: 'annualProductiveHours', label: 'Productive hours/FTE/year' },
      ],
    },
  ],
  Benefits: [
    {
      title: 'Shared factors',
      description:
        'Used by several claims. Adoption scales usage-driven value; gross margin converts revenue to profit.',
      fields: [
        { key: 'adoptionRate', label: 'Adoption rate', kind: 'percent' },
        { key: 'realizationRate', label: 'Realization factor', kind: 'percent' },
        { key: 'grossMargin', label: 'Gross margin', kind: 'percent' },
      ],
    },
    {
      title: 'Time saved',
      description: 'Time savings adjusted for adoption and realization.',
      valueType: 'productivity',
      fields: [
        { key: 'minutesSavedPerUserWeek', label: 'Minutes saved/user/week' },
        { key: 'managerHoursSavedMonth', label: 'Manager hours saved/month' },
        { key: 'reconciliationHoursSavedMonth', label: 'Reconciliation hours saved/month' },
      ],
    },
    {
      title: 'Capacity and workforce',
      description:
        'Value recovered capacity and contractor avoidance. Deferred hiring is a one-time saving.',
      valueType: 'capacity',
      fields: [
        { key: 'capacityHoursRecoveredYear', label: 'Capacity hours recovered/year' },
        { key: 'capacityRealizationRate', label: 'Capacity realization', kind: 'percent' },
        { key: 'contractorHoursAvoided', label: 'Contractor hours avoided' },
        { key: 'contractorHourlyRate', label: 'Contractor rate', kind: 'money' },
        { key: 'deferredHires', label: 'FTE hires deferred' },
        { key: 'monthsDeferred', label: 'Months each hire is deferred' },
        { key: 'monthlyLoadedFteCost', label: 'Monthly loaded FTE cost', kind: 'money' },
      ],
    },
    {
      title: 'Revenue influence',
      description: 'Conservative attribution using margin and contribution factors.',
      valueType: 'revenue',
      fields: [
        { key: 'influencedPipeline', label: 'Influenced pipeline', kind: 'money' },
        { key: 'incrementalWinRate', label: 'Incremental win rate', kind: 'percent' },
        { key: 'contributionRate', label: 'Application contribution', kind: 'percent' },
        { key: 'additionalOpportunities', label: 'Additional opportunities' },
        { key: 'averageDealValue', label: 'Average deal value', kind: 'money' },
        { key: 'opportunityWinRate', label: 'Expected win rate', kind: 'percent' },
      ],
    },
    {
      title: 'Risk reduction',
      description: 'Probability-weighted financial exposure reduction.',
      valueType: 'risk',
      fields: [
        { key: 'riskExposure', label: 'Financial exposure', kind: 'money' },
        { key: 'riskProbability', label: 'Probability', kind: 'percent' },
        { key: 'riskReduction', label: 'Expected risk reduction', kind: 'percent' },
      ],
    },
    {
      title: 'Hard cost reduction',
      description:
        'Spend that stops. Nothing counts before the contract ends, so enter the real exit month.',
      valueType: 'costReduction',
      fields: [
        { key: 'costRetiredSpend', label: 'Annual spend retired', kind: 'money' },
        { key: 'costMonthsToExit', label: 'Months until contracts end' },
      ],
    },
    {
      title: 'Retention and expansion',
      description:
        'Credited at gross margin and only for this application’s share of the improvement.',
      valueType: 'retention',
      fields: [
        { key: 'retentionArr', label: 'ARR in scope', kind: 'money' },
        { key: 'retentionLift', label: 'Net retention improvement', kind: 'percent' },
        { key: 'retentionAttribution', label: 'Share earned by this app', kind: 'percent' },
      ],
    },
    {
      title: 'Cycle-time compression',
      description:
        'Deals that close sooner are not new deals. Only the timing value counts, at the discount rate.',
      valueType: 'cycleTime',
      fields: [
        { key: 'cycleTimeRevenue', label: 'Annual revenue through the process', kind: 'money' },
        { key: 'cycleTimeDaysSaved', label: 'Days saved per cycle' },
      ],
    },
    {
      title: 'Cash acceleration',
      description:
        'Collecting sooner releases working capital once; the recurring benefit is its financing cost.',
      valueType: 'cashAcceleration',
      fields: [
        { key: 'cashAnnualBilled', label: 'Annual billed revenue', kind: 'money' },
        { key: 'cashDaysFaster', label: 'Days faster to cash (DSO, billing lag)' },
      ],
    },
    {
      title: 'Quality and rework',
      description: 'Use a measured error or rework baseline, not an estimate.',
      valueType: 'quality',
      fields: [
        { key: 'reworkHoursMonth', label: 'Rework hours avoided/month' },
        { key: 'errorsAvoidedYear', label: 'Errors or escalations avoided/year' },
        { key: 'costPerError', label: 'Cost per error', kind: 'money' },
      ],
    },
    {
      title: 'Compliance and audit readiness',
      description: 'Effort and fees only. Avoided fines and losses belong under risk reduction.',
      valueType: 'compliance',
      fields: [
        { key: 'auditPrepHoursYear', label: 'Audit prep hours saved/year' },
        { key: 'auditExternalSavings', label: 'External audit fees that stop', kind: 'money' },
      ],
    },
    {
      title: 'Employee ramp and retention',
      description: 'Soft value. Claim attrition only where it is already a known problem.',
      valueType: 'talent',
      fields: [
        { key: 'rampHiresYear', label: 'New hires per year' },
        { key: 'rampWeeksSaved', label: 'Weeks of ramp saved per hire' },
        { key: 'attritionAvoidedYear', label: 'Regretted departures avoided/year' },
        { key: 'replacementCost', label: 'Replacement cost per departure', kind: 'money' },
      ],
    },
    {
      title: 'Forecast and decision quality',
      description: 'Price a known cost of forecast misses, not accuracy for its own sake.',
      valueType: 'forecast',
      fields: [
        { key: 'forecastMissCost', label: 'Annual cost of forecast misses', kind: 'money' },
        { key: 'forecastImprovement', label: 'Reduction in that cost', kind: 'percent' },
      ],
    },
    {
      title: 'Customer experience',
      description: 'Cost to serve. Claim churn effects under retention, not here.',
      valueType: 'customerExperience',
      fields: [
        { key: 'cxContactsAvoidedYear', label: 'Support contacts avoided/year' },
        { key: 'cxCostPerContact', label: 'Cost per contact', kind: 'money' },
      ],
    },
    {
      title: 'Tech debt and consolidation',
      description: 'What is retired elsewhere. This application’s own upkeep is already in TCO.',
      valueType: 'techDebt',
      fields: [
        { key: 'techDebtHoursYear', label: 'Maintenance hours retired/year' },
        { key: 'techDebtRetiredSpend', label: 'Annual spend on retired tools', kind: 'money' },
      ],
    },
    {
      title: 'Strategic optionality',
      description: 'An argument on top of the case. Reported, never added to ROI.',
      valueType: 'strategic',
      fields: [
        { key: 'strategicAnnualValue', label: 'Stated annual strategic value', kind: 'money' },
      ],
    },
    {
      title: 'Proof plan',
      description:
        'Reviewers trust a stated kill criterion more than a big headline number. Required at the idea stage.',
      fields: [
        { key: 'pilotSuccessThreshold', label: 'Pilot success threshold', kind: 'text' },
        { key: 'killCriterion', label: 'Kill criterion', kind: 'text' },
      ],
    },
  ],
  TCO: [
    {
      title: 'Build labor',
      description: 'Include discovery through launch—not just coding hours.',
      fields: [
        { key: 'initialLaborHours', label: 'Core development hours' },
        { key: 'discoveryHours', label: 'Discovery hours' },
        { key: 'architectureHours', label: 'Architecture hours' },
        { key: 'testingHours', label: 'Testing hours' },
        { key: 'securityReviewHours', label: 'Security review hours' },
        { key: 'documentationHours', label: 'Documentation hours' },
        { key: 'trainingHours', label: 'Training/launch hours' },
        { key: 'initialLaborRate', label: 'Build loaded hourly rate', kind: 'money' },
        { key: 'otherInitialCost', label: 'Other initial costs', kind: 'money' },
      ],
    },
    {
      title: 'Run platform',
      description: 'Recurring infrastructure and usage-based services.',
      fields: [
        { key: 'monthlyHosting', label: 'Monthly hosting', kind: 'money' },
        { key: 'monthlyDatabase', label: 'Monthly database', kind: 'money' },
        { key: 'monthlyMonitoring', label: 'Monthly monitoring/logging', kind: 'money' },
        { key: 'monthlyAiRuntime', label: 'Monthly AI runtime', kind: 'money' },
        { key: 'monthlySupportHours', label: 'Monthly support hours' },
        { key: 'supportHourlyRate', label: 'Support hourly rate', kind: 'money' },
      ],
    },
    {
      title: 'Change and govern',
      description: 'Plan for enhancements, security, training, and debt repayment.',
      fields: [
        { key: 'annualMaintenance', label: 'Annual maintenance', kind: 'money' },
        { key: 'annualEnhancements', label: 'Annual enhancements', kind: 'money' },
        { key: 'annualGovernance', label: 'Annual governance', kind: 'money' },
        { key: 'annualSecurity', label: 'Annual security', kind: 'money' },
        { key: 'annualTraining', label: 'Annual onboarding/training', kind: 'money' },
        { key: 'technicalDebtReserveRate', label: 'Technical debt reserve', kind: 'percent' },
      ],
    },
  ],
  'Build vs Buy': [
    {
      title: 'Commercial alternative: one-time',
      description: 'Costs to stand up the product. Use a written quote, not a list price.',
      fields: [
        { key: 'buyImplementationCost', label: 'Implementation services', kind: 'money' },
        { key: 'buyIntegrationCost', label: 'Integration and migration', kind: 'money' },
        { key: 'buyTrainingCost', label: 'Training and change management', kind: 'money' },
      ],
    },
    {
      title: 'Commercial alternative: recurring',
      description: 'Year-one subscription and running costs, escalated by vendor price growth.',
      fields: [
        {
          key: 'buySubscriptionPerUserMonth',
          label: 'Subscription per user per month',
          kind: 'money',
        },
        { key: 'buyLicensedUsers', label: 'Licensed users' },
        { key: 'buyAnnualPlatformFee', label: 'Annual platform fee', kind: 'money' },
        { key: 'buyAnnualAdministration', label: 'Annual administration', kind: 'money' },
        { key: 'buyPriceGrowthRate', label: 'Vendor price growth', kind: 'percent' },
        { key: 'buyBenefitFit', label: 'Benefit fit (share of benefits)', kind: 'percent' },
      ],
    },
    {
      title: 'Non-financial considerations',
      description: 'Judge each factor on its own; these are not converted into money.',
      fields: [
        { key: 'bvbFunctionalFit', label: 'Functional fit', kind: 'preference' },
        { key: 'bvbExtensibility', label: 'Extensibility', kind: 'preference' },
        { key: 'bvbDataOwnership', label: 'Data ownership', kind: 'preference' },
        { key: 'bvbVendorLockIn', label: 'Vendor lock-in', kind: 'preference' },
        { key: 'bvbExitCost', label: 'Exit cost', kind: 'preference' },
        { key: 'bvbSecurity', label: 'Security and compliance', kind: 'preference' },
      ],
    },
  ],
  'AI Development': [
    {
      title: 'Token economics',
      description: 'Separate direct model spend from human oversight.',
      fields: [
        { key: 'aiInputTokens', label: 'Input tokens' },
        { key: 'aiOutputTokens', label: 'Output tokens' },
        { key: 'aiCachedTokens', label: 'Cached tokens' },
        { key: 'aiInputRatePerMillion', label: 'Input price per 1M tokens', kind: 'money' },
        { key: 'aiOutputRatePerMillion', label: 'Output price per 1M tokens', kind: 'money' },
        { key: 'aiCachedRatePerMillion', label: 'Cached price per 1M tokens', kind: 'money' },
        { key: 'aiSubscriptions', label: 'AI subscriptions', kind: 'money' },
      ],
    },
    {
      title: 'Human oversight',
      description: 'Prompting is only the opening act; review and remediation count too.',
      fields: [
        { key: 'aiPromptingHours', label: 'Prompting hours' },
        { key: 'aiReviewHours', label: 'Code review hours' },
        { key: 'aiDebuggingHours', label: 'Debugging hours' },
        { key: 'aiSecurityRemediationHours', label: 'Security remediation hours' },
      ],
    },
    {
      title: 'Traditional comparison',
      description: 'Compare against a credible alternative build estimate.',
      fields: [
        { key: 'traditionalBuildHours', label: 'Traditional build hours' },
        { key: 'traditionalBuildRate', label: 'Traditional hourly rate', kind: 'money' },
        { key: 'monthsAccelerated', label: 'Months accelerated' },
      ],
    },
  ],
  'Technical Health': [
    {
      title: 'Maintainability assessment',
      description: 'Score 1 (strong) to 5 (critical risk).',
      fields: [
        { key: 'architectureScore', label: 'Architecture', kind: 'score' },
        { key: 'testingScore', label: 'Automated testing', kind: 'score' },
        { key: 'documentationScore', label: 'Documentation', kind: 'score' },
        { key: 'securityScore', label: 'Security validation', kind: 'score' },
        { key: 'dependencyScore', label: 'Dependency health', kind: 'score' },
        { key: 'deploymentScore', label: 'Deployment automation', kind: 'score' },
        { key: 'observabilityScore', label: 'Observability', kind: 'score' },
        { key: 'ownershipScore', label: 'Code ownership', kind: 'score' },
        { key: 'integrationScore', label: 'Integration resilience', kind: 'score' },
        { key: 'portabilityScore', label: 'AI/provider portability', kind: 'score' },
      ],
    },
  ],
  Actuals: [
    {
      title: 'Realization tracking',
      description: 'Compare the approved model with observed results.',
      fields: [
        { key: 'monthsSinceLaunch', label: 'Months since launch' },
        { key: 'actualAdoptionRate', label: 'Actual adoption', kind: 'percent' },
        { key: 'actualAnnualBenefits', label: 'Actual annual recurring benefits', kind: 'money' },
        { key: 'actualAnnualRunCost', label: 'Actual annual run cost', kind: 'money' },
        { key: 'actualInitialCost', label: 'Actual initial cost', kind: 'money' },
      ],
    },
  ],
};

export interface FieldLocation {
  section: Section;
  group: string;
  label: string;
  kind: FieldKind;
}

const locations = new Map<keyof Inputs, FieldLocation>();
for (const [section, groups] of Object.entries(FIELD_GROUPS) as [Section, FieldGroup[]][]) {
  for (const group of groups) {
    for (const field of group.fields) {
      locations.set(field.key, {
        section,
        group: group.title,
        label: field.label,
        kind: field.kind ?? 'number',
      });
    }
  }
}

/** Claim metadata is edited in the value-claims picker at the top of the Benefits page. */
export const VALUE_CLAIMS_GROUP = 'Value claims';
for (const type of VALUE_TYPES) {
  const at = (label: string, kind: FieldKind): FieldLocation => ({
    section: 'Benefits',
    group: VALUE_CLAIMS_GROUP,
    label: `${type.label}: ${label}`,
    kind,
  });
  locations.set(claimKey(type.id), at('claimed', 'claim'));
  locations.set(evidenceKey(type.id), at('evidence class', 'evidence'));
  locations.set(baselineKey(type.id), at('baseline source', 'text'));
}

/** Where an input is edited in the UI. Every key of `Inputs` has a location (enforced by tests). */
export function fieldLocation(key: keyof Inputs): FieldLocation | undefined {
  return locations.get(key);
}

/** Values for 'preference' fields: which option a non-financial factor favors. */
export const PREFERENCE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Favors build' },
  { value: 0, label: 'Neutral' },
  { value: -1, label: 'Favors buy' },
];

export const SCORE_LABELS: Record<number, string> = {
  1: 'Strong',
  2: 'Good',
  3: 'Moderate',
  4: 'High risk',
  5: 'Critical',
};
