/**
 * The kinds of value a business case can claim. The first four are the original Benefits panels;
 * the rest are opt-in. Each type is enabled, classified, and sourced through three inputs:
 * `claim<Type>` (1 = claimed), `evidence<Type>` (an override of the default evidence class, or
 * empty), and `baseline<Type>` (the system of record the baseline comes from).
 */

export const VALUE_TYPE_IDS = [
  'productivity',
  'capacity',
  'revenue',
  'risk',
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
  'strategic',
] as const;

export type ValueTypeId = (typeof VALUE_TYPE_IDS)[number];

/**
 * How finance will treat a claim. Hard: cash leaves the budget. Semi-hard: a cost avoided against
 * an existing budget line. Soft: productivity, experience, or attributed revenue.
 */
export type EvidenceClass = 'hard' | 'semi-hard' | 'soft';

export const EVIDENCE_CLASSES: readonly EvidenceClass[] = ['hard', 'semi-hard', 'soft'];

export const EVIDENCE_LABELS: Record<EvidenceClass, string> = {
  hard: 'Hard (cash)',
  'semi-hard': 'Semi-hard (avoided budget line)',
  soft: 'Soft (productivity or experience)',
};

/** Rank used to pick the claim to lead with: lower is harder evidence. */
export const EVIDENCE_RANK: Record<EvidenceClass, number> = { hard: 0, 'semi-hard': 1, soft: 2 };

export interface ValueType {
  id: ValueTypeId;
  label: string;
  /** One line shown under the label in pickers. */
  hint: string;
  /** What you measure. */
  measure: string;
  /** Who cares most. */
  audience: string;
  /** How the claim gets challenged, and how to answer it. */
  challenge: string;
  defaultEvidence: EvidenceClass;
  /** False only for strategic optionality: an argument on top, never part of ROI. */
  countsTowardRoi: boolean;
  /** True for the four original panels; claimed by default in the sample case and old drafts. */
  core: boolean;
}

export const VALUE_TYPES: readonly ValueType[] = [
  {
    id: 'productivity',
    label: 'Time saved',
    hint: 'People spend fewer hours on the work today.',
    measure: 'Minutes saved per user, manager hours, reconciliation hours',
    audience: 'COO, IT manager',
    challenge: 'Saved time is not cash unless it is redeployed. The realization factor covers it.',
    defaultEvidence: 'soft',
    countsTowardRoi: true,
    core: true,
  },
  {
    id: 'capacity',
    label: 'Capacity and headcount',
    hint: 'Contractor hours avoided, hires deferred, capacity redeployed.',
    measure: 'Contractor invoices, open requisitions, recovered hours',
    audience: 'CFO, COO',
    challenge: 'Recovered hours are often the same hours as time saved. Claim each hour once.',
    defaultEvidence: 'semi-hard',
    countsTowardRoi: true,
    core: true,
  },
  {
    id: 'revenue',
    label: 'Revenue influence',
    hint: 'Higher win rates or more opportunities in the sales pipeline.',
    measure: 'Influenced pipeline, win rate, additional opportunities',
    audience: 'CRO, Board',
    challenge: 'Attribution: CRM, reps, and pricing also move win rate. Keep contribution modest.',
    defaultEvidence: 'soft',
    countsTowardRoi: true,
    core: true,
  },
  {
    id: 'risk',
    label: 'Risk reduction',
    hint: 'Lower chance or cost of an error, breach, fine, or outage.',
    measure: 'Financial exposure, annual probability, reduction',
    audience: 'CISO, CFO',
    challenge: 'Exposure figures are often guesses. Use one Risk or Audit has already sized.',
    defaultEvidence: 'semi-hard',
    countsTowardRoi: true,
    core: true,
  },
  {
    id: 'costReduction',
    label: 'Hard cost reduction',
    hint: 'Licenses retired, tools consolidated, vendor or contractor spend cut.',
    measure: 'Licenses retired, tools consolidated, vendor or contractor spend cut',
    audience: 'CFO, CIO',
    challenge:
      '"Show me the contract end date." Savings count only from the month a renewal is actually cancelled.',
    defaultEvidence: 'hard',
    countsTowardRoi: true,
    core: false,
  },
  {
    id: 'retention',
    label: 'Retention and expansion',
    hint: 'Customers renew more or expand faster.',
    measure: 'Gross and net revenue retention, renewal rate, upsell pipeline',
    audience: 'CRO, CS leader, Board',
    challenge:
      'Hard to attribute, since retention has many drivers. Credit only this tool’s share.',
    defaultEvidence: 'soft',
    countsTowardRoi: true,
    core: false,
  },
  {
    id: 'cycleTime',
    label: 'Cycle-time compression',
    hint: 'Days off the sales cycle, time to market, or time to first value.',
    measure: 'Days off the sales cycle, time to market, time to first value',
    audience: 'CRO, COO',
    challenge:
      'Faster deals that were going to close anyway do not add revenue; they only move it earlier. Only the timing value counts.',
    defaultEvidence: 'soft',
    countsTowardRoi: true,
    core: false,
  },
  {
    id: 'cashAcceleration',
    label: 'Cash acceleration',
    hint: 'Invoices are issued and paid sooner.',
    measure: 'Days sales outstanding (DSO), billing lag, quote-to-cash time',
    audience: 'CFO',
    challenge: 'Usually small unless the billed volume is large. Only the financing value counts.',
    defaultEvidence: 'semi-hard',
    countsTowardRoi: true,
    core: false,
  },
  {
    id: 'quality',
    label: 'Quality and rework',
    hint: 'Fewer errors, escalations, and rework hours.',
    measure: 'Error rate, first-pass accuracy, escalations, rework hours',
    audience: 'COO, IT manager',
    challenge: 'Needs a measured baseline. Most teams do not have one, so measure before claiming.',
    defaultEvidence: 'soft',
    countsTowardRoi: true,
    core: false,
  },
  {
    id: 'compliance',
    label: 'Compliance and audit readiness',
    hint: 'Less effort and fees to prepare for audits.',
    measure: 'Audit prep hours, evidence-collection effort, findings closed',
    audience: 'CISO, CFO',
    challenge: 'Often already counted under risk reduction. Claim the effort here, the loss there.',
    defaultEvidence: 'semi-hard',
    countsTowardRoi: true,
    core: false,
  },
  {
    id: 'talent',
    label: 'Employee ramp and retention',
    hint: 'New hires productive sooner, fewer regretted departures.',
    measure: 'Time to productivity, regretted attrition, replacement cost',
    audience: 'CRO, COO, HR',
    challenge:
      'Soft value. Finance discounts it heavily unless attrition is already a known problem.',
    defaultEvidence: 'soft',
    countsTowardRoi: true,
    core: false,
  },
  {
    id: 'forecast',
    label: 'Forecast and decision quality',
    hint: 'More accurate forecasts and faster decisions.',
    measure: 'Forecast accuracy, pipeline visibility, decision latency',
    audience: 'CRO, CFO, Board',
    challenge: 'Gains are hard to turn into dollars. Price only a known cost of forecast misses.',
    defaultEvidence: 'soft',
    countsTowardRoi: true,
    core: false,
  },
  {
    id: 'customerExperience',
    label: 'Customer experience',
    hint: 'Fewer support contacts and faster resolution.',
    measure: 'CSAT, NPS, response and resolution time, contacts per customer',
    audience: 'COO, CS leader',
    challenge:
      'Linking NPS to revenue is weak in most companies. Claim cost to serve here and churn under retention.',
    defaultEvidence: 'soft',
    countsTowardRoi: true,
    core: false,
  },
  {
    id: 'techDebt',
    label: 'Tech debt and consolidation',
    hint: 'Integrations removed, maintenance hours cut, shadow IT retired.',
    measure: 'Integrations removed, maintenance hours, shadow IT retired',
    audience: 'CIO / CTO',
    challenge:
      'Build versus buy cuts both ways: a custom app is new tech debt. Net it against this app’s own upkeep.',
    defaultEvidence: 'semi-hard',
    countsTowardRoi: true,
    core: false,
  },
  {
    id: 'strategic',
    label: 'Strategic optionality',
    hint: 'Reusable platform, data asset, AI readiness, competitive position.',
    measure: 'Reusable platform, data asset, AI readiness, competitive positioning',
    audience: 'Board, CEO',
    challenge:
      'The easiest claim to make and the easiest to dismiss. Shown as an argument on top; never counted in ROI.',
    defaultEvidence: 'soft',
    countsTowardRoi: false,
    core: false,
  },
];

