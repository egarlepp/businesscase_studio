import type { BuildVsBuyResults, Inputs, Results } from '../types';
import { FIELD_GROUPS } from './fields';
import type { Formatters } from './format';

const CHECKLIST_KEYS = (FIELD_GROUPS['Build vs Buy'] ?? [])
  .flatMap((g) => g.fields)
  .filter((f) => f.kind === 'preference');

/** One-line verdict for the comparison, shared with the Reports page. */
export function buildVsBuyHeadline(b: BuildVsBuyResults, fmt: Formatters): string {
  switch (b.recommendation) {
    case 'build':
      return `Building is ahead by ${fmt.money(b.npvAdvantageOfBuild)} in NPV.`;
    case 'buy':
      return `Buying is ahead by ${fmt.money(-b.npvAdvantageOfBuild)} in NPV.`;
    case 'close':
      return `Too close to call on NPV: the options are ${fmt.money(Math.abs(b.npvAdvantageOfBuild))} apart.`;
    case 'not-configured':
      return 'Enter the commercial option’s costs below to compare it with building.';
  }
}

export function checklistTally(inputs: Inputs) {
  const values = CHECKLIST_KEYS.map((f) => Math.sign(Number(inputs[f.key])));
  return {
    build: values.filter((v) => v > 0).length,
    buy: values.filter((v) => v < 0).length,
    neutral: values.filter((v) => v === 0).length,
  };
}

export interface CumulativePoint {
  label: string;
  build: number;
  buy: number;
}

/** Undiscounted cumulative net value for each option, starting after one-time costs. */
export function cumulativeNetSeries(r: Results): CumulativePoint[] {
  const points: CumulativePoint[] = [
    { label: 'Start', build: -r.initialCost, buy: -r.buildVsBuy.buyInitialCost },
  ];
  for (const y of r.buildVsBuy.annual) {
    const previous = points[points.length - 1];
    points.push({
      label: `Year ${y.year}`,
      build: previous.build + y.buildBenefits - y.buildCost,
      buy: previous.buy + y.buyBenefits - y.buyCost,
    });
  }
  return points;
}
