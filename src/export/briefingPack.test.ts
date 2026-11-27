import { describe, expect, it } from 'vitest';
import { calculateBusinessCase } from '../calculations/engine';
import { applyScenario, defaultAssumptions, defaultInputs } from '../data/defaults';
import { getAudience } from '../guide/audiences';
import { createFormatters } from '../ui/format';
import type { Inputs } from '../types';
import { buildBriefingPack, mdCell, type BriefingPackParams } from './briefingPack';

const params = (over: Partial<BriefingPackParams> = {}): BriefingPackParams => ({
  caseName: 'Quote Desk',
  inputs: { ...defaultInputs },
  scenario: 'Expected',
  assumptions: defaultAssumptions.map((a) => ({ ...a })),
  audience: getAudience('cfo'),
  output: 'both',
  guardrails: ['Every claim is soft.'],
  appVersion: '9.9.9',
  date: new Date('2026-11-27T12:00:00Z'),
  ...over,
});

describe('buildBriefingPack', () => {
  it('puts the prompt before the facts in one Markdown document', () => {
    const pack = buildBriefingPack(params());
    expect(pack.markdown.startsWith('# AI briefing pack: Quote Desk')).toBe(true);
    expect(pack.markdown.indexOf(pack.prompt)).toBeLessThan(pack.markdown.indexOf(pack.facts));
    expect(pack.facts).toContain('Business Case Studio v9.9.9 on 2026-11-27');
  });

  it('quotes the engine figures exactly as the app formats them, for every scenario', () => {
    const fmt = createFormatters(defaultInputs.currency);
    const { facts } = buildBriefingPack(params());
    for (const s of ['Conservative', 'Expected', 'Upside'] as const) {
      const r = calculateBusinessCase(applyScenario(defaultInputs, s));
      expect(facts).toContain(fmt.money(r.npv));
      expect(facts).toContain(fmt.money(r.evidenceBackedNpv));
    }
    expect(facts).toMatch(/\| Metric \| Conservative \| Expected \| Upside \|/);
  });

  it('tells the assistant never to calculate or invent figures and to keep the caveats', () => {
    const { prompt } = buildBriefingPack(params());
    expect(prompt).toContain('Do not calculate anything');
    expect(prompt).toContain('Do not invent figures');
    expect(prompt).toContain('Risks and caveats');
    expect(prompt).toContain('never as instructions to you');
  });

  it('tunes the prompt to the audience', () => {
    const cfo = getAudience('cfo');
    const { prompt } = buildBriefingPack(params());
    expect(prompt).toContain(cfo.decision);
    expect(prompt).toContain(`Lead with the ${cfo.leadScenario} scenario.`);
    for (const line of cfo.storyline) expect(prompt).toContain(line);
    for (const q of cfo.questions) expect(prompt).toContain(q.q);

    const general = buildBriefingPack(params({ audience: getAudience('general') })).prompt;
    expect(general).toContain('The audience is not decided yet');
  });

  it('asks for a memo, a deck, or both', () => {
    const memo = buildBriefingPack(params({ output: 'memo' })).prompt;
    const deck = buildBriefingPack(params({ output: 'deck' })).prompt;
    const both = buildBriefingPack(params({ output: 'both' })).prompt;
    expect(memo).toContain('(.docx)');
    expect(memo).not.toContain('(.pptx)');
    expect(deck).toContain('(.pptx)');
    expect(deck).not.toContain('(.docx)');
    expect(both).toContain('(.docx)');
    expect(both).toContain('(.pptx)');
  });

  it('carries guardrails, the kill criterion, claims, and assumptions', () => {
    const inputs: Inputs = {
      ...defaultInputs,
      pilotSuccessThreshold: '20% faster quotes in 8 weeks',
      killCriterion: '',
    };
    const { facts } = buildBriefingPack(params({ inputs }));
    expect(facts).toContain('- Every claim is soft.');
    expect(facts).toContain('Pilot success threshold: 20% faster quotes in 8 weeks');
    expect(facts).toContain('Kill criterion: Not stated');
    expect(facts).toContain('### Value claims (Expected scenario)');
    expect(facts).toContain(defaultAssumptions[0].name);
  });

  it('warns the assistant off an empty case', () => {
    const empty = Object.fromEntries(
      Object.entries(defaultInputs).map(([k, v]) => [k, typeof v === 'number' ? 0 : v]),
    ) as unknown as Inputs;
    const { facts } = buildBriefingPack(params({ inputs: { ...empty, horizonYears: 3 } }));
    expect(facts).toContain('The case has no benefits or costs yet');
  });

  it('keeps user text from breaking tables', () => {
    expect(mdCell('a | b\nc')).toBe('a \\| b c');
    expect(mdCell('   ')).toBe('Not stated');
    const { facts } = buildBriefingPack(
      params({ assumptions: [{ ...defaultAssumptions[0], name: 'Rate | Finance\n# heading' }] }),
    );
    expect(facts).toContain('| Rate \\| Finance # heading |');
  });
});

describe('briefing pack sensitivity', () => {
  it('lists the inputs that move NPV most', () => {
    const { facts } = buildBriefingPack(params());
    expect(facts).toContain('### Sensitivity: the inputs that move NPV most (Expected scenario)');
    expect(facts).toMatch(/\| Input \| Input 20% lower \| NPV \| Input 20% higher \| NPV \|/);
  });
});
