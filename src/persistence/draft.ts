import {
  BUILD_VS_BUY_KEYS,
  BUY_COST_KEYS,
  defaultAssumptions,
  defaultInputs,
  SCENARIOS,
} from '../data/defaults';
import { normalizeCurrency } from '../ui/format';
import type { AssumptionItem, Confidence, Inputs, Results, ScenarioName } from '../types';

export const DRAFT_SCHEMA = 'business-case-studio/draft';
/** Bump when the draft shape changes, and add a migration in `parseDraft`. */
export const DRAFT_VERSION = 1;
export const STORAGE_KEY = 'business-case-studio:draft';

const MAX_TEXT_LENGTH = 500;
const MAX_ASSUMPTIONS = 500;
const CONFIDENCE_LEVELS: readonly Confidence[] = [
  'Measured',
  'Validated',
  'Estimated',
  'Proxy',
  'Speculative',
];
const STATUSES: readonly AssumptionItem['status'][] = ['Draft', 'Reviewed', 'Approved'];

/** The editable state of a business case. Results are always recomputed, never restored. */
export interface DraftState {
  inputs: Inputs;
  scenario: ScenarioName;
  assumptions: AssumptionItem[];
}

export interface DraftFile extends DraftState {
  schema: typeof DRAFT_SCHEMA;
  version: number;
  appVersion: string;
  exportedAt: string;
  /** Informational snapshot for readers of the file; ignored on import. */
  results: Results;
}

export type ParseResult =
  { ok: true; state: DraftState; warnings: string[] } | { ok: false; error: string };

