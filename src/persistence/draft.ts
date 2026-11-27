import {
  BUILD_VS_BUY_KEYS,
  BUY_COST_KEYS,
  CORE_VALUE_TYPES,
  VALUE_CLAIM_KEYS,
  blankInputs,
  defaultAssumptions,
  SCENARIOS,
} from '../data/defaults';
import { CLAIM_KEYS, claimKey } from '../data/valueTypes';
import { ASSUMPTION_STATUSES, CONFIDENCE_LEVELS } from '../data/assumptions';
import { parseGuideValue, type GuideState } from '../guide/storage';
import { normalizeCurrency } from '../ui/format';
import type { AssumptionItem, Confidence, Inputs, Results, ScenarioName } from '../types';

export const DRAFT_SCHEMA = 'business-case-studio/draft';
/** Bump when the draft shape changes, and add a migration in `parseDraft`. */
export const DRAFT_VERSION = 2;
export const STORAGE_KEY = 'business-case-studio:draft';

const MAX_TEXT_LENGTH = 500;
/** Longest business case name kept on import or rename. */
export const MAX_CASE_NAME_LENGTH = 120;
const MAX_ASSUMPTIONS = 500;
/** The editable state of a business case. Results are always recomputed, never restored. */
export interface DraftState {
  /**
   * The business case's own title (added in format 2). Distinct from `inputs.applicationName`,
   * which names the initiative being evaluated. Empty means "use the application name".
   */
  caseName: string;
  inputs: Inputs;
  scenario: ScenarioName;
  assumptions: AssumptionItem[];
}

export interface DraftFile extends DraftState {
  schema: typeof DRAFT_SCHEMA;
  version: number;
  appVersion: string;
  exportedAt: string;
  /** Walkthrough answers and progress (format 2), so a reopened case keeps its audience. */
  guide?: GuideProgress;
  /** Informational snapshot for readers of the file; ignored on import. */
  results: Results;
}

/** The part of the walkthrough state that travels with a case file. */
export type GuideProgress = Pick<GuideState, 'answers' | 'stepId' | 'done'>;

export type ParseResult =
  | {
      ok: true;
      state: DraftState;
      /** Walkthrough progress from the file, or null when the file has none. */
      guide: GuideProgress | null;
      warnings: string[];
    }
  | { ok: false; error: string };

export interface DraftFileOptions {
  guide?: GuideProgress | null;
  now?: Date;
}

export function createDraftFile(
  state: DraftState,
  results: Results,
  appVersion: string,
  { guide = null, now = new Date() }: DraftFileOptions = {},
): DraftFile {
  return {
    schema: DRAFT_SCHEMA,
    version: DRAFT_VERSION,
    appVersion,
    exportedAt: now.toISOString(),
    caseName: state.caseName,
    inputs: state.inputs,
    scenario: state.scenario,
    assumptions: state.assumptions,
    // Only a walkthrough that has been set up is worth carrying; an unstarted one adds nothing.
    ...(guide?.answers
      ? { guide: { answers: guide.answers, stepId: guide.stepId, done: guide.done } }
      : {}),
    results,
  };
}

/** Trim and cap a business case name; anything that is not a string becomes empty. */
export function normalizeCaseName(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_CASE_NAME_LENGTH) : '';
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Missing or invalid inputs fall back to the blank case (zero, empty, neutral scores), never to
 * the sample figures: a file saved before a field existed must not gain illustrative benefits
 * or costs the user never entered.
 */
function parseInputs(raw: unknown, warnings: string[]): Inputs {
  const inputs: Inputs = { ...blankInputs };
  if (!isRecord(raw)) {
    warnings.push('No inputs found; the case was opened blank.');
    return inputs;
  }
  const rejected: string[] = [];
  for (const key of Object.keys(blankInputs) as (keyof Inputs)[]) {
    if (!(key in raw)) continue;
    const value = raw[key];
    const expected = typeof blankInputs[key];
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

  // Migration: drafts saved before v0.7.0 have no value-claim flags. The four original benefit
  // panels were always counted, so they stay claimed; the additional value types start off.
  if (!CLAIM_KEYS.some((key) => key in raw)) {
    for (const id of CORE_VALUE_TYPES) inputs[claimKey(id)] = 1;
    VALUE_CLAIM_KEYS.forEach((key) => migrated.add(key));
    warnings.push(
      'This draft predates value claims; its four original benefit types stay claimed. Add others on the Benefits page.',
    );
  }

  const unknown = Object.keys(raw).filter((key) => !(key in blankInputs));
  if (rejected.length)
    warnings.push(`Ignored invalid values for: ${rejected.join(', ')} (left blank).`);
  if (unknown.length) warnings.push(`Ignored unrecognized fields: ${unknown.join(', ')}.`);
  const missing = Object.keys(blankInputs).filter((key) => !(key in raw) && !migrated.has(key));
  if (missing.length)
    warnings.push(`Fields not in the file were left blank: ${missing.join(', ')}.`);
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
      status: ASSUMPTION_STATUSES.includes(entry.status as AssumptionItem['status'])
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
 * Validate and migrate an untrusted draft. Accepts every versioned format up to `DRAFT_VERSION`
 * (format 1 has no case name or walkthrough) and the legacy unversioned export
 * (`{ inputs, scenario, results, assumptions }`). Unknown fields are ignored and missing ones are
 * left blank, so files from other versions of the app still open. Never throws.
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
  const caseName = normalizeCaseName(data.caseName);
  if (typeof data.caseName === 'string' && data.caseName.trim().length > MAX_CASE_NAME_LENGTH)
    warnings.push(`The case name was shortened to ${MAX_CASE_NAME_LENGTH} characters.`);
  let guide: GuideProgress | null = null;
  const rawAnswers = isRecord(data.guide) ? data.guide.answers : undefined;
  if (rawAnswers !== undefined && rawAnswers !== null) {
    const { answers, stepId, done } = parseGuideValue(data.guide);
    if (answers) guide = { answers, stepId, done };
    else warnings.push('Walkthrough answers in the file were not recognized and were skipped.');
  }
  return { ok: true, state: { caseName, inputs, scenario, assumptions }, guide, warnings };
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
