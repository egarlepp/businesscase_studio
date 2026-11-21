import type { AssumptionItem, Confidence } from '../types';

export const CONFIDENCE_LEVELS: readonly Confidence[] = [
  'Measured',
  'Validated',
  'Estimated',
  'Proxy',
  'Speculative',
];
export const ASSUMPTION_STATUSES: readonly AssumptionItem['status'][] = [
  'Draft',
  'Reviewed',
  'Approved',
];

const WEAK_CONFIDENCE: readonly Confidence[] = ['Proxy', 'Speculative'];

/** A unique id for a new register row. */
export function newAssumptionId(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `a-${random}`;
}

export function blankAssumption(category = ''): AssumptionItem {
  return {
    id: newAssumptionId(),
    name: '',
    category,
    owner: '',
    source: '',
    confidence: 'Estimated',
    status: 'Draft',
  };
}

/** Rows whose category matches, ignoring case and surrounding spaces. */
export function assumptionsInCategory(
  items: readonly AssumptionItem[],
  category: string,
): AssumptionItem[] {
  const target = category.trim().toLowerCase();
  return items.filter((item) => item.category.trim().toLowerCase() === target);
}

export interface EvidenceAssessment {
  rows: AssumptionItem[];
  /** True when there is at least one row and every row has a source. */
  documented: boolean;
  /** Rows still at Proxy/Speculative confidence or not yet reviewed. */
  weak: AssumptionItem[];
}

/** How well a category of assumptions is evidenced. */
export function assessEvidence(
  items: readonly AssumptionItem[],
  category: string,
): EvidenceAssessment {
  const rows = assumptionsInCategory(items, category);
  return {
    rows,
    documented: rows.length > 0 && rows.every((row) => row.source.trim().length > 0),
    weak: rows.filter((row) => WEAK_CONFIDENCE.includes(row.confidence) || row.status === 'Draft'),
  };
}
