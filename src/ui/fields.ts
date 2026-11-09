import type { Inputs } from '../types';

export type Section =
  | 'Overview'
  | 'Profile'
  | 'Benefits'
  | 'TCO'
  | 'AI Development'
  | 'Technical Health'
  | 'Scenarios'
  | 'Assumptions'
  | 'Actuals'
  | 'Reports';

export type FieldKind = 'text' | 'number' | 'money' | 'percent' | 'score' | 'currency';

export interface FieldDef {
  key: keyof Inputs;
  label: string;
  kind?: FieldKind;
}

export interface FieldGroup {
  title: string;
  description: string;
  fields: FieldDef[];
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
      title: 'Productivity',
      description: 'Time savings adjusted for adoption and realization.',
      fields: [
        { key: 'minutesSavedPerUserWeek', label: 'Minutes saved/user/week' },
        { key: 'managerHoursSavedMonth', label: 'Manager hours saved/month' },
        { key: 'reconciliationHoursSavedMonth', label: 'Reconciliation hours saved/month' },
        { key: 'adoptionRate', label: 'Adoption rate', kind: 'percent' },
        { key: 'realizationRate', label: 'Realization factor', kind: 'percent' },
      ],
    },
    {
      title: 'Capacity and workforce',
      description:
        'Value recovered capacity and contractor avoidance. Deferred hiring is a one-time saving.',
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
      fields: [
        { key: 'influencedPipeline', label: 'Influenced pipeline', kind: 'money' },
        { key: 'incrementalWinRate', label: 'Incremental win rate', kind: 'percent' },
        { key: 'grossMargin', label: 'Gross margin', kind: 'percent' },
        { key: 'contributionRate', label: 'Application contribution', kind: 'percent' },
        { key: 'additionalOpportunities', label: 'Additional opportunities' },
        { key: 'averageDealValue', label: 'Average deal value', kind: 'money' },
        { key: 'opportunityWinRate', label: 'Expected win rate', kind: 'percent' },
      ],
    },
    {
      title: 'Risk reduction',
      description: 'Probability-weighted financial exposure reduction.',
      fields: [
        { key: 'riskExposure', label: 'Financial exposure', kind: 'money' },
        { key: 'riskProbability', label: 'Probability', kind: 'percent' },
        { key: 'riskReduction', label: 'Expected risk reduction', kind: 'percent' },
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

/** Where an input is edited in the UI. Every key of `Inputs` has a location (enforced by tests). */
export function fieldLocation(key: keyof Inputs): FieldLocation | undefined {
  return locations.get(key);
}

export const SCORE_LABELS: Record<number, string> = {
  1: 'Strong',
  2: 'Good',
  3: 'Moderate',
  4: 'High risk',
  5: 'Critical',
};
