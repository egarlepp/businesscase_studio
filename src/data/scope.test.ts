import { describe, expect, it } from 'vitest';
import { calculateBusinessCase } from '../calculations/engine';
import { stepsFor, type GuideAnswers } from '../guide/steps';
import { parseDraft } from '../persistence/draft';
import type { Inputs } from '../types';
import { blankInputs, defaultInputs } from './defaults';
import {
  MODULES,
  SCOPE_INPUT_KEYS,
  SCOPE_QUESTIONS,
  isSectionOff,
  moduleStatuses,
  recommendModule,
  suggestClaims,
} from './scope';
import { VALUE_TYPES } from './valueTypes';

const blank = (over: Partial<Inputs> = {}): Inputs => ({ ...blankInputs, ...over });
const tierOf = (inputs: Inputs, id: string) => moduleStatuses(inputs).find((m) => m.id === id)!;

describe('module recommendations', () => {
  it('leaves every module optional until the scope is answered', () => {
    for (const m of moduleStatuses(blank())) {
      expect(m.tier, m.id).toBe('optional');
      expect(m.overridden).toBe(false);
    }
  });

  it('follows the AI build, buy option, and stage answers', () => {
    expect(recommendModule(blank({ scopeAiBuild: 'yes' }), 'aiDevelopment').tier).toBe('essential');
    expect(recommendModule(blank({ scopeAiBuild: 'no' }), 'aiDevelopment').tier).toBe('off');
    expect(recommendModule(blank({ scopeBuyOption: 'no' }), 'buildVsBuy').tier).toBe('off');
    expect(recommendModule(blank({ scopeStage: 'live' }), 'actuals').tier).toBe('essential');
    expect(recommendModule(blank({ scopeStage: 'idea' }), 'actuals').tier).toBe('off');
    expect(recommendModule(blank({ scopeStage: 'built' }), 'actuals').tier).toBe('optional');
  });

  it('makes technical health essential for customer-facing, sensitive, or AI-core apps', () => {
    expect(recommendModule(blank(), 'technicalHealth').tier).toBe('optional');
    for (const over of [
      { scopeUsers: 'customer' },
      { scopeData: 'regulated' },
      { scopeData: 'personal' },
      { scopeIntegrations: 'many' },
      { scopeAiRuntime: 'core' },
    ])
      expect(recommendModule(blank(over), 'technicalHealth').tier).toBe('essential');
    // Never recommended off: only the user can turn it off.
    expect(
      recommendModule(blank({ scopeUsers: 'internal', scopeData: 'none' }), 'technicalHealth').tier,
    ).toBe('optional');
  });

  it('lets an override win over the recommendation, and ignores invalid overrides', () => {
    const on = blank({ scopeAiBuild: 'no', moduleAiDevelopment: 'essential' });
    expect(tierOf(on, 'aiDevelopment')).toMatchObject({ tier: 'essential', overridden: true });
    expect(tierOf(on, 'aiDevelopment').recommended.tier).toBe('off');
    const junk = blank({ scopeAiBuild: 'no', moduleAiDevelopment: 'maybe' });
    expect(tierOf(junk, 'aiDevelopment')).toMatchObject({ tier: 'off', overridden: false });
    expect(isSectionOff(junk, 'AI Development')).toBe(true);
    expect(isSectionOff(junk, 'Benefits')).toBe(false);
  });
});

describe('claim suggestions', () => {
  it('suggests real value types without duplicates', () => {
    const all = suggestClaims(
      blank({
        scopeAppType: 'integration',
        scopeUsers: 'customer',
        scopeData: 'regulated',
        scopeIntegrations: 'many',
      }),
    );
    const ids = all.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(VALUE_TYPES.some((t) => t.id === id)).toBe(true);
    expect(ids.slice(0, 2)).toEqual(['compliance', 'risk']);
    expect(ids).toEqual(expect.arrayContaining(['techDebt', 'revenue', 'retention']));
  });

  it('suggests nothing for an unanswered scope', () => {
    expect(suggestClaims(blank())).toEqual([]);
  });
});

