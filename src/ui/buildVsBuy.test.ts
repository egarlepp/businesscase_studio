import { describe, expect, it } from 'vitest';
import { calculateBusinessCase } from '../calculations/engine';
import { defaultInputs } from '../data/defaults';
import { buildVsBuyHeadline, checklistTally, cumulativeNetSeries } from './buildVsBuy';
import { createFormatters } from './format';

const fmt = createFormatters('USD');

describe('build vs buy display helpers', () => {
  it('ends the build series at the build case cumulative net', () => {
    const r = calculateBusinessCase(defaultInputs);
    const series = cumulativeNetSeries(r);
    expect(series).toHaveLength(r.annualBreakdown.length + 1);
    expect(series[0]).toMatchObject({ label: 'Start', build: -r.initialCost });
    expect(series.at(-1)!.build).toBeCloseTo(r.annualBreakdown.at(-1)!.cumulativeNet);
    expect(series.at(-1)!.buy).toBeCloseTo(
      r.buildVsBuy.buyTotalBenefits - r.buildVsBuy.buyTotalCost,
    );
  });

  it('tallies the non-financial checklist by sign', () => {
    expect(
      checklistTally({
        ...defaultInputs,
        bvbFunctionalFit: -1,
        bvbDataOwnership: 1,
        bvbVendorLockIn: 1,
        bvbSecurity: 3,
      }),
    ).toEqual({ build: 3, buy: 1, neutral: 2 });
  });

  it('writes a headline for each recommendation', () => {
    const b = calculateBusinessCase(defaultInputs).buildVsBuy;
    expect(
      buildVsBuyHeadline({ ...b, recommendation: 'build', npvAdvantageOfBuild: 1000 }, fmt),
    ).toBe('Building is ahead by $1,000 in NPV.');
    expect(
      buildVsBuyHeadline({ ...b, recommendation: 'buy', npvAdvantageOfBuild: -2500 }, fmt),
    ).toBe('Buying is ahead by $2,500 in NPV.');
    expect(
      buildVsBuyHeadline({ ...b, recommendation: 'close', npvAdvantageOfBuild: -10 }, fmt),
    ).toMatch(/Too close to call.*\$10 apart/);
    expect(buildVsBuyHeadline({ ...b, recommendation: 'not-configured' }, fmt)).toMatch(/Enter/);
  });
});
