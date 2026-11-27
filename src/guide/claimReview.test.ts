import { describe, expect, it } from 'vitest';
import { calculateBusinessCase } from '../calculations/engine';
import { defaultInputs } from '../data/defaults';
import { VALUE_TYPES, baselineKey, claimKey, type ValueTypeId } from '../data/valueTypes';
import type { Inputs } from '../types';
import { reviewClaims, type ClaimContext } from './claimReview';

const claim = (ids: ValueTypeId[], over: Partial<Inputs> = {}): Inputs => {
  const inputs: Inputs = { ...defaultInputs, ...over };
  for (const t of VALUE_TYPES) {
    (inputs[claimKey(t.id)] as number) = ids.includes(t.id) ? 1 : 0;
    (inputs[baselineKey(t.id)] as string) = ids.includes(t.id) ? 'CRM' : '';
  }
  return inputs;
};
const review = (inputs: Inputs, ctx: ClaimContext = {}) =>
  reviewClaims(inputs, calculateBusinessCase(inputs), ctx);
const has = (inputs: Inputs, text: RegExp, ctx: ClaimContext = {}) =>
  review(inputs, ctx).warnings.some((w) => text.test(w));

describe('reviewClaims', () => {
  it('leads with the hardest claim that has value', () => {
    const r = review(claim(['productivity', 'costReduction']));
    expect(r.lead?.id).toBe('costReduction');
    expect(r.warnings.some((w) => /Your largest claim, Time saved, is soft/.test(w))).toBe(true);
  });

  it('flags more than three claims as padding', () => {
    expect(has(claim(['productivity', 'capacity', 'revenue']), /value types are claimed/)).toBe(
      false,
    );
    expect(has(claim(['productivity', 'capacity', 'revenue', 'risk']), /4 value types/)).toBe(true);
  });

  it('does not count strategic optionality as a claim, and rejects it as the only one', () => {
    expect(review(claim(['costReduction', 'strategic'])).roiClaimCount).toBe(1);
    expect(has(claim(['strategic']), /only claim/)).toBe(true);
  });

  it('warns when every claim is soft', () => {
    expect(has(claim(['productivity', 'retention']), /Every claim is soft/)).toBe(true);
  });

  it('asks for a baseline source for each claim', () => {
    const inputs = claim(['costReduction']);
    inputs.baselineCostReduction = '';
    expect(has(inputs, /No baseline source for Hard cost reduction/)).toBe(true);
  });

  it('flags the double-counting pairs', () => {
    expect(has(claim(['productivity', 'capacity']), /same hours/)).toBe(true);
    expect(
      has(claim(['productivity', 'capacity'], { capacityHoursRecoveredYear: 0 }), /same hours/),
    ).toBe(false);
    expect(has(claim(['compliance', 'risk']), /never the same finding twice/)).toBe(true);
    expect(has(claim(['techDebt', 'costReduction']), /one of them only/)).toBe(true);
    expect(has(claim(['customerExperience', 'retention']), /churn under retention/)).toBe(true);
    expect(has(claim(['cycleTime', 'revenue']), /move revenue earlier/)).toBe(true);
  });

  it('needs a pilot threshold and kill criterion at the idea stage', () => {
    const inputs = claim(['costReduction'], { killCriterion: '' });
    expect(has(inputs, /kill criterion/, { stage: 'idea' })).toBe(true);
    expect(has(inputs, /kill criterion/, { stage: 'live' })).toBe(false);
    expect(has({ ...inputs, lifecycleStage: 'Proposal' }, /kill criterion/)).toBe(true);
    expect(has({ ...inputs, lifecycleStage: 'MVP' }, /kill criterion/)).toBe(false);
  });

  it('reframes the case against the commercial product when one exists', () => {
    const noQuote = claim(['costReduction'], {
      buySubscriptionPerUserMonth: 0,
      buyAnnualPlatformFee: 0,
      buyAnnualAdministration: 0,
      buyImplementationCost: 0,
      buyIntegrationCost: 0,
      buyTrainingCost: 0,
    });
    expect(has(noQuote, /not versus doing nothing/, { buyOption: 'yes' })).toBe(true);
    expect(has(claim(['costReduction']), /why building beats buying/)).toBe(true);
    expect(
      has(claim(['costReduction'], { bvbDataOwnership: 1 }), /why building beats buying/),
    ).toBe(false);
  });

  it('requires an exit date for hard cost reduction', () => {
    expect(has(claim(['costReduction'], { costMonthsToExit: 0 }), /counted from day one/)).toBe(
      true,
    );
  });
});