describe('scope guardrails', () => {
  const warningsFor = (over: Partial<Inputs>) => calculateBusinessCase(blank(over)).warnings;

  it('adds no warnings to an unanswered blank case or to the sample case', () => {
    const blankWarnings = calculateBusinessCase(blank()).warnings;
    expect(blankWarnings.some((w) => /scope|essential|not applicable/i.test(w))).toBe(false);
    const sample = calculateBusinessCase(defaultInputs).warnings;
    expect(sample.some((w) => /essential|not applicable|production|sensitive/i.test(w))).toBe(
      false,
    );
  });

  it('flags missing costs the scope makes essential', () => {
    expect(warningsFor({ scopeAiRuntime: 'core' })).toContain(
      'The app calls AI models in production, but monthly AI runtime cost is zero.',
    );
    expect(warningsFor({ scopeData: 'regulated' }).join(' ')).toMatch(/security review hours/);
    expect(warningsFor({ scopeData: 'regulated' }).join(' ')).toMatch(/governance/);
    expect(warningsFor({ scopeUsers: 'customer' }).join(' ')).toMatch(/monitoring/);
    expect(warningsFor({ scopeIntegrations: 'many' }).join(' ')).toMatch(/architecture hours/);
    expect(warningsFor({ scopeStage: 'live' }).join(' ')).toMatch(/Actuals/);
    expect(warningsFor({ scopeBuyOption: 'yes' }).join(' ')).toMatch(/commercial option/);
    expect(warningsFor({ scopeAiBuild: 'yes' }).join(' ')).toMatch(/no AI spend/);
  });

  it('keeps costs of a module that is off, and says so', () => {
    const on = calculateBusinessCase(blank({ aiSubscriptions: 5000, initialLaborRate: 100 }));
    const off = calculateBusinessCase(
      blank({ aiSubscriptions: 5000, initialLaborRate: 100, scopeAiBuild: 'no' }),
    );
    expect(off.totalCosts).toBe(on.totalCosts);
    expect(off.warnings.join(' ')).toMatch(/still count in TCO/);
  });
});

describe('scope and the walkthrough', () => {
  const answers: GuideAnswers = {
    audience: 'cfo',
    stage: 'idea',
    aiAssisted: 'no',
    buyOption: 'no',
    levers: ['productivity'],
  };
  const ids = (scope?: Inputs) => stepsFor(answers, scope).map((s) => s.id);

  it('follows the module tiers when the case has a scope', () => {
    expect(ids()).not.toContain('ai-development');
    expect(ids(blank({ scopeAiBuild: 'no', moduleAiDevelopment: 'optional' }))).toContain(
      'ai-development',
    );
    expect(ids(blank({ moduleBuildVsBuy: 'off' }))).not.toContain('build-vs-buy');
    expect(ids(blank({ moduleTechnicalHealth: 'off' }))).not.toContain('technical-health');
    expect(ids(blank({ scopeStage: 'live' }))).toContain('actuals');
  });
});

describe('scope in saved drafts', () => {
  const file = (inputs: Record<string, unknown>) => ({
    schema: 'business-case-studio/draft',
    version: 2,
    inputs,
    scenario: 'Expected',
    assumptions: [],
  });

  it('opens an older draft with an unanswered scope and no warning about it', () => {
    const old = Object.fromEntries(
      Object.entries(defaultInputs).filter(
        ([key]) => !(SCOPE_INPUT_KEYS as readonly string[]).includes(key),
      ),
    );
    const result = parseDraft(file(old));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const key of SCOPE_INPUT_KEYS) expect(result.state.inputs[key]).toBe('');
    expect(result.warnings.join(' ')).not.toMatch(/scope|module/i);
  });

  it('round-trips valid scope and clears values outside the option lists', () => {
    const result = parseDraft(
      file({
        ...defaultInputs,
        scopeData: 'regulated',
        scopeUsers: 'aliens',
        moduleActuals: 'off',
        moduleBuildVsBuy: 'sometimes',
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.inputs.scopeData).toBe('regulated');
    expect(result.state.inputs.moduleActuals).toBe('off');
    expect(result.state.inputs.scopeUsers).toBe('');
    expect(result.state.inputs.moduleBuildVsBuy).toBe('');
    expect(result.warnings.join(' ')).toMatch(/scopeUsers.*moduleBuildVsBuy/);
  });

  it('gives each scope question unique option values and each module a page', () => {
    for (const q of SCOPE_QUESTIONS)
      expect(new Set(q.options.map((o) => o.value)).size).toBe(q.options.length);
    expect(new Set(MODULES.map((m) => m.section)).size).toBe(MODULES.length);
  });
});
