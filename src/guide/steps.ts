import type { Inputs } from '../types';
import type { Section } from '../ui/fields';
import type { AudienceId, ValueLever } from './audiences';
import { moduleForSection, type ScopeSource } from '../data/scope';

export type Stage = 'idea' | 'built' | 'live';
export type Answer = 'yes' | 'no' | 'unsure';

/** The setup questions. They decide which steps the guide includes. */
export interface GuideAnswers {
  audience: AudienceId;
  stage: Stage;
  aiAssisted: Answer;
  buyOption: Answer;
  levers: ValueLever[];
}

export const STAGE_OPTIONS: { value: Stage; label: string; hint: string }[] = [
  { value: 'idea', label: 'Idea or proposal', hint: 'Not built yet; you are asking for funding.' },
  { value: 'built', label: 'Built or in pilot', hint: 'A working version exists; few users.' },
  { value: 'live', label: 'Live in production', hint: 'Launched; you can measure real results.' },
];

export const ANSWER_OPTIONS: { value: Answer; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
];

/** One example input: the value to show (and optionally apply) and why it is reasonable. */
export interface ExampleInput {
  key: keyof Inputs;
  value: number | string;
  why: string;
}

export interface GuideStep {
  id: string;
  section: Section;
  title: string;
  /** What this step does to the business case. */
  purpose: string;
  /** Example inputs. The first few are the most important. */
  examples: ExampleInput[];
  /** Questions to answer, or people to ask, before entering numbers. */
  ask: string[];
  /** Whether the step applies, given the setup answers. Omitted means always. */
  when?: (a: GuideAnswers) => boolean;
}

const has = (lever: ValueLever) => (a: GuideAnswers) => a.levers.includes(lever);

/**
 * The walkthrough, in the order a business case is normally built.
 * Example figures describe one illustrative case: an internal workflow tool for 80 users.
 */
