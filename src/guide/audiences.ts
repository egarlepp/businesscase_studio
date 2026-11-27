import type { Section } from '../ui/fields';
import type { ScenarioName } from '../types';
import { VALUE_TYPES, type ValueTypeId } from '../data/valueTypes';

/**
 * Pitch audiences: who the business case is being presented to.
 *
 * Deliberately named "audiences", not "scenarios": the Scenarios page already means
 * Conservative / Expected / Upside modeling cases.
 */
export type AudienceId =
  'it-manager' | 'cio' | 'cfo' | 'cro' | 'coo' | 'ciso' | 'board' | 'general';

/** The kinds of value an initiative can claim. Each maps to one Benefits panel. */
export type ValueLever = ValueTypeId;

export const VALUE_LEVERS: { id: ValueLever; label: string; hint: string }[] = VALUE_TYPES.map(
  (t) => ({ id: t.id, label: t.label, hint: t.hint }),
);

export interface Audience {
  id: AudienceId;
  /** Short label shown on the picker, e.g. "CFO". */
  title: string;
  /** Who this covers. */
  who: string;
  /** The decision this person is making when they read the case. */
  decision: string;
  /** Formula ids (see calculations/formulas.ts) to lead with, most important first. */
  headlineMetrics: string[];
  /** Pages this audience will scrutinize; the guide marks them and the nav shows a dot. */
  focusSections: Section[];
  /**
   * The claims to pre-select in the guide: a lead claim plus one or two supporting claims, so the
   * default never trips the too-many-claims guardrail.
   */
  defaultLevers: ValueLever[];
  /** Value types that land with this audience, most persuasive first. Marked in the pickers. */
  recommendedClaims: ValueTypeId[];
  /** Why those claims land, in one or two sentences. */
  claimAdvice: string;
  /** The modeling scenario to lead with when presenting. */
  leadScenario: ScenarioName;
  scenarioAdvice: string;
  /** How to tell the story, in order. */
  storyline: string[];
  /** Questions to expect, with where in the app the answer lives. */
  questions: { q: string; answer: string }[];
  /** Per-page advice that replaces generic guidance for this audience. */
  emphasis: Partial<Record<Section, string>>;
}

