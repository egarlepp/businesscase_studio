import { describe, expect, it } from 'vitest';
import { calculateActuals, calculateBusinessCase } from '../calculations/engine';
import { applyScenario, blankInputs, BUILD_VS_BUY_KEYS, SCENARIOS } from '../data/defaults';
import { saveStoredDraft, STORAGE_KEY } from '../persistence/draft';
import {
  blankDraft,
  hasEnteredData,
  isSampleDraft,
  loadWorkspacePrefs,
  resolveInitialWorkspace,
  sampleDraft,
  saveWorkspacePrefs,
  WORKSPACE_KEY,
} from './workspace';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

/** Every number in a results object, however deeply nested. */
function numbersIn(value: unknown): number[] {
  if (typeof value === 'number') return [value];
  if (Array.isArray(value)) return value.flatMap(numbersIn);
  if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(numbersIn);
  return [];
}

describe('blank case', () => {
  it('has no names, figures, or assumptions but keeps model conventions', () => {
    const draft = blankDraft();
    expect(draft.assumptions).toEqual([]);
    expect(draft.inputs.applicationName).toBe('');
    expect(draft.inputs.users).toBe(0);
    expect(draft.inputs.influencedPipeline).toBe(0);
    expect(draft.inputs.horizonYears).toBe(3);
    expect(draft.inputs.workWeeks).toBe(48);
    expect(draft.inputs.architectureScore).toBe(3);
    expect(hasEnteredData(draft)).toBe(false);
  });

  it('produces finite results in every scenario', () => {
    for (const scenario of SCENARIOS) {
      const modeled = applyScenario(blankInputs, scenario);
      const results = calculateBusinessCase(modeled);
      const actuals = calculateActuals(modeled, results);
      for (const n of [...numbersIn(results), ...numbersIn(actuals)])
        expect(Number.isFinite(n)).toBe(true);
      expect(results.totalBenefits).toBe(0);
      expect(results.totalCosts).toBe(0);
      expect(results.buildVsBuy.recommendation).toBe('not-configured');
    }
  });

  it('returns fresh copies so callers cannot mutate the template', () => {
    blankDraft().inputs.users = 99;
    expect(blankDraft().inputs.users).toBe(0);
    sampleDraft().assumptions[0]!.name = 'mutated';
    expect(sampleDraft().assumptions[0]!.name).not.toBe('mutated');
  });

  it('detects entered data', () => {
    const draft = blankDraft();
    draft.inputs.applicationName = 'My app';
    expect(hasEnteredData(draft)).toBe(true);
  });

  it("counts a case name as entered data, and a named sample as the user's own case", () => {
    expect(hasEnteredData({ ...blankDraft(), caseName: 'FY27 request' })).toBe(true);
    expect(isSampleDraft({ ...sampleDraft(), caseName: 'FY27 request' })).toBe(false);
  });
});

describe('isSampleDraft', () => {
  it('recognizes the untouched sample, including one saved before build vs buy', () => {
    expect(isSampleDraft(sampleDraft())).toBe(true);
    const legacy = sampleDraft();
    for (const key of BUILD_VS_BUY_KEYS) legacy.inputs[key] = 0;
    legacy.assumptions = legacy.assumptions.filter((a) => a.category !== 'Build vs buy');
    expect(isSampleDraft(legacy)).toBe(true);
  });

  it('rejects an edited sample', () => {
    const edited = sampleDraft();
    edited.inputs.users = 81;
    expect(isSampleDraft(edited)).toBe(false);
    const renamed = sampleDraft();
    renamed.assumptions[0]!.owner = 'Me';
    expect(isSampleDraft(renamed)).toBe(false);
  });
});

describe('workspace prefs', () => {
  it('round-trips and ignores malformed values', () => {
    const storage = memoryStorage();
    expect(loadWorkspacePrefs(storage)).toBeNull();
    saveWorkspacePrefs(storage, { demoMode: true });
    expect(loadWorkspacePrefs(storage)).toEqual({ demoMode: true });
    storage.setItem(WORKSPACE_KEY, '{"demoMode":"yes"}');
    expect(loadWorkspacePrefs(storage)).toBeNull();
    storage.setItem(WORKSPACE_KEY, 'not json');
    expect(loadWorkspacePrefs(storage)).toBeNull();
    expect(loadWorkspacePrefs(undefined)).toBeNull();
  });
});

describe('resolveInitialWorkspace', () => {
  it('asks on a first launch and previews the demo meanwhile', () => {
    const result = resolveInitialWorkspace(memoryStorage());
    expect(result).toMatchObject({ demoMode: true, needsChoice: true });
    expect(isSampleDraft(result.draft)).toBe(true);
  });

  it('asks when the only saved draft is the untouched sample from an earlier version', () => {
    const storage = memoryStorage();
    saveStoredDraft(storage, sampleDraft());
    expect(resolveInitialWorkspace(storage).needsChoice).toBe(true);
  });

  it('keeps an edited draft from an earlier version without asking', () => {
    const storage = memoryStorage();
    const own = sampleDraft();
    own.inputs.applicationName = 'Claims portal';
    saveStoredDraft(storage, own);
    const result = resolveInitialWorkspace(storage);
    expect(result).toMatchObject({ demoMode: false, needsChoice: false });
    expect(result.draft.inputs.applicationName).toBe('Claims portal');
  });

  it('follows the saved mode', () => {
    const storage = memoryStorage();
    saveWorkspacePrefs(storage, { demoMode: false });
    expect(resolveInitialWorkspace(storage).draft).toEqual(blankDraft());

    const own = blankDraft();
    own.inputs.users = 12;
    saveStoredDraft(storage, own);
    expect(resolveInitialWorkspace(storage).draft.inputs.users).toBe(12);

    saveWorkspacePrefs(storage, { demoMode: true });
    const demo = resolveInitialWorkspace(storage);
    expect(demo).toMatchObject({ demoMode: true, needsChoice: false });
    expect(isSampleDraft(demo.draft)).toBe(true);
    // The user's own draft is untouched while the demo is shown.
    expect(storage.getItem(STORAGE_KEY)).toContain('"users":12');
  });
});
