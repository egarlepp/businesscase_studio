import { RATE_KEYS } from '../data/defaults';
import type { Inputs } from '../types';
import { calculateBusinessCase } from './engine';

export type SensitivityMetric = 'npv' | 'roi';

/** Inputs flexed in the tornado analysis: the drivers most likely to move the case. */
export const SENSITIVITY_DRIVERS: (keyof Inputs)[] = [
  'adoptionRate',
  'realizationRate',
  'users',
  'minutesSavedPerUserWeek',
  'loadedHourlyRate',
  'capacityHoursRecoveredYear',
  'capacityRealizationRate',
  'influencedPipeline',
  'incrementalWinRate',
  'contributionRate',
  'grossMargin',
  'riskExposure',
  'initialLaborHours',
  'initialLaborRate',
  'monthlyHosting',
  'monthlySupportHours',
  'annualMaintenance',
  'annualEnhancements',
  'technicalDebtReserveRate',
  'discountRate',
];

export interface SensitivityRow {
  key: keyof Inputs;
  lowInput: number;
  highInput: number;
  /** Metric value with the input flexed down / up. */
  low: number;
  high: number;
  /** Absolute difference between `high` and `low`. */
  swing: number;
}

export interface SensitivityResult {
  metric: SensitivityMetric;
  range: number;
  base: number;
  rows: SensitivityRow[];
}

const RATES = new Set<keyof Inputs>([...RATE_KEYS, 'discountRate', 'technicalDebtReserveRate']);

function metricOf(inputs: Inputs, metric: SensitivityMetric): number {
  const r = calculateBusinessCase(inputs);
  return metric === 'npv' ? r.npv : r.roi;
}

/**
 * One-at-a-time sensitivity: flex each driver by ±`range` (e.g. 0.2 = ±20%) around `base`,
 * holding everything else fixed. Share inputs are clamped to 0–100%. Drivers with no effect are
 * omitted; rows are sorted by swing, largest first.
 */
export function runSensitivity(
  base: Inputs,
  metric: SensitivityMetric,
  range: number,
  drivers: (keyof Inputs)[] = SENSITIVITY_DRIVERS,
): SensitivityResult {
  if (!(range > 0 && range < 1)) throw new RangeError('range must be between 0 and 1 (exclusive)');
  const baseValue = metricOf(base, metric);
  const rows: SensitivityRow[] = [];
  for (const key of drivers) {
    const value = base[key];
    if (typeof value !== 'number') continue;
    const bound = (v: number) => (RATES.has(key) ? Math.min(Math.max(v, 0), 1) : v);
    const lowInput = bound(value * (1 - range));
    const highInput = bound(value * (1 + range));
    const low = metricOf({ ...base, [key]: lowInput }, metric);
    const high = metricOf({ ...base, [key]: highInput }, metric);
    const swing = Math.abs(high - low);
    if (swing > 1e-9) rows.push({ key, lowInput, highInput, low, high, swing });
  }
  rows.sort((a, b) => b.swing - a.swing);
  return { metric, range, base: baseValue, rows };
}
