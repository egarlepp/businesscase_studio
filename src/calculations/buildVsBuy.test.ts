import { describe, expect, it } from 'vitest';
import { defaultInputs } from '../data/defaults';
import type { AnnualBreakdown, Inputs } from '../types';
import { calculateBuildVsBuy, calculateBusinessCase, CLOSE_CALL_SHARE } from './engine';

const row = (year: number, benefits: number, costs: number): AnnualBreakdown => ({
  year,
  benefits,
  oneTimeBenefits: 0,
  costs,
  net: benefits - costs,
  discountedNet: 0,
  cumulativeNet: 0,
});

// Build side: 2 years, TCO 200,000, NPV 50,000.
const build = {
  years: 2,
  annualBreakdown: [row(1, 100_000, 30_000), row(2, 110_000, 31_000)],
  totalCosts: 200_000,
  npv: 50_000,
};

// Buy side: 20,000 one-time; 20,000/year growing 10%; 50% benefit fit; 10% discount rate.
const vendor: Inputs = {
  ...defaultInputs,
  discountRate: 0.1,
  buyImplementationCost: 10_000,
  buyIntegrationCost: 5_000,
  buyTrainingCost: 5_000,
  buySubscriptionPerUserMonth: 10,
  buyLicensedUsers: 100,
  buyAnnualPlatformFee: 3_000,
  buyAnnualAdministration: 5_000,
  buyPriceGrowthRate: 0.1,
  buyBenefitFit: 0.5,
};

describe('calculateBuildVsBuy', () => {
  it('matches a hand-calculated comparison', () => {
    const r = calculateBuildVsBuy(vendor, build);
    expect(r.configured).toBe(true);
    expect(r.buyInitialCost).toBe(20_000);
    expect(r.buyAnnualCost).toBe(20_000);
    expect(r.annual.map((y) => y.buyCost)).toEqual([20_000, 22_000]);
    expect(r.buyTotalCost).toBeCloseTo(62_000);
    expect(r.buyTotalBenefits).toBeCloseTo(105_000);
    // −20,000 + 30,000/1.1 + 33,000/1.21
    expect(r.buyNpv).toBeCloseTo(34_545.45, 1);
    expect(r.buyRoi).toBeCloseTo(43_000 / 62_000);
    expect(r.npvAdvantageOfBuild).toBeCloseTo(15_454.55, 1);
    expect(r.tcoDifference).toBeCloseTo(-138_000);
    expect(r.recommendation).toBe('build');
  });

  it('recommends buying when the commercial NPV is clearly higher', () => {
    const r = calculateBuildVsBuy({ ...vendor, buyBenefitFit: 1 }, build);
    expect(r.npvAdvantageOfBuild).toBeLessThan(0);
    expect(r.recommendation).toBe('buy');
  });

  it('reports a close call within the band and explains it', () => {
    const band = CLOSE_CALL_SHARE * build.totalCosts;
    const r = calculateBuildVsBuy(vendor, { ...build, npv: 34_545.45 + band / 2 });
    expect(r.recommendation).toBe('close');
    expect(r.warnings.join(' ')).toMatch(/non-financial checklist/);
  });

  it('is not configured, with no warnings, when every commercial cost is zero', () => {
    const r = calculateBuildVsBuy(
      {
        ...vendor,
        buyImplementationCost: 0,
        buyIntegrationCost: 0,
        buyTrainingCost: 0,
        buySubscriptionPerUserMonth: 0,
        buyAnnualPlatformFee: 0,
        buyAnnualAdministration: 0,
        buyPriceGrowthRate: 0,
      },
      build,
    );
    expect(r.configured).toBe(false);
    expect(r.recommendation).toBe('not-configured');
    expect(r.warnings).toEqual([]);
  });

  it('clamps benefit fit to 100% and warns about it', () => {
    const r = calculateBuildVsBuy({ ...vendor, buyBenefitFit: 1.4 }, build);
    expect(r.buyTotalBenefits).toBeCloseTo(210_000);
    expect(r.warnings.join(' ')).toMatch(/Commercial fit is 100%/);
  });

  it('warns about missing price escalation and a per-user price with no users', () => {
    const r = calculateBuildVsBuy({ ...vendor, buyPriceGrowthRate: 0, buyLicensedUsers: 0 }, build);
    const text = r.warnings.join(' ');
    expect(text).toMatch(/No vendor price escalation/);
    expect(text).toMatch(/licensed users is zero/);
  });

  it('ignores negative cost inputs', () => {
    const r = calculateBuildVsBuy({ ...vendor, buyImplementationCost: -50_000 }, build);
    expect(r.buyInitialCost).toBe(10_000);
  });
});

describe('build vs buy in the business case', () => {
  it('uses the build case totals and covers every year of the horizon', () => {
    const r = calculateBusinessCase(defaultInputs);
    expect(r.buildVsBuy.buildTotalCost).toBe(r.totalCosts);
    expect(r.buildVsBuy.buildNpv).toBe(r.npv);
    expect(r.buildVsBuy.annual).toHaveLength(r.annualBreakdown.length);
    expect(r.buildVsBuy.configured).toBe(true);
  });

  it('credits the commercial option with the fit share of one-time benefits too', () => {
    const r = calculateBusinessCase(defaultInputs);
    expect(r.buildVsBuy.buyTotalBenefits).toBeCloseTo(
      r.totalBenefits * defaultInputs.buyBenefitFit,
    );
  });

  it('does not change any build-side result', () => {
    const base = calculateBusinessCase(defaultInputs);
    const other = calculateBusinessCase({ ...defaultInputs, buyImplementationCost: 1e6 });
    expect(other.npv).toBe(base.npv);
    expect(other.totalCosts).toBe(base.totalCosts);
    expect(other.warnings).toEqual(base.warnings);
  });
});
