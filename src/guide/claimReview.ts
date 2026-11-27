import {
  EVIDENCE_RANK,
  baselineKey,
  getValueType,
  isClaimed,
  type ValueTypeId,
} from '../data/valueTypes';
import type { ClaimResult, Inputs, Results } from '../types';
import { checklistTally } from '../ui/buildVsBuy';
import type { Answer, Stage } from './steps';

/** More claims than this reads as padding: one hard claim plus one or two supporting claims. */
export const MAX_RECOMMENDED_CLAIMS = 3;

/** Walkthrough answers that change the review, when the user has given them. */
export interface ClaimContext {
  stage?: Stage | null;
  buyOption?: Answer | null;
}

export interface ClaimReview {
  /** Claims that count toward ROI, hardest evidence first, then largest value. */
  ranked: ClaimResult[];
  /** The claim to lead with: the hardest evidence class with value, then the largest. */
  lead: ClaimResult | null;
  /** Number of claimed value types that count toward ROI. */
  roiClaimCount: number;
  /** True at the idea stage, from the walkthrough or the lifecycle stage on Profile. */
  ideaStage: boolean;
  warnings: string[];
}

const label = (id: ValueTypeId) => getValueType(id).label;
const list = (ids: ValueTypeId[]) => ids.map(label).join(', ');

export function isIdeaStage(inputs: Inputs, ctx: ClaimContext): boolean {
  if (ctx.stage) return ctx.stage === 'idea';
  return /\b(idea|proposal|concept)\b/i.test(inputs.lifecycleStage);
}

/**
 * Review the value claims for the failure modes reviewers look for: double counting, too many
 * claims, soft claims in the lead, missing baselines, idea-stage numbers presented without a
 * proof plan, and a build case that ignores the commercial alternative.
 */
export function reviewClaims(
  inputs: Inputs,
  results: Results,
  ctx: ClaimContext = {},
): ClaimReview {
  const on = (id: ValueTypeId) => isClaimed(inputs, id);
  const roiClaims = results.claims.filter((c) => c.countsTowardRoi);
  const ranked = [...roiClaims].sort(
    (a, b) => EVIDENCE_RANK[a.evidence] - EVIDENCE_RANK[b.evidence] || b.value - a.value,
  );
  const withValue = ranked.filter((c) => c.value > 0);
  const lead = withValue[0] ?? null;
  const largest = [...withValue].sort((a, b) => b.value - a.value)[0] ?? null;
  const ideaStage = isIdeaStage(inputs, ctx);
  const warnings: string[] = [];

  if (roiClaims.length === 0) {
    warnings.push(
      on('strategic')
        ? 'Strategic optionality is the only claim, and it never counts toward ROI. Add a hard or semi-hard claim as the core of the case.'
        : 'No value type is claimed. Choose what this case claims at the top of the Benefits page.',
    );
  }
  if (roiClaims.length > MAX_RECOMMENDED_CLAIMS)
    warnings.push(
      `${roiClaims.length} value types are claimed. Lead with one hard claim and keep one or two supporting claims; more reads as padding.`,
    );
  if (withValue.length > 0 && withValue.every((c) => c.evidence === 'soft'))
    warnings.push(
      'Every claim is soft. Finance will discount the case: lead with a hard (cash) or semi-hard (budget line) claim.',
    );
  else if (largest && lead && largest.evidence === 'soft' && lead.id !== largest.id)
    warnings.push(
      `Your largest claim, ${label(largest.id)}, is soft. Lead with ${label(lead.id)} (${lead.evidence}) and present ${label(largest.id)} as supporting.`,
    );

  const unsourced = results.claims
    .filter((c) => !String(inputs[baselineKey(c.id)]).trim())
    .map((c) => c.id);
  if (unsourced.length)
    warnings.push(
      `No baseline source for ${list(unsourced)}. Take each baseline from a system of record (CRM, finance, ticketing) before the walkthrough, not from an estimate.`,
    );

  // Double counting.
  if (
    on('productivity') &&
    on('capacity') &&
    (inputs.minutesSavedPerUserWeek > 0 || inputs.managerHoursSavedMonth > 0) &&
    inputs.capacityHoursRecoveredYear > 0
  )
    warnings.push(
      'Time saved and recovered capacity are usually the same hours. Claim each hour once, either as hours saved or as capacity redeployed, never both.',
    );
  if (on('compliance') && on('risk'))
    warnings.push(
      'Compliance and risk reduction are both claimed. Count audit effort and fees under compliance and avoided losses under risk, never the same finding twice.',
    );
  if (on('techDebt') && on('costReduction') && inputs.techDebtRetiredSpend > 0)
    warnings.push(
      'Tech debt and hard cost reduction both retire spend. List each retired tool or contract under one of them only.',
    );
  if (on('customerExperience') && on('retention'))
    warnings.push(
      'Customer experience and retention are both claimed. Keep churn under retention and only cost to serve under customer experience.',
    );
  if (on('quality') && on('productivity') && inputs.reworkHoursMonth > 0)
    warnings.push(
      'Quality and time saved are both claimed. Check that rework hours are not already inside minutes saved per user.',
    );
  if (on('cycleTime') && on('revenue'))
    warnings.push(
      'Cycle time and revenue influence are both claimed. Faster deals that would close anyway only move revenue earlier; do not also count them as win-rate lift.',
    );

  if (on('costReduction') && inputs.costRetiredSpend > 0 && inputs.costMonthsToExit <= 0)
    warnings.push(
      'Hard cost reduction is counted from day one. Savings count only once a renewal is actually cancelled: enter the months until the contract ends.',
    );
  if (on('techDebt') && (results.technicalRisk === 'High' || results.technicalRisk === 'Critical'))
    warnings.push(
      `Tech debt reduction is claimed, but this application scores ${results.technicalRisk.toLowerCase()} technical risk. A custom app is new tech debt; expect the claim to be netted against it.`,
    );

  if (ideaStage && (!inputs.pilotSuccessThreshold.trim() || !inputs.killCriterion.trim()))
    warnings.push(
      'At the idea stage every number is an estimate. State a pilot success threshold and a kill criterion, and present the Conservative to Upside range rather than one figure.',
    );

  const buy = results.buildVsBuy;
  if (ctx.buyOption === 'yes' && !buy.configured)
    warnings.push(
      'You said a commercial product could do this, so the case is your build versus that product, not versus doing nothing. Enter a vendor quote on Build vs Buy.',
    );
  else if (buy.configured && checklistTally(inputs).build === 0)
    warnings.push(
      'A commercial alternative is modeled, but no non-financial factor favors building. Show why building beats buying: fit, data ownership, or integration depth.',
    );

  return { ranked, lead, roiClaimCount: roiClaims.length, ideaStage, warnings };
}