export function createDraftFile(
  state: DraftState,
  results: Results,
  appVersion: string,
  now: Date = new Date(),
): DraftFile {
  return {
    schema: DRAFT_SCHEMA,
    version: DRAFT_VERSION,
    appVersion,
    exportedAt: now.toISOString(),
    inputs: state.inputs,
    scenario: state.scenario,
    assumptions: state.assumptions,
    results,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function parseInputs(raw: unknown, warnings: string[]): Inputs {
  const inputs: Inputs = { ...defaultInputs };
  if (!isRecord(raw)) {
    warnings.push('No inputs found; sample defaults were used.');
    return inputs;
  }
  const rejected: string[] = [];
  for (const key of Object.keys(defaultInputs) as (keyof Inputs)[]) {
    if (!(key in raw)) continue;
    const value = raw[key];
    const expected = typeof defaultInputs[key];
    if (expected === 'number' && typeof value === 'number' && Number.isFinite(value)) {
      (inputs[key] as number) = value;
    } else if (expected === 'string' && typeof value === 'string') {
      (inputs[key] as string) = value.slice(0, MAX_TEXT_LENGTH);
    } else {
      rejected.push(key);
    }
  }
  const currency = normalizeCurrency(inputs.currency);
  if (currency !== inputs.currency.trim().toUpperCase())
    warnings.push(`Unknown currency "${inputs.currency}"; using ${currency}.`);
  inputs.currency = currency;

  // Migration: drafts saved before v0.4.0 have no build-vs-buy inputs. Leave the comparison
  // unconfigured instead of silently applying the illustrative vendor figures.
  const migrated = new Set<string>();
  if (!BUILD_VS_BUY_KEYS.some((key) => key in raw)) {
    for (const key of BUY_COST_KEYS) inputs[key] = 0;
    BUILD_VS_BUY_KEYS.forEach((key) => migrated.add(key));
    warnings.push(
      'This draft predates the build-vs-buy comparison; enter vendor costs on the Build vs Buy page to use it.',
    );
  }

  const unknown = Object.keys(raw).filter((key) => !(key in defaultInputs));
  if (rejected.length)
    warnings.push(`Ignored invalid values for: ${rejected.join(', ')} (defaults kept).`);
  if (unknown.length) warnings.push(`Ignored unrecognized fields: ${unknown.join(', ')}.`);
  const missing = Object.keys(defaultInputs).filter((key) => !(key in raw) && !migrated.has(key));
  if (missing.length) warnings.push(`Filled missing fields with defaults: ${missing.join(', ')}.`);
  return inputs;
}

function parseAssumptions(raw: unknown, warnings: string[]): AssumptionItem[] {
  if (raw === undefined) return defaultAssumptions;
  if (!Array.isArray(raw)) {
    warnings.push('Assumption register was not a list; sample assumptions were used.');
    return defaultAssumptions;
  }
  const text = (value: unknown) =>
    typeof value === 'string' ? value.slice(0, MAX_TEXT_LENGTH) : '';
  const items: AssumptionItem[] = [];
  let skipped = 0;
  for (const [index, entry] of raw.slice(0, MAX_ASSUMPTIONS).entries()) {
    if (!isRecord(entry) || typeof entry.name !== 'string') {
      skipped++;
      continue;
    }
    items.push({
      id: typeof entry.id === 'string' && entry.id ? entry.id : `imported-${index + 1}`,
      name: text(entry.name),
      category: text(entry.category),
      owner: text(entry.owner),
      source: text(entry.source),
      confidence: CONFIDENCE_LEVELS.includes(entry.confidence as Confidence)
        ? (entry.confidence as Confidence)
        : 'Estimated',
      status: STATUSES.includes(entry.status as AssumptionItem['status'])
        ? (entry.status as AssumptionItem['status'])
        : 'Draft',
    });
  }
  if (raw.length > MAX_ASSUMPTIONS)
    warnings.push(`Only the first ${MAX_ASSUMPTIONS} assumptions were imported.`);
  if (skipped) warnings.push(`Skipped ${skipped} invalid assumption(s).`);
  return items;
}

/**
 * Validate and migrate an untrusted draft. Accepts the current versioned format and the legacy
 * unversioned export (`{ inputs, scenario, results, assumptions }`). Never throws.
 */
export function parseDraft(data: unknown): ParseResult {
  if (!isRecord(data)) return { ok: false, error: 'The file does not contain a draft object.' };
  const warnings: string[] = [];

  if ('schema' in data) {
    if (data.schema !== DRAFT_SCHEMA)
      return { ok: false, error: 'This file is not a Business Case Studio draft.' };
    const version = data.version;
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1)
      return { ok: false, error: 'The draft version is missing or invalid.' };
    if (version > DRAFT_VERSION)
      return {
        ok: false,
        error: `This draft was saved by a newer version (format ${version}). Update the app to open it.`,
      };
  } else if (isRecord(data.inputs)) {
    warnings.push('Imported a legacy (unversioned) export.');
  } else {
    return { ok: false, error: 'This file is not a Business Case Studio draft.' };
  }

  const inputs = parseInputs(data.inputs, warnings);
  let scenario: ScenarioName = 'Expected';
  if (SCENARIOS.includes(data.scenario as ScenarioName)) scenario = data.scenario as ScenarioName;
  else if (data.scenario !== undefined) warnings.push('Unknown scenario; Expected was selected.');
  const assumptions = parseAssumptions(data.assumptions, warnings);
  return { ok: true, state: { inputs, scenario, assumptions }, warnings };
}

export function parseDraftText(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  return parseDraft(data);
}

/** Returns browser storage, or undefined where it is unavailable or blocked. */
export function getBrowserStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadStoredDraft(storage: Storage | undefined): DraftState | null {
  if (!storage) return null;
  try {
    const text = storage.getItem(STORAGE_KEY);
    if (!text) return null;
    const result = parseDraftText(text);
    return result.ok ? result.state : null;
  } catch {
    return null;
  }
}

export function saveStoredDraft(storage: Storage | undefined, state: DraftState): boolean {
  if (!storage) return false;
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schema: DRAFT_SCHEMA, version: DRAFT_VERSION, ...state }),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearStoredDraft(storage: Storage | undefined): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: nothing to clear.
  }
}