export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'profile-basics',
    section: 'Profile',
    title: 'Name the initiative and set the financial frame',
    purpose:
      'Names the case and sets the horizon and discount rate. Every NPV, ROI, and payback figure uses these.',
    examples: [
      {
        key: 'applicationName',
        value: 'Quote Approval Portal',
        why: 'Use the name reviewers know.',
      },
      { key: 'sponsor', value: 'VP Sales Operations', why: 'The person who owns the outcome.' },
      { key: 'horizonYears', value: 3, why: 'Three years is standard for internal software.' },
      {
        key: 'discountRate',
        value: 0.08,
        why: 'Use the hurdle rate or WACC that Finance gives you.',
      },
    ],
    ask: [
      'What discount rate does Finance use for internal projects?',
      'Over how many years will reviewers judge the investment?',
    ],
  },
  {
    id: 'profile-scope',
    section: 'Profile',
    title: 'Describe who uses it and what their time costs',
    purpose:
      'Sets user counts and loaded hourly rates. Every time-saving benefit multiplies against these.',
    examples: [
      {
        key: 'users',
        value: 80,
        why: 'People who will use the tool, not everyone in the department.',
      },
      { key: 'managers', value: 8, why: 'Managers whose review or approval time changes.' },
      {
        key: 'loadedHourlyRate',
        value: 85,
        why: 'Salary plus benefits and overhead, divided by paid hours. Ask HR or Finance.',
      },
      { key: 'workWeeks', value: 48, why: '52 weeks minus holidays and leave.' },
    ],
    ask: ['How many people will use it in year one?', 'What loaded rate does Finance accept?'],
  },
  {
    id: 'benefits-claims',
    section: 'Benefits',
    title: 'Choose the value you will claim',
    purpose:
      'Switch on only the value types you will defend. Tag each as hard (cash), semi-hard (an avoided budget line), or soft (productivity or experience), and name the system its baseline comes from.',
    examples: [],
    ask: [
      'Which one claim would survive a finance-minded reviewer? Lead with it.',
      'Where does each baseline come from: CRM, finance, or ticketing?',
      'Are any two claims counting the same hours or the same dollars?',
    ],
  },
  {
    id: 'benefits-productivity',
    section: 'Benefits',
    title: 'Estimate time saved',
    purpose:
      'Turns minutes saved into money, discounted by adoption and by a realization factor for time that is not redeployed.',
    examples: [
      {
        key: 'minutesSavedPerUserWeek',
        value: 35,
        why: 'Time a step-by-step task study shows; start small.',
      },
      { key: 'adoptionRate', value: 0.75, why: 'Share of target users who will actually use it.' },
      {
        key: 'realizationRate',
        value: 0.7,
        why: 'Share of saved time that turns into useful work. 50–70% is defensible.',
      },
      { key: 'managerHoursSavedMonth', value: 5, why: 'Per manager, e.g. fewer status meetings.' },
    ],
    ask: [
      'Have you timed the task before and after, even for a few users?',
      'What will people do with the time they get back?',
    ],
    when: has('productivity'),
  },
  {
    id: 'benefits-capacity',
    section: 'Benefits',
    title: 'Capture capacity and headcount effects',
    purpose:
      'Values contractor hours avoided and hires deferred. Contractor avoidance is cash; deferred hiring is counted once.',
    examples: [
      {
        key: 'contractorHoursAvoided',
        value: 120,
        why: 'Per year, from current contractor invoices.',
      },
      { key: 'contractorHourlyRate', value: 165, why: 'The rate on the contract.' },
      { key: 'deferredHires', value: 0.5, why: 'Fractions are fine: half an FTE.' },
      { key: 'monthsDeferred', value: 6, why: 'How long each hire is pushed out.' },
    ],
    ask: [
      'Is there an open requisition this would delay or cancel?',
      'Which contractor spend stops, and does Finance agree?',
    ],
    when: has('capacity'),
  },
  {
    id: 'benefits-revenue',
    section: 'Benefits',
    title: 'Estimate revenue influence',
    purpose:
      'Credits a conservative share of pipeline uplift, after gross margin and the tool’s contribution.',
    examples: [
      {
        key: 'influencedPipeline',
        value: 4_000_000,
        why: 'Annual pipeline that passes through the tool.',
      },
      {
        key: 'incrementalWinRate',
        value: 0.005,
        why: 'Half a point of win rate. Small lifts are believable.',
      },
      { key: 'grossMargin', value: 0.8, why: 'Revenue counts at margin, not at list.' },
      {
        key: 'contributionRate',
        value: 0.15,
        why: 'Share of the uplift this tool earns, not CRM or the reps.',
      },
    ],
    ask: [
      'What annual pipeline value flows through this process?',
      'Do you have pilot data on win rate or cycle time?',
    ],
    when: has('revenue'),
  },
  {
    id: 'benefits-risk',
    section: 'Benefits',
    title: 'Quantify risk reduction',
    purpose: 'Values avoided losses as exposure × probability × the reduction this tool delivers.',
    examples: [
      { key: 'riskExposure', value: 150_000, why: 'Cost of one incident: fine, rework, or loss.' },
      { key: 'riskProbability', value: 0.2, why: 'Chance it happens in a year without the tool.' },
      { key: 'riskReduction', value: 0.25, why: 'How much the tool lowers that risk.' },
    ],
    ask: ['Has Risk or Audit sized this exposure before?', 'What control does the tool add?'],
    when: has('risk'),
  },
  {
    id: 'benefits-cost-reduction',
    section: 'Benefits',
    title: 'Claim hard cost reduction',
    purpose:
      'Spend that stops: licenses retired, tools consolidated, contractors released. It counts only from the month each contract ends.',
    examples: [
      {
        key: 'costRetiredSpend',
        value: 24_000,
        why: 'Annual cost of the tools and contracts this replaces.',
      },
      {
        key: 'costMonthsToExit',
        value: 4,
        why: 'Months until the renewal date. Nothing counts before it.',
      },
      {
        key: 'baselineCostReduction',
        value: 'Software ledger and contract register',
        why: 'Finance will ask for the contract end date.',
      },
    ],
    ask: [
      'Which contracts are actually cancelled, and when do they end?',
      'Does procurement agree the spend stops rather than moves?',
    ],
    when: has('costReduction'),
  },
  {
    id: 'benefits-retention',
    section: 'Benefits',
    title: 'Estimate retention and expansion',
    purpose:
      'Credits a share of improved net revenue retention, at gross margin. Retention has many drivers, so the attribution share matters most.',
    examples: [
      { key: 'retentionArr', value: 2_000_000, why: 'ARR of the customers the tool touches.' },
      { key: 'retentionLift', value: 0.01, why: 'One point of net retention is a real gain.' },
      {
        key: 'retentionAttribution',
        value: 0.15,
        why: 'Share earned by this tool, not by CS, product, or pricing.',
      },
    ],
    ask: ['What is net revenue retention today, from the CRM or billing system?'],
    when: has('retention'),
  },
  {
    id: 'benefits-cycle-time',
    section: 'Benefits',
    title: 'Value cycle-time compression',
    purpose:
      'Deals that close sooner were going to close anyway, so the gain is timing: margin on the revenue, priced at the discount rate for the days saved.',
    examples: [
      {
        key: 'cycleTimeRevenue',
        value: 3_000_000,
        why: 'Annual closed revenue that passes through the process.',
      },
      { key: 'cycleTimeDaysSaved', value: 10, why: 'Median days saved, from CRM stage history.' },
    ],
    ask: ['What is the median sales cycle today, and where does it stall?'],
    when: has('cycleTime'),
  },
  {
    id: 'benefits-cash',
    section: 'Benefits',
    title: 'Value cash acceleration',
    purpose:
      'Faster billing and collection release working capital once. The recurring benefit is the financing cost of that balance.',
    examples: [
      { key: 'cashAnnualBilled', value: 6_000_000, why: 'Annual billed revenue affected.' },
      { key: 'cashDaysFaster', value: 5, why: 'Days off DSO or billing lag.' },
    ],
    ask: ['What is DSO today, and which step of quote-to-cash does the tool shorten?'],
    when: has('cashAcceleration'),
  },
  {
    id: 'benefits-quality',
    section: 'Benefits',
    title: 'Value quality and rework',
    purpose:
      'Rework hours and the direct cost of errors or escalations avoided. Needs a measured baseline.',
    examples: [
      { key: 'reworkHoursMonth', value: 40, why: 'Hours a month spent fixing errors today.' },
      { key: 'errorsAvoidedYear', value: 24, why: 'Escalations or credits avoided per year.' },
      { key: 'costPerError', value: 1_500, why: 'Credit, refund, or handling cost of one error.' },
    ],
    ask: ['Do you track error rate or rework today? If not, measure before claiming.'],
    when: has('quality'),
  },
  {
    id: 'benefits-compliance',
    section: 'Benefits',
    title: 'Value audit readiness',
    purpose:
      'Audit preparation effort and external fees that stop. Avoided fines belong under risk reduction.',
    examples: [
      { key: 'auditPrepHoursYear', value: 200, why: 'Evidence collection and prep hours saved.' },
      {
        key: 'auditExternalSavings',
        value: 10_000,
        why: 'Consultant or audit fees that stop.',
      },
    ],
    ask: ['How many hours did the last audit take to prepare for?'],
    when: has('compliance'),
  },
  {
    id: 'benefits-talent',
    section: 'Benefits',
    title: 'Value faster ramp and retention',
    purpose:
      'New hires productive sooner and regretted departures avoided. Finance discounts this unless attrition is already a known problem.',
    examples: [
      { key: 'rampHiresYear', value: 12, why: 'New reps or staff hired each year.' },
      { key: 'rampWeeksSaved', value: 2, why: 'Weeks sooner to full productivity.' },
      { key: 'attritionAvoidedYear', value: 1, why: 'Only if attrition is a known problem.' },
      { key: 'replacementCost', value: 40_000, why: 'Recruiting, ramp, and lost output.' },
    ],
    ask: ['How long does a new hire take to reach full productivity today?'],
    when: has('talent'),
  },
  {
    id: 'benefits-forecast',
    section: 'Benefits',
    title: 'Value forecast quality',
    purpose:
      'Prices a known cost of forecast misses, such as over-hiring or expediting, and the share the tool removes.',
    examples: [
      { key: 'forecastMissCost', value: 100_000, why: 'What last year’s misses cost.' },
      { key: 'forecastImprovement', value: 0.1, why: 'Share of that cost the tool removes.' },
    ],
    ask: ['What did the last forecast miss cost, and who measured it?'],
    when: has('forecast'),
  },
  {
    id: 'benefits-cx',
    section: 'Benefits',
    title: 'Value customer experience',
    purpose: 'Cost to serve: support contacts avoided. Churn effects belong under retention.',
    examples: [
      { key: 'cxContactsAvoidedYear', value: 2_000, why: 'Tickets or calls avoided per year.' },
      { key: 'cxCostPerContact', value: 8, why: 'Fully loaded cost of one contact.' },
    ],
    ask: ['What do contacts per customer and cost per contact look like in the ticketing system?'],
    when: has('customerExperience'),
  },
  {
    id: 'benefits-tech-debt',
    section: 'Benefits',
    title: 'Value tech debt retired',
    purpose:
      'Maintenance hours and spend on integrations and shadow IT that this replaces. This app’s own upkeep is already in TCO.',
    examples: [
      { key: 'techDebtHoursYear', value: 150, why: 'Hours a year spent on what is retired.' },
      { key: 'techDebtRetiredSpend', value: 6_000, why: 'Hosting or licenses of retired tools.' },
    ],
    ask: ['Which integrations or tools are switched off, and when?'],
    when: has('techDebt'),
  },
  {
    id: 'benefits-strategic',
    section: 'Benefits',
    title: 'State the strategic argument',
    purpose:
      'Reusable platform, data asset, or AI readiness. Reported beside the case and never added to ROI.',
    examples: [
      {
        key: 'strategicAnnualValue',
        value: 50_000,
        why: 'Illustrative only; it will not change ROI.',
      },
    ],
    ask: ['What would this make possible that is not possible today?'],
    when: has('strategic'),
  },
  {
    id: 'benefits-proof',
    section: 'Benefits',
    title: 'Set a pilot threshold and kill criterion',
    purpose:
      'With nothing built yet, every number is an estimate. A stated kill criterion earns more trust than a big headline number.',
    examples: [
      {
        key: 'pilotSuccessThreshold',
        value: 'A 10-person pilot saves at least 25 minutes per user per week over six weeks.',
        why: 'Measurable, time-boxed, and tied to the lead claim.',
      },
      {
        key: 'killCriterion',
        value: 'Stop if adoption is below 40% after 90 days.',
        why: 'The result that ends the initiative.',
      },
    ],
    ask: ['What result in the pilot would make you stop?'],
    when: (a) => a.stage !== 'live',
  },
  {
    id: 'tco-build',
    section: 'TCO',
    title: 'Count the full build effort',
    purpose:
      'Sets the initial investment. Include discovery, testing, security review, and training, not only coding.',
    examples: [
      { key: 'initialLaborHours', value: 650, why: 'Core development hours.' },
      { key: 'testingHours', value: 120, why: 'Roughly 15–25% of development.' },
      { key: 'securityReviewHours', value: 40, why: 'Even small apps need a review.' },
      { key: 'initialLaborRate', value: 95, why: 'Blended loaded rate of the build team.' },
    ],
    ask: ['Who builds it, and at what loaded rate?', 'Is there a security review gate?'],
  },
  {
    id: 'tco-run',
    section: 'TCO',
    title: 'Add the monthly run cost',
    purpose: 'Recurring platform and support cost, grown each year by the cost growth rate.',
    examples: [
      { key: 'monthlyHosting', value: 850, why: 'From the cloud bill or a pricing calculator.' },
      { key: 'monthlyAiRuntime', value: 250, why: 'Model API calls the app makes in production.' },
      { key: 'monthlySupportHours', value: 18, why: 'Tickets, fixes, and user questions.' },
      { key: 'supportHourlyRate', value: 100, why: 'Loaded rate of whoever supports it.' },
    ],
    ask: ['Where will it be hosted?', 'Who answers user questions after launch?'],
  },
  {
    id: 'tco-change',
    section: 'TCO',
    title: 'Plan for change, governance, and debt',
    purpose:
      'Annual maintenance, enhancements, governance, and a technical-debt reserve. Skipping these is the most common error.',
    examples: [
      {
        key: 'annualMaintenance',
        value: 20_000,
        why: 'Upgrades, patches, and dependency updates.',
      },
      { key: 'annualEnhancements', value: 16_000, why: 'New features users will request.' },
      { key: 'annualSecurity', value: 9_000, why: 'Scans, pen tests, and access reviews.' },
      {
        key: 'technicalDebtReserveRate',
        value: 0.15,
        why: 'Share of run cost set aside. Technical Health suggests a value.',
      },
    ],
    ask: ['Is there a budget line for enhancements after launch?'],
  },
  {
    id: 'ai-development',
    section: 'AI Development',
    title: 'Compare AI-assisted delivery with a traditional build',
    purpose:
      'Separates model spend from human oversight and compares both with a traditional estimate and earlier value.',
    examples: [
      { key: 'aiSubscriptions', value: 1_200, why: 'Coding assistant seats for the build period.' },
      { key: 'aiReviewHours', value: 120, why: 'Reviewing generated code is real work.' },
      { key: 'aiSecurityRemediationHours', value: 30, why: 'Fixing what security scans find.' },
      {
        key: 'traditionalBuildHours',
        value: 1_250,
        why: 'Estimate without AI, from a past project.',
      },
      { key: 'monthsAccelerated', value: 3, why: 'How much sooner value starts.' },
    ],
    ask: [
      'Do you have token usage from your AI provider’s console?',
      'What would a traditional team have quoted?',
    ],
    when: (a) => a.aiAssisted !== 'no',
  },
  {
    id: 'technical-health',
    section: 'Technical Health',
    title: 'Score maintainability',
    purpose:
      'Scores ten areas from 1 (strong) to 5 (critical). The score drives model confidence and suggests a debt reserve.',
    examples: [
      { key: 'testingScore', value: 3, why: 'Some tests, gaps in coverage.' },
      { key: 'ownershipScore', value: 4, why: 'One person understands the code: high risk.' },
      { key: 'securityScore', value: 2, why: 'Reviewed and scanned, minor findings.' },
    ],
    ask: ['Who besides the builder can maintain the code?', 'Is there automated testing?'],
  },
  {
    id: 'build-vs-buy',
    section: 'Build vs Buy',
    title: 'Compare with a commercial product',
    purpose:
      'Models the vendor option on the same horizon and discount rate, then records the non-financial factors.',
    examples: [
      {
        key: 'buySubscriptionPerUserMonth',
        value: 55,
        why: 'From a written quote, not the list price.',
      },
      { key: 'buyLicensedUsers', value: 88, why: 'Users plus managers who need seats.' },
      { key: 'buyImplementationCost', value: 40_000, why: 'Vendor or partner services.' },
      {
        key: 'buyBenefitFit',
        value: 0.75,
        why: 'Share of your benefits the product delivers out of the box.',
      },
    ],
    ask: ['Which vendor would you shortlist?', 'Do you have a quote, or only list pricing?'],
    when: (a) => a.buyOption !== 'no',
  },
  {
    id: 'scenarios',
    section: 'Scenarios',
    title: 'Check the range and the sensitivities',
    purpose:
      'Conservative, Expected, and Upside flex adoption, revenue, and maintenance. Sensitivity shows which input moves NPV most.',
    examples: [],
    ask: [
      'Does the case still pay back in Conservative?',
      'Is the most sensitive input backed by evidence?',
    ],
  },
  {
    id: 'assumptions',
    section: 'Assumptions',
    title: 'Record evidence and owners',
    purpose:
      'Lists each material assumption with an owner, source, and confidence. Reviewers trust a case they can trace.',
    examples: [],
    ask: ['Who will sign off on adoption, rates, and run cost?'],
  },
  {
    id: 'actuals',
    section: 'Actuals',
    title: 'Track realized results',
    purpose: 'Compares adoption, benefits, and costs after launch with the approved model.',
    examples: [
      { key: 'monthsSinceLaunch', value: 6, why: 'Time since go-live.' },
      { key: 'actualAdoptionRate', value: 0.62, why: 'From usage analytics.' },
      { key: 'actualAnnualBenefits', value: 110_000, why: 'Annualized from measured results.' },
      { key: 'actualAnnualRunCost', value: 76_000, why: 'From the cloud bill and support logs.' },
    ],
    ask: ['Where will adoption and usage data come from?'],
    when: (a) => a.stage === 'live',
  },
  {
    id: 'review',
    section: 'Overview',
    title: 'Review the result',
    purpose:
      'Shows ROI, TCO, NPV, payback, and guardrail warnings. Fix any warning before presenting.',
    examples: [],
    ask: [
      'Is there any guardrail warning left?',
      'Which number will your audience ask about first?',
    ],
  },
  {
    id: 'present',
    section: 'Reports',
    title: 'Prepare to present',
    purpose:
      'The executive summary, audience briefing, and calculation trace. Export a draft or print to PDF.',
    examples: [],
    ask: [],
  },
];

/** The steps that apply to these answers and, when given, the case's scope, in order. */
export function stepsFor(answers: GuideAnswers, scope?: ScopeSource): GuideStep[] {
  return GUIDE_STEPS.filter((s) => {
    // With the case's scope, a page that belongs to a module follows the module's tier, which
    // the user can override, instead of the setup answer that only recommends it.
    const module = scope && moduleForSection(scope, s.section);
    if (module) return module.tier !== 'off';
    return !s.when || s.when(answers);
  });
}
