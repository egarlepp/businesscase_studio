import { describe, expect, it } from 'vitest';
import { calculateBusinessCase } from '../calculations/engine';
import { defaultAssumptions, defaultInputs } from '../data/defaults';
import {
  DRAFT_SCHEMA,
  DRAFT_VERSION,
  STORAGE_KEY,
  clearStoredDraft,
  createDraftFile,
  loadStoredDraft,
  parseDraft,
  parseDraftText,
  saveStoredDraft,
  type DraftState,
} from './draft';

const state: DraftState = {
  inputs: { ...defaultInputs, applicationName: 'Pipeline Hub', users: 120, currency: 'EUR' },
  scenario: 'Upside',
  assumptions: defaultAssumptions,
};

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

describe('draft export/import', () => {
  it('round-trips a versioned draft', () => {
    const file = createDraftFile(state, calculateBusinessCase(state.inputs), '0.3.0');
    expect(file.schema).toBe(DRAFT_SCHEMA);
    expect(file.version).toBe(DRAFT_VERSION);
    const parsed = parseDraftText(JSON.stringify(file));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.state).toEqual(state);
      expect(parsed.warnings).toEqual([]);
    }
  });

  it('imports the legacy unversioned export format', () => {
    // Legacy exports predate monthsSinceLaunch.
    const legacyInputs: Partial<typeof defaultInputs> = { ...defaultInputs, users: 5 };
    delete legacyInputs.monthsSinceLaunch;
    const legacy = {
      inputs: legacyInputs,
      scenario: 'Conservative',
      results: {},
    };
    const parsed = parseDraft(legacy);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.state.inputs.users).toBe(5);
      expect(parsed.state.scenario).toBe('Conservative');
      expect(parsed.warnings.join(' ')).toMatch(/legacy/i);
      expect(parsed.warnings.join(' ')).toMatch(/monthsSinceLaunch/);
    }
  });

  it('rejects non-drafts, foreign schemas, and newer versions', () => {
    expect(parseDraftText('not json').ok).toBe(false);
    expect(parseDraft([]).ok).toBe(false);
    expect(parseDraft({ hello: 'world' }).ok).toBe(false);
    expect(parseDraft({ schema: 'other-app', version: 1, inputs: {} }).ok).toBe(false);
    const newer = parseDraft({ schema: DRAFT_SCHEMA, version: DRAFT_VERSION + 1, inputs: {} });
    expect(newer.ok).toBe(false);
    if (!newer.ok) expect(newer.error).toMatch(/newer version/);
  });

  it('keeps defaults for wrongly typed values and reports ignored fields', () => {
    const parsed = parseDraft({
      schema: DRAFT_SCHEMA,
      version: 1,
      inputs: { users: '100', horizonYears: Infinity, evil: 1, applicationName: 7 },
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.state.inputs.users).toBe(defaultInputs.users);
      expect(parsed.state.inputs.applicationName).toBe(defaultInputs.applicationName);
      const text = parsed.warnings.join(' ');
      expect(text).toMatch(/users/);
      expect(text).toMatch(/evil/);
    }
  });

  it('leaves build vs buy unconfigured for drafts saved before v0.4.0', () => {
    const legacyInputs: Record<string, unknown> = { ...defaultInputs };
    for (const key of Object.keys(legacyInputs))
      if (key.startsWith('buy') || key.startsWith('bvb')) delete legacyInputs[key];
    const parsed = parseDraft({ schema: DRAFT_SCHEMA, version: 1, inputs: legacyInputs });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.state.inputs.buyImplementationCost).toBe(0);
      expect(parsed.state.inputs.buySubscriptionPerUserMonth).toBe(0);
      expect(parsed.state.inputs.buyBenefitFit).toBe(defaultInputs.buyBenefitFit);
      const text = parsed.warnings.join(' ');
      expect(text).toMatch(/predates the build-vs-buy comparison/);
      expect(text).not.toMatch(/Filled missing fields/);
    }
  });

  it('keeps build-vs-buy values from a current draft', () => {
    const parsed = parseDraft({
      schema: DRAFT_SCHEMA,
      version: 1,
      inputs: { ...defaultInputs, buyImplementationCost: 1234 },
    });
    expect(parsed.ok && parsed.state.inputs.buyImplementationCost).toBe(1234);
    expect(parsed.ok && parsed.warnings).toEqual([]);
  });

  it('normalizes an invalid currency to USD', () => {
    const parsed = parseDraft({ schema: DRAFT_SCHEMA, version: 1, inputs: { currency: 'XX' } });
    expect(parsed.ok && parsed.state.inputs.currency).toBe('USD');
  });

  it('sanitizes assumptions', () => {
    const parsed = parseDraft({
      schema: DRAFT_SCHEMA,
      version: 1,
      inputs: {},
      assumptions: [
        { name: 'Valid', confidence: 'Measured', status: 'Approved' },
        { name: 'Bad enums', confidence: 'Certain', status: 'Done' },
        { notAName: true },
        'nope',
      ],
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.state.assumptions).toHaveLength(2);
      expect(parsed.state.assumptions[1]).toMatchObject({
        confidence: 'Estimated',
        status: 'Draft',
      });
      expect(parsed.state.assumptions[0].id).toBe('imported-1');
      expect(parsed.warnings.join(' ')).toMatch(/Skipped 2/);
    }
  });
});

describe('browser storage', () => {
  it('saves, loads, and clears a draft', () => {
    const storage = new MemoryStorage();
    expect(loadStoredDraft(storage)).toBeNull();
    expect(saveStoredDraft(storage, state)).toBe(true);
    expect(loadStoredDraft(storage)).toEqual(state);
    clearStoredDraft(storage);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('ignores corrupt stored data and missing storage', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{broken');
    expect(loadStoredDraft(storage)).toBeNull();
    expect(loadStoredDraft(undefined)).toBeNull();
    expect(saveStoredDraft(undefined, state)).toBe(false);
  });

  it('reports failure when storage throws (quota or privacy mode)', () => {
    const storage = new MemoryStorage();
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    expect(saveStoredDraft(storage, state)).toBe(false);
  });
});
