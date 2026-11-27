import {
  BUILD_VS_BUY_CATEGORY,
  BUILD_VS_BUY_KEYS,
  blankInputs,
  defaultAssumptions,
  defaultInputs,
} from '../data/defaults';
import { loadStoredDraft, type DraftState } from '../persistence/draft';
import type { Inputs } from '../types';

/**
 * Workspace mode, stored apart from the draft so that demo data never overwrites the user's own
 * case. Its presence also records that the user has made the first-launch choice.
 */
export const WORKSPACE_KEY = 'business-case-studio:workspace';
export const WORKSPACE_VERSION = 1;

export interface WorkspacePrefs {
  /** True while the sample case is shown. Demo edits are kept in memory only. */
  demoMode: boolean;
}

/** The illustrative case shipped with the app. Returns fresh copies on every call. */
export function sampleDraft(): DraftState {
  return {
    caseName: '',
    inputs: { ...defaultInputs },
    scenario: 'Expected',
    assumptions: defaultAssumptions.map((item) => ({ ...item })),
  };
}

/** An empty case: no names, no figures, no assumptions. Returns fresh copies on every call. */
export function blankDraft(): DraftState {
  return { caseName: '', inputs: { ...blankInputs }, scenario: 'Expected', assumptions: [] };
}

const SKIPPED_SAMPLE_KEYS = new Set<string>(BUILD_VS_BUY_KEYS);

/**
 * True when a stored draft is the untouched sample case. Earlier versions saved the sample
 * on first load, so such a draft is not the user's work. Build-vs-buy inputs and assumptions are
 * ignored because drafts saved before 0.4.0 lack them and are migrated on load.
 */
export function isSampleDraft(state: DraftState): boolean {
  if (state.caseName.trim()) return false;
  const inputsMatch = (Object.keys(defaultInputs) as (keyof Inputs)[])
    .filter((key) => !SKIPPED_SAMPLE_KEYS.has(key))
    .every((key) => state.inputs[key] === defaultInputs[key]);
  if (!inputsMatch) return false;
  const core = (items: DraftState['assumptions']) =>
    JSON.stringify(items.filter((item) => item.category !== BUILD_VS_BUY_CATEGORY));
  return core(state.assumptions) === core(defaultAssumptions);
}

/** True when any figure, name, or assumption differs from a blank case. */
export function hasEnteredData(state: DraftState): boolean {
  if (state.caseName.trim() || state.assumptions.length > 0) return true;
  return (Object.keys(blankInputs) as (keyof Inputs)[]).some(
    (key) => state.inputs[key] !== blankInputs[key],
  );
}

export function loadWorkspacePrefs(storage: Storage | undefined): WorkspacePrefs | null {
  if (!storage) return null;
  try {
    const text = storage.getItem(WORKSPACE_KEY);
    if (!text) return null;
    const data: unknown = JSON.parse(text);
    if (typeof data !== 'object' || data === null) return null;
    const demoMode = (data as Record<string, unknown>).demoMode;
    return typeof demoMode === 'boolean' ? { demoMode } : null;
  } catch {
    return null;
  }
}

export function saveWorkspacePrefs(storage: Storage | undefined, prefs: WorkspacePrefs): boolean {
  if (!storage) return false;
  try {
    storage.setItem(WORKSPACE_KEY, JSON.stringify({ version: WORKSPACE_VERSION, ...prefs }));
    return true;
  } catch {
    return false;
  }
}

export interface InitialWorkspace {
  draft: DraftState;
  demoMode: boolean;
  /** True on a first launch: the user has not yet chosen between a blank case and the demo. */
  needsChoice: boolean;
}

/**
 * Decide what to show on load.
 * - A saved mode wins: demo shows the sample, otherwise the saved draft (or a blank case).
 * - No saved mode but a draft with real edits (an upgrade from an earlier version): keep it.
 * - Otherwise (first launch, or an untouched legacy sample): ask, showing the demo meanwhile.
 */
export function resolveInitialWorkspace(storage: Storage | undefined): InitialWorkspace {
  const prefs = loadWorkspacePrefs(storage);
  const stored = loadStoredDraft(storage);
  if (prefs?.demoMode) return { draft: sampleDraft(), demoMode: true, needsChoice: false };
  if (prefs) return { draft: stored ?? blankDraft(), demoMode: false, needsChoice: false };
  if (stored && !isSampleDraft(stored))
    return { draft: stored, demoMode: false, needsChoice: false };
  return { draft: sampleDraft(), demoMode: true, needsChoice: true };
}
