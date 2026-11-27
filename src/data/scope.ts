/**
 * Scope: what kind of application the case is for, and which optional modules apply to it.
 *
 * The scope answers and module overrides are ordinary string inputs, so they travel with the
 * case file. An empty string always means "not answered" (or, for a module, "use the
 * recommendation"), which is what drafts saved before scope existed open with.
 *
 * Switching a module off never erases or zeroes its inputs, and never removes costs from the
 * totals: modules that carry costs are flagged instead. Benefits are switched on and off per
 * value type with the claim flags, which this module only recommends.
 */
import type { Inputs } from '../types';
import type { Section } from '../ui/fields';
import type { ValueTypeId } from './valueTypes';

export type Tier = 'essential' | 'optional' | 'off';

export const TIER_LABELS: Record<Tier, string> = {
  essential: 'Essential',
  optional: 'Optional',
  off: 'Not applicable',
};

export type ScopeKey =
  | 'scopeAppType'
  | 'scopeUsers'
  | 'scopeData'
  | 'scopeAiBuild'
  | 'scopeAiRuntime'
  | 'scopeIntegrations'
  | 'scopeBuyOption'
  | 'scopeStage';

export interface ScopeOption {
  value: string;
  label: string;
}

export interface ScopeQuestion {
  key: ScopeKey;
  label: string;
  hint: string;
  options: ScopeOption[];
}