export const AUDIENCES: Audience[] = [
  {
    id: 'it-manager',
    title: 'IT manager',
    who: 'IT or engineering manager who will own, run, and support the application.',
    decision: 'Can my team build, run, and support this without creating a maintenance burden?',
    headlineMetrics: [
      'annualRunCost',
      'technicalHealthScore',
      'aiAssistedBuildCost',
      'initialCost',
    ],
    focusSections: ['TCO', 'AI Development', 'Technical Health', 'Build vs Buy'],
    defaultLevers: ['productivity', 'techDebt'],
    recommendedClaims: ['techDebt', 'quality', 'productivity', 'costReduction'],
    claimAdvice:
      'An IT manager scores a case on what it removes from their estate: integrations, maintenance hours, and rework. Net any tech-debt claim against this application’s own upkeep.',
    leadScenario: 'Expected',
    scenarioAdvice: 'Then show that the run cost and support hours still hold in Conservative.',
    storyline: [
      'Scope: what the application does and who uses it.',
      'Build effort: AI-assisted hours versus a traditional estimate, including review and remediation.',
      'Run cost: hosting, database, monitoring, AI runtime, and support hours per month.',
      'Maintainability: the technical-health score and the debt reserve it implies.',
      'Ownership: who supports it after launch and what that costs each year.',
    ],
    questions: [
      {
        q: 'Who supports this at 2 a.m.?',
        answer: 'Code ownership score on Technical Health and monthly support hours on TCO.',
      },
      {
        q: 'What does it cost to run each month?',
        answer: 'Run platform panel on TCO; the annual run cost metric sums it.',
      },
      {
        q: 'Was the AI-generated code reviewed and secured?',
        answer: 'Human oversight hours on AI Development, security score on Technical Health.',
      },
      {
        q: 'Could we buy this instead?',
        answer: 'Build vs Buy compares a vendor quote on the same horizon.',
      },
    ],
    emphasis: {
      TCO: 'Be complete on support hours and monitoring; this audience will run it.',
      'Technical Health': 'Score honestly. An IT manager trusts a 3 with a plan more than a 1.',
      'AI Development': 'Show review, debugging, and remediation hours, not only prompting.',
    },
  },
  {
    id: 'cio',
    title: 'CIO / CTO',
    who: 'Technology executive deciding where this sits in the portfolio and architecture.',
    decision: 'Does this deserve portfolio funding, and is it sustainable architecture?',
    headlineMetrics: ['npv', 'totalCosts', 'technicalHealthScore', 'npvAdvantageOfBuild'],
    focusSections: ['TCO', 'Build vs Buy', 'Technical Health', 'AI Development', 'Scenarios'],
    defaultLevers: ['costReduction', 'techDebt', 'risk'],
    recommendedClaims: ['costReduction', 'techDebt', 'risk', 'compliance', 'strategic'],
    claimAdvice:
      'Lead with licenses and tools retired, then consolidation. Strategic optionality can close the pitch but never carries it.',
    leadScenario: 'Expected',
    scenarioAdvice:
      'Show all three scenarios side by side; a CIO wants the range, not a single number.',
    storyline: [
      'Business problem and the sponsor who owns the outcome.',
      'Total cost of ownership over the full horizon, not only the build.',
      'Build versus buy on equal terms, including lock-in and exit cost.',
      'Technical health and the debt reserve that protects the portfolio.',
      'How AI-assisted delivery changed cost and time to value.',
    ],
    questions: [
      {
        q: 'Why build rather than buy?',
        answer: 'Build vs Buy verdict, NPV gap, and the non-financial checklist.',
      },
      {
        q: 'What is the full multi-year cost?',
        answer: 'Total cost of ownership on Overview; breakdown on TCO.',
      },
      {
        q: 'Does this add to our technical debt?',
        answer: 'Technical Health score and the suggested reserve.',
      },
      {
        q: 'What happens if the AI provider changes?',
        answer: 'AI/provider portability score on Technical Health.',
      },
    ],
    emphasis: {
      'Build vs Buy': 'Use a real vendor quote. A CIO will ask where the number came from.',
      'Technical Health': 'Portability and dependency health matter most to this audience.',
    },
  },
  {
    id: 'cfo',
    title: 'CFO / Finance',
    who: 'CFO, finance business partner, or FP&A reviewing the investment.',
    decision: 'Is the return real, risk-adjusted, and better than other uses of the money?',
    headlineMetrics: ['npv', 'roi', 'paybackMonths', 'totalCosts', 'benefitCostRatio'],
    focusSections: ['Profile', 'Benefits', 'TCO', 'Scenarios', 'Assumptions', 'Actuals'],
    defaultLevers: ['costReduction', 'capacity', 'cashAcceleration'],
    recommendedClaims: [
      'costReduction',
      'cashAcceleration',
      'capacity',
      'compliance',
      'productivity',
    ],
    claimAdvice:
      'Finance underwrites cash first, then avoided budget lines. Lead with the hardest claim and expect soft claims to be discounted or deleted.',
    leadScenario: 'Conservative',
    scenarioAdvice: 'If the case works there, Expected and Upside become credibility, not hope.',
    storyline: [
      'The ask: initial investment and annual run cost.',
      'Conservative case first: NPV, payback, and ROI.',
      'Which benefits are cash and which are capacity; how realization was applied.',
      'Sensitivity: which input moves NPV most.',
      'Evidence: who owns each assumption and how actuals will be tracked.',
    ],
    questions: [
      {
        q: 'Is time saved real money, or just capacity?',
        answer:
          'Realization factor on Benefits; separate cash (contractor avoidance) from capacity.',
      },
      {
        q: 'What discount rate did you use, and why?',
        answer: 'Profile page; match the hurdle rate Finance gives you.',
      },
      {
        q: 'What has to be true for this to pay back?',
        answer: 'Sensitivity panel on Scenarios shows the inputs that move NPV most.',
      },
      {
        q: 'How will we know it worked?',
        answer: 'Actuals page compares realized results with the approved model.',
      },
    ],
    emphasis: {
      Profile: 'Ask Finance for the discount rate and loaded labor rates before you enter them.',
      Benefits: 'Keep the realization factor at or below 70% unless you have measured evidence.',
      Scenarios: 'Present Conservative first and explain the sensitivity drivers.',
      Assumptions: 'Every figure over 10% of benefits needs an owner and a source.',
    },
  },
  {
    id: 'cro',
    title: 'CRO / Sales leader',
    who: 'Chief revenue officer or sales leader whose team uses the application.',
    decision: 'Will this help my team win more, faster, and is it worth their attention?',
    headlineMetrics: ['winRate', 'opportunityCoverage', 'productivity', 'paybackMonths'],
    focusSections: ['Benefits', 'Scenarios', 'Actuals'],
    defaultLevers: ['revenue', 'cycleTime', 'talent'],
    recommendedClaims: ['cycleTime', 'talent', 'forecast', 'retention', 'revenue', 'productivity'],
    claimAdvice:
      'Beyond time saved and revenue influence, the claims that land are cycle time, ramp time for new reps, forecast accuracy, and retention or expansion. All four tie to quota coverage and attainment.',
    leadScenario: 'Expected',
    scenarioAdvice: 'Show the revenue line on its own; a CRO discounts productivity claims.',
    storyline: [
      'The selling problem: where reps lose time or deals today.',
      'Revenue influence: pipeline touched, win-rate lift, and margin.',
      'Time given back to sellers, expressed as selling hours.',
      'Adoption plan: how many reps, and how fast.',
      'What will be measured in the first two quarters.',
    ],
    questions: [
      {
        q: 'How much pipeline does this touch?',
        answer: 'Influenced pipeline on Benefits, under Revenue influence.',
      },
      {
        q: 'Why do you believe win rate goes up?',
        answer: 'Incremental win rate and application contribution; back it with a pilot.',
      },
      {
        q: 'Will reps actually use it?',
        answer: 'Adoption rate on Benefits; actual adoption on Actuals after launch.',
      },
      {
        q: 'Is this double-counting what CRM already does?',
        answer: 'Application contribution keeps only the share this tool earns.',
      },
    ],
    emphasis: {
      Benefits:
        'Fill Revenue influence first. Keep application contribution modest (10–20%) without pilot data. Add cycle time, rep ramp, forecast accuracy, or retention where you have a CRM baseline.',
      Actuals: 'Plan to report adoption and win-rate change each quarter.',
    },
  },
  {
    id: 'coo',
    title: 'COO / Operations',
    who: 'Operations or business-unit leader who owns the process being improved.',
    decision: 'Does this make the process faster and cheaper, and can my teams absorb the change?',
    headlineMetrics: ['equivalentFte', 'productivity', 'contractorAvoidance', 'paybackMonths'],
    focusSections: ['Profile', 'Benefits', 'Actuals'],
    defaultLevers: ['productivity', 'capacity', 'quality'],
    recommendedClaims: ['productivity', 'quality', 'capacity', 'cycleTime', 'customerExperience'],
    claimAdvice:
      'Operations leaders trust hours, error rates, and throughput they already track. Show capacity in FTE and claim each hour once.',
    leadScenario: 'Expected',
    scenarioAdvice: 'Show recovered capacity in FTE, not only dollars.',
    storyline: [
      'The process today: users, managers, and hours spent.',
      'Hours saved per user and per manager, and where those hours go.',
      'Capacity recovered as FTE, contractor spend avoided, hires deferred.',
      'Adoption and training plan.',
      'Operational metrics to track after launch.',
    ],
    questions: [
      {
        q: 'How many FTE does this free up?',
        answer: 'Recovered capacity (FTE) on Overview under Business-case quality.',
      },
      {
        q: 'Where does the saved time go?',
        answer: 'Capacity realization on Benefits; state what the team will do with it.',
      },
      {
        q: 'How long until my teams are trained?',
        answer: 'Training hours on TCO; adoption rate on Benefits.',
      },
    ],
    emphasis: {
      Benefits: 'Fill Productivity and Capacity carefully; these are your whole case.',
      Profile: 'Count users and managers from the actual org chart.',
    },
  },
  {
    id: 'ciso',
    title: 'CISO / Risk',
    who: 'Security, risk, or compliance leader who must approve the application.',
    decision: 'Does this reduce risk, and does building it introduce new exposure?',
    headlineMetrics: ['riskReduction', 'technicalHealthScore', 'annualRunCost', 'totalCosts'],
    focusSections: ['Benefits', 'TCO', 'Technical Health', 'AI Development', 'Assumptions'],
    defaultLevers: ['risk', 'compliance'],
    recommendedClaims: ['risk', 'compliance', 'quality'],
    claimAdvice:
      'Size avoided losses under risk and audit effort under compliance, never the same finding twice.',
    leadScenario: 'Conservative',
    scenarioAdvice: 'Risk audiences distrust optimistic cases.',
    storyline: [
      'The risk today: exposure, likelihood, and current controls.',
      'Expected risk reduction and how it is measured.',
      'Security investment: review hours, remediation, and annual security spend.',
      'Technical health: security validation, dependencies, and observability.',
      'Data handling and provider portability for AI components.',
    ],
    questions: [
      {
        q: 'What risk does this reduce, and by how much?',
        answer: 'Risk reduction panel on Benefits: exposure × probability × reduction.',
      },
      {
        q: 'Was AI-generated code security-reviewed?',
        answer: 'Security remediation hours on AI Development; security review hours on TCO.',
      },
      {
        q: 'Who monitors it in production?',
        answer: 'Observability score on Technical Health and monitoring cost on TCO.',
      },
    ],
    emphasis: {
      Benefits: 'Fill Risk reduction with a documented exposure figure, not a guess.',
      TCO: 'Include security review hours and annual security spend.',
      'Technical Health':
        'Security validation and dependency health are the scores they read first.',
    },
  },
  {
    id: 'board',
    title: 'Board / Investment committee',
    who: 'Board members or an investment committee approving material spend.',
    decision: 'Is this a sound use of capital that fits strategy, with risk understood?',
    headlineMetrics: ['npv', 'paybackMonths', 'roi', 'totalCosts'],
    focusSections: ['Overview', 'Scenarios', 'Build vs Buy', 'Reports'],
    defaultLevers: ['costReduction', 'revenue', 'risk'],
    recommendedClaims: ['costReduction', 'retention', 'revenue', 'risk', 'strategic'],
    claimAdvice:
      'Boards want one hard number and the strategic reason. Use strategic optionality as the argument on top, never as the core case.',
    leadScenario: 'Conservative',
    scenarioAdvice: 'Conservative is the floor, Expected the plan. Keep Upside as a footnote.',
    storyline: [
      'One sentence on the strategic reason.',
      'Three numbers: investment, NPV, and payback.',
      'The range across Conservative, Expected, and Upside.',
      'Why build rather than buy, in one line.',
      'Key risks and how results will be reported back.',
    ],
    questions: [
      {
        q: 'What is the downside case?',
        answer: 'Conservative row on Scenarios.',
      },
      {
        q: 'Why not buy a product?',
        answer: 'Build vs Buy verdict on the Reports page.',
      },
      {
        q: 'How will we know it delivered?',
        answer: 'Actuals page, reviewed quarterly after launch.',
      },
    ],
    emphasis: {
      Overview: 'Boards read three numbers. Make sure NPV, payback, and investment are defensible.',
      Reports: 'Print the executive summary; keep it to one page.',
    },
  },
  {
    id: 'general',
    title: 'Not sure yet',
    who: 'You have not decided who will review the case, or it is for your own planning.',
    decision: 'Is this worth doing, and what would it take?',
    headlineMetrics: ['roi', 'npv', 'paybackMonths', 'totalCosts'],
    focusSections: ['Profile', 'Benefits', 'TCO'],
    defaultLevers: ['productivity'],
    recommendedClaims: ['productivity', 'costReduction', 'quality'],
    claimAdvice: 'Start with one claim you can measure today, ideally a hard one.',
    leadScenario: 'Expected',
    scenarioAdvice: 'Revisit once you know your audience.',
    storyline: [
      'What the application does and who uses it.',
      'The main benefit and how it is calculated.',
      'Build and run cost.',
      'ROI, NPV, and payback.',
    ],
    questions: [
      {
        q: 'What is the single biggest benefit?',
        answer: 'Recurring annual benefit mix chart on Overview.',
      },
      {
        q: 'What does it cost in total?',
        answer: 'Total cost of ownership on Overview.',
      },
    ],
    emphasis: {},
  },
];

export function getAudience(id: AudienceId): Audience {
  return AUDIENCES.find((a) => a.id === id) ?? AUDIENCES[AUDIENCES.length - 1];
}

export function isAudienceId(value: unknown): value is AudienceId {
  return typeof value === 'string' && AUDIENCES.some((a) => a.id === value);
}
