import { describe, expect, it } from 'vitest';
import { getFormula } from '../calculations/formulas';
import { defaultInputs } from '../data/defaults';
import { FIELD_GROUPS, fieldLocation } from '../ui/fields';
import { AUDIENCES, VALUE_LEVERS, getAudience } from './audiences';
import { GUIDE_STEPS, stepsFor, type GuideAnswers } from './steps';
import { GUIDE_STORAGE_KEY, emptyGuideState, loadGuideState, parseGuideState } from './storage';

const SECTIONS = new Set([
  'Overview',
  'Reports',
  'Scenarios',
  'Assumptions',
  'Build vs Buy',
  'AI Development',
  'Technical Health',
  ...Object.keys(FIELD_GROUPS),
]);

const answers = (over: Partial<GuideAnswers> = {}): GuideAnswers => ({
  audience: 'cfo',
  stage: 'idea',
  aiAssisted: 'yes',
  buyOption: 'yes',
  levers: ['productivity'],
  ...over,
});

describe('guide content', () => {
  it('has unique step ids that point at real pages', () => {
    const ids = GUIDE_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of GUIDE_STEPS) expect(SECTIONS.has(s.section)).toBe(true);
  });

  it('only gives examples for editable inputs, on the step’s own page, with a valid type', () => {
    for (const s of GUIDE_STEPS) {
      for (const ex of s.examples) {
        const loc = fieldLocation(ex.key);
        expect(loc, `${s.id}: ${ex.key}`).toBeDefined();
        expect(loc!.section, `${s.id}: ${ex.key}`).toBe(s.section);
        expect(typeof ex.value).toBe(typeof defaultInputs[ex.key]);
        if (loc!.kind === 'percent') expect(Number(ex.value)).toBeLessThanOrEqual(1);
        if (loc!.kind === 'score') expect([1, 2, 3, 4, 5]).toContain(ex.value);
      }
    }
  });

  it('defines each audience fully, with headline metrics that exist', () => {
    const ids = AUDIENCES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining(['it-manager', 'cio', 'cfo', 'cro', 'coo', 'ciso', 'board']),
    );
    const levers = VALUE_LEVERS.map((l) => l.id);
    for (const a of AUDIENCES) {
      expect(a.headlineMetrics.length).toBeGreaterThan(0);
      for (const m of a.headlineMetrics) expect(getFormula(m), `${a.id}: ${m}`).toBeDefined();
      for (const s of a.focusSections) expect(SECTIONS.has(s)).toBe(true);
      for (const s of Object.keys(a.emphasis)) expect(SECTIONS.has(s)).toBe(true);
      for (const l of a.defaultLevers) expect(levers).toContain(l);
      expect(a.storyline.length).toBeGreaterThan(0);
      expect(a.questions.length).toBeGreaterThan(0);
    }
  });

  it('falls back to the general audience for an unknown id', () => {
    expect(getAudience('nope' as never).id).toBe('general');
  });
});

describe('stepsFor', () => {
  const ids = (a: GuideAnswers) => stepsFor(a).map((s) => s.id);

  it('includes a Benefits step only for chosen value levers', () => {
    expect(ids(answers({ levers: ['revenue'] }))).toContain('benefits-revenue');
    expect(ids(answers({ levers: ['revenue'] }))).not.toContain('benefits-productivity');
  });

  it('skips AI development and build vs buy when answered no, keeps them when unsure', () => {
    const no = ids(answers({ aiAssisted: 'no', buyOption: 'no' }));
    expect(no).not.toContain('ai-development');
    expect(no).not.toContain('build-vs-buy');
    const unsure = ids(answers({ aiAssisted: 'unsure', buyOption: 'unsure' }));
    expect(unsure).toContain('ai-development');
    expect(unsure).toContain('build-vs-buy');
  });

  it('includes actuals only once the initiative is live', () => {
    expect(ids(answers({ stage: 'built' }))).not.toContain('actuals');
    expect(ids(answers({ stage: 'live' }))).toContain('actuals');
  });

  it('always starts at the profile and ends at reports', () => {
    const steps = ids(answers());
    expect(steps[0]).toBe('profile-basics');
    expect(steps.at(-1)).toBe('present');
  });
});

describe('guide storage', () => {
  it('returns an empty state for missing or corrupt data', () => {
    expect(parseGuideState(null)).toEqual(emptyGuideState());
    expect(parseGuideState('{oops')).toEqual(emptyGuideState());
    expect(parseGuideState('[]')).toEqual(emptyGuideState());
  });

  it('keeps valid fields and drops unknown ones', () => {
    const state = parseGuideState(
      JSON.stringify({
        answers: { audience: 'cro', stage: 'weird', aiAssisted: 'no', levers: ['revenue', 'x'] },
        stepId: 'benefits-revenue',
        done: ['profile-basics', 'gone'],
        introDismissed: true,
      }),
    );
    expect(state).toEqual({
      answers: {
        audience: 'cro',
        stage: 'idea',
        aiAssisted: 'no',
        buyOption: 'unsure',
        levers: ['revenue'],
      },
      stepId: 'benefits-revenue',
      done: ['profile-basics'],
      introDismissed: true,
    });
  });

  it('drops answers with an unknown audience and steps that no longer exist', () => {
    const state = parseGuideState(JSON.stringify({ answers: { audience: 'ceo' }, stepId: 'old' }));
    expect(state.answers).toBeNull();
    expect(state.stepId).toBeNull();
  });

  it('survives storage that throws', () => {
    const storage = {
      getItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(loadGuideState(storage)).toEqual(emptyGuideState());
    expect(GUIDE_STORAGE_KEY).toMatch(/guide/);
  });
});