export const SCOPE_QUESTIONS: ScopeQuestion[] = [
  {
    key: 'scopeAppType',
    label: 'What kind of application is it?',
    hint: 'Sets which value types are suggested.',
    options: [
      { value: 'workflow', label: 'Workflow or internal tool' },
      { value: 'reporting', label: 'Reporting or analytics' },
      { value: 'integration', label: 'Integration or automation' },
      { value: 'customer-portal', label: 'Customer portal or app' },
      { value: 'ai-agent', label: 'AI agent or assistant' },
    ],
  },
  {
    key: 'scopeUsers',
    label: 'Who uses it?',
    hint: 'Customer-facing apps need monitoring, security, and revenue or retention claims.',
    options: [
      { value: 'internal', label: 'Internal staff only' },
      { value: 'customer', label: 'Customers or partners' },
    ],
  },
  {
    key: 'scopeData',
    label: 'What data does it handle?',
    hint: 'Personal or regulated data makes security, governance, and risk essential.',
    options: [
      { value: 'none', label: 'Nothing sensitive' },
      { value: 'internal', label: 'Internal or confidential' },
      { value: 'personal', label: 'Personal data' },
      { value: 'regulated', label: 'Regulated (HIPAA, PCI, SOX, and similar)' },
    ],
  },
  {
    key: 'scopeAiBuild',
    label: 'Is it built with AI coding tools?',
    hint: 'Turns the AI Development page on or off.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
  {
    key: 'scopeAiRuntime',
    label: 'Does it call AI models in production?',
    hint: 'Production AI needs a runtime cost and a provider-portability score.',
    options: [
      { value: 'none', label: 'No' },
      { value: 'assistive', label: 'Yes, for some features' },
      { value: 'core', label: 'Yes, it is the core of the app' },
    ],
  },
  {
    key: 'scopeIntegrations',
    label: 'How many systems does it integrate with?',
    hint: 'Many or critical integrations raise architecture and integration-resilience needs.',
    options: [
      { value: 'none', label: 'None' },
      { value: 'few', label: 'One or two' },
      { value: 'many', label: 'Many, or business-critical' },
    ],
  },
  {
    key: 'scopeBuyOption',
    label: 'Could you buy a commercial product instead?',
    hint: 'Turns the Build vs Buy page on or off.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
  {
    key: 'scopeStage',
    label: 'Where is the initiative today?',
    hint: 'Actuals apply once the app is live.',
    options: [
      { value: 'idea', label: 'Idea or proposal' },
      { value: 'built', label: 'Built or in pilot' },
      { value: 'live', label: 'Live in production' },
    ],
  },
];

export const SCOPE_KEYS: readonly ScopeKey[] = SCOPE_QUESTIONS.map((q) => q.key);

export type ModuleId = 'aiDevelopment' | 'buildVsBuy' | 'technicalHealth' | 'actuals';
export type ModuleKey =
  'moduleAiDevelopment' | 'moduleBuildVsBuy' | 'moduleTechnicalHealth' | 'moduleActuals';

export interface ModuleDef {
  id: ModuleId;
  key: ModuleKey;
  section: Section;
  label: string;
  /** Whether the module's inputs add costs to the TCO (they keep counting when it is off). */
  carriesCosts: boolean;
}

/** Optional pages. Profile, Benefits, TCO, and the review pages always apply. */
export const MODULES: readonly ModuleDef[] = [
  {
    id: 'aiDevelopment',
    key: 'moduleAiDevelopment',
    section: 'AI Development',
    label: 'AI Development',
    carriesCosts: true,
  },
  {
    id: 'buildVsBuy',
    key: 'moduleBuildVsBuy',
    section: 'Build vs Buy',
    label: 'Build vs Buy',
    carriesCosts: false,
  },
  {
    id: 'technicalHealth',
    key: 'moduleTechnicalHealth',
    section: 'Technical Health',
    label: 'Technical Health',
    carriesCosts: false,
  },
  {
    id: 'actuals',
    key: 'moduleActuals',
    section: 'Actuals',
    label: 'Actuals',
    carriesCosts: false,
  },
];

export const MODULE_KEYS: readonly ModuleKey[] = MODULES.map((m) => m.key);

/** Every input added for scope (v0.8.0). Drafts saved earlier have none of them. */
export const SCOPE_INPUT_KEYS: readonly (ScopeKey | ModuleKey)[] = [...SCOPE_KEYS, ...MODULE_KEYS];

export const isTier = (value: unknown): value is Tier =>
  value === 'essential' || value === 'optional' || value === 'off';

export type ScopeSource = Pick<Inputs, ScopeKey | ModuleKey>;

export interface Recommendation {
  tier: Tier;
  reason: string;
}

/** The tier each module should have, given the scope answers alone. */
export function recommendModule(s: ScopeSource, id: ModuleId): Recommendation {
  switch (id) {
    case 'aiDevelopment':
      if (s.scopeAiBuild === 'yes')
        return { tier: 'essential', reason: 'It is built with AI coding tools.' };
      if (s.scopeAiBuild === 'no')
        return { tier: 'off', reason: 'It is not built with AI coding tools.' };
      return { tier: 'optional', reason: 'Not yet known whether AI coding tools are used.' };
    case 'buildVsBuy':
      if (s.scopeBuyOption === 'yes')
        return { tier: 'essential', reason: 'A commercial product could do the job.' };
      if (s.scopeBuyOption === 'no')
        return { tier: 'off', reason: 'No commercial product does the job.' };
      return { tier: 'optional', reason: 'Not yet known whether a product exists.' };
    case 'technicalHealth': {
      const reasons = [
        s.scopeUsers === 'customer' && 'customers use it',
        (s.scopeData === 'personal' || s.scopeData === 'regulated') && 'it handles sensitive data',
        s.scopeIntegrations === 'many' && 'it has many or critical integrations',
        s.scopeAiRuntime === 'core' && 'AI is its core',
      ].filter((r): r is string => typeof r === 'string');
      return reasons.length
        ? { tier: 'essential', reason: `Maintainability matters because ${reasons.join(', ')}.` }
        : { tier: 'optional', reason: 'Recommended for any app the business will rely on.' };
    }
    case 'actuals':
      if (s.scopeStage === 'live')
        return { tier: 'essential', reason: 'It is live, so results can be measured.' };
      if (s.scopeStage === 'idea')
        return { tier: 'off', reason: 'Nothing is launched yet to measure.' };
      return { tier: 'optional', reason: 'Track results once it launches.' };
  }
}

export interface ModuleStatus extends ModuleDef {
  tier: Tier;
  recommended: Recommendation;
  /** True when the user chose a tier instead of the recommendation. */
  overridden: boolean;
}

/** The effective tier of every module: the user's override, else the recommendation. */
export function moduleStatuses(s: ScopeSource): ModuleStatus[] {
  return MODULES.map((m) => {
    const recommended = recommendModule(s, m.id);
    const override = s[m.key];
    return {
      ...m,
      recommended,
      tier: isTier(override) ? override : recommended.tier,
      overridden: isTier(override),
    };
  });
}

/** The module shown on a page, or undefined for pages that always apply. */
export function moduleForSection(s: ScopeSource, section: Section): ModuleStatus | undefined {
  return moduleStatuses(s).find((m) => m.section === section);
}

export function isSectionOff(s: ScopeSource, section: Section): boolean {
  return moduleForSection(s, section)?.tier === 'off';
}

/** True once any scope question is answered. */
export function hasScope(s: ScopeSource): boolean {
  return SCOPE_KEYS.some((key) => s[key] !== '');
}

export interface ClaimSuggestion {
  id: ValueTypeId;
  reason: string;
}

/** Value types worth claiming for this scope, strongest reason first, without duplicates. */
export function suggestClaims(s: ScopeSource): ClaimSuggestion[] {
  const out: ClaimSuggestion[] = [];
  const add = (id: ValueTypeId, reason: string) => {
    if (!out.some((c) => c.id === id)) out.push({ id, reason });
  };
  if (s.scopeData === 'regulated') {
    add('compliance', 'Regulated data: audit preparation effort it removes.');
    add('risk', 'Regulated data: fines or incidents it makes less likely.');
  }
  if (s.scopeData === 'personal') add('risk', 'Personal data: breach exposure it reduces.');
  switch (s.scopeAppType) {
    case 'workflow':
      add('productivity', 'Workflow tools save time on the steps they automate.');
      add('quality', 'Workflow tools cut rework and errors.');
      break;
    case 'reporting':
      add('productivity', 'Reporting replaces manual data gathering.');
      add('forecast', 'Better data improves forecasts and planning.');
      break;
    case 'integration':
      add('techDebt', 'Integrations retire scripts, spreadsheets, and old connectors.');
      add('productivity', 'Automation removes manual re-keying.');
      add('quality', 'Automation removes re-keying errors.');
      break;
    case 'customer-portal':
      add('customerExperience', 'Self-service avoids support contacts.');
      add('retention', 'A better customer experience protects renewals.');
      break;
    case 'ai-agent':
      add('productivity', 'An assistant saves time on the tasks it handles.');
      add('capacity', 'An agent absorbs volume without new hires.');
      break;
  }
  if (s.scopeUsers === 'customer') {
    add('revenue', 'Customer-facing: influence on win rate or opportunities.');
    add('retention', 'Customer-facing: renewal and expansion.');
  }
  if (s.scopeIntegrations === 'many')
    add('techDebt', 'Many integrations: point-to-point upkeep it replaces.');
  return out;
}

/** The cost and module figures the scope checks need. */
export interface ScopeFigures {
  aiCash: number;
  aiOversightHours: number;
  buyConfigured: boolean;
}

/**
 * Guardrails that compare the scope with what has been entered: essential pieces that are still
 * empty, and modules marked not applicable whose costs still count.
 */
export function scopeWarnings(inputs: Inputs, f: ScopeFigures): string[] {
  const warnings: string[] = [];
  const tiers = new Map(moduleStatuses(inputs).map((m) => [m.id, m.tier]));
  const sensitive = inputs.scopeData === 'personal' || inputs.scopeData === 'regulated';

  if (
    (inputs.scopeAiRuntime === 'assistive' || inputs.scopeAiRuntime === 'core') &&
    inputs.monthlyAiRuntime <= 0
  )
    warnings.push('The app calls AI models in production, but monthly AI runtime cost is zero.');
  if (sensitive && (inputs.securityReviewHours <= 0 || inputs.annualSecurity <= 0))
    warnings.push(
      'The app handles sensitive data, but security review hours or annual security cost is zero.',
    );
  if (inputs.scopeData === 'regulated' && inputs.annualGovernance <= 0)
    warnings.push('The app handles regulated data, but annual governance cost is zero.');
  if (inputs.scopeUsers === 'customer' && inputs.monthlyMonitoring <= 0)
    warnings.push('The app is customer-facing, but monthly monitoring cost is zero.');
  if (inputs.scopeIntegrations === 'many' && inputs.architectureHours <= 0)
    warnings.push('The app has many or critical integrations, but no architecture hours.');

  const aiSpend = f.aiCash > 0 || f.aiOversightHours > 0;
  if (tiers.get('aiDevelopment') === 'essential' && !aiSpend)
    warnings.push(
      'AI Development is essential for this scope, but no AI spend or oversight hours are entered.',
    );
  if (tiers.get('aiDevelopment') === 'off' && aiSpend)
    warnings.push(
      'AI Development is marked not applicable, but its spend and oversight hours still count in TCO.',
    );
  if (tiers.get('buildVsBuy') === 'essential' && !f.buyConfigured)
    warnings.push('Build vs Buy is essential for this scope, but no commercial option is entered.');
  if (tiers.get('actuals') === 'essential' && inputs.monthsSinceLaunch <= 0)
    warnings.push('The app is live, but no actual results are entered on the Actuals page.');
  return warnings;
}