const byId = new Map(VALUE_TYPES.map((t) => [t.id, t]));

export function getValueType(id: ValueTypeId): ValueType {
  return byId.get(id)!;
}

export function isValueTypeId(value: unknown): value is ValueTypeId {
  return typeof value === 'string' && byId.has(value as ValueTypeId);
}

type Cap<S extends string> = Capitalize<S>;
export type ClaimKey = `claim${Cap<ValueTypeId>}`;
export type EvidenceKey = `evidence${Cap<ValueTypeId>}`;
export type BaselineKey = `baseline${Cap<ValueTypeId>}`;

const cap = <S extends string>(s: S) => (s.charAt(0).toUpperCase() + s.slice(1)) as Cap<S>;

export const claimKey = (id: ValueTypeId): ClaimKey => `claim${cap(id)}`;
export const evidenceKey = (id: ValueTypeId): EvidenceKey => `evidence${cap(id)}`;
export const baselineKey = (id: ValueTypeId): BaselineKey => `baseline${cap(id)}`;

/** Claim flag (1 claimed, 0 not), evidence-class override ('' = default), baseline source. */
export type ValueClaimInputs = { [K in ClaimKey]: number } & { [K in EvidenceKey]: string } & {
  [K in BaselineKey]: string;
};

export const CLAIM_KEYS = VALUE_TYPE_IDS.map(claimKey);
export const EVIDENCE_KEYS = VALUE_TYPE_IDS.map(evidenceKey);
export const BASELINE_KEYS = VALUE_TYPE_IDS.map(baselineKey);

/** Builds the claim metadata inputs: the listed types claimed, no overrides, no sources. */
export function claimInputs(
  claimed: readonly ValueTypeId[],
  baselines: Partial<Record<ValueTypeId, string>> = {},
): ValueClaimInputs {
  const out: Record<string, number | string> = {};
  for (const id of VALUE_TYPE_IDS) {
    out[claimKey(id)] = claimed.includes(id) ? 1 : 0;
    out[evidenceKey(id)] = '';
    out[baselineKey(id)] = baselines[id] ?? '';
  }
  return out as ValueClaimInputs;
}

type ClaimSource = { readonly [K in ClaimKey | EvidenceKey]: number | string };

export function isClaimed(inputs: ClaimSource, id: ValueTypeId): boolean {
  return Number(inputs[claimKey(id)]) > 0;
}

/** The user's evidence class for a type, or the type's default. Strategic is always soft. */
export function evidenceOf(inputs: ClaimSource, id: ValueTypeId): EvidenceClass {
  const type = getValueType(id);
  if (!type.countsTowardRoi) return 'soft';
  const value = inputs[evidenceKey(id)];
  return EVIDENCE_CLASSES.includes(value as EvidenceClass)
    ? (value as EvidenceClass)
    : type.defaultEvidence;
}
