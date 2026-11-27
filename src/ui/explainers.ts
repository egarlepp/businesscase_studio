import { SCENARIO_MULTIPLIERS } from '../data/defaults';
import type { Inputs, ScenarioName } from '../types';
import { fieldLocation } from './fields';

/** One-line purpose of each scenario, shown above its adjustments. */
const SCENARIO_SUMMARY: Record<ScenarioName, string> = {
  Conservative: 'Stress test: lower benefits, higher running costs.',
  Expected: 'Your inputs exactly as entered. No adjustments.',
  Upside: 'Optimistic case: stronger uptake, lower running costs.',
};

export interface ScenarioExplainer {
  summary: string;
  /** e.g. "Adoption rate −20%". Empty for Expected. */
  adjustments: string[];
}

function formatChange(multiplier: number): string {
  const pct = Math.round((multiplier - 1) * 100);
  return pct >= 0 ? `+${pct}%` : `−${Math.abs(pct)}%`;
}

/** Plain-language description of what a scenario does to the inputs, built from the real multipliers. */
export function explainScenario(name: ScenarioName): ScenarioExplainer {
  const entries = Object.entries(SCENARIO_MULTIPLIERS[name]) as [keyof Inputs, number][];
  return {
    summary: SCENARIO_SUMMARY[name],
    adjustments: entries.map(
      ([key, m]) => `${fieldLocation(key)?.label ?? String(key)} ${formatChange(m)}`,
    ),
  };
}

/** Qualitative band for the model confidence score (possible range is 64–100). */
export function confidenceBand(score: number): string {
  if (score >= 85) return 'High: the case rests on solid adoption, realization, and engineering.';
  if (score >= 72) return 'Moderate: usable, but check the weaker inputs before presenting.';
  return 'Low: treat the figures as directional until adoption and quality improve.';
}
