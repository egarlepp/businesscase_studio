import type { Inputs } from '../types';

export interface FieldHelp {
  /** One or two sentences: what the field means and how the model uses it. */
  text: string;
  /** Web search phrase for the concept. Defaults to the field label. */
  search?: string;
}

/**
 * Plain-language help for each editable input, shown in the info tooltip beside its label.
 * Kept apart from FIELD_GROUPS so page layout and copy can change independently.
 */
export const FIELD_HELP: Partial<Record<keyof Inputs, FieldHelp>> = {
  // Profile
  applicationName: { text: 'The name the case is presented under. Used in titles and reports.' },
  sponsor: {
    text: 'The executive accountable for the investment and for realizing its benefits.',
    search: 'executive sponsor role in a business case',
  },
  department: { text: 'The business unit that owns the application and most of its users.' },
  lifecycleStage: {
    text: 'Where the application stands today, for example idea, pilot, production, or retirement.',
    search: 'application lifecycle stages',
  },
  currency: { text: 'Currency used to display every money figure. Values are not converted.' },
  horizonYears: {
    text: 'How many years of benefits and costs are counted in NPV, ROI, and TCO. Three to five years is typical.',
    search: 'business case evaluation period years',
  },
  discountRate: {
    text: 'The annual rate used to convert future cash flows to today’s value for NPV. Often the company’s cost of capital or hurdle rate.',
    search: 'discount rate NPV hurdle rate',
  },
  benefitsGrowthRate: {
    text: 'How much recurring benefits grow each year after year one, for example from wider use.',
  },
  costGrowthRate: {
    text: 'How much recurring run costs rise each year, for example from inflation or vendor price increases.',
  },
  users: { text: 'People expected to use the application regularly once it is rolled out.' },
  managers: {
    text: 'Managers whose own time the application saves, counted separately from users.',
  },
  loadedHourlyRate: {
    text: 'Fully loaded cost of one user hour: salary plus benefits, taxes, and overhead.',
    search: 'fully loaded labor cost per hour',
  },
  managerHourlyRate: {
    text: 'Fully loaded cost of one manager hour.',
    search: 'fully loaded labor cost per hour',
  },
  analystHourlyRate: {
    text: 'Fully loaded cost of one analyst hour, used to value reconciliation time saved.',
    search: 'fully loaded labor cost per hour',
  },
  workWeeks: { text: 'Working weeks per year, after holidays and leave. Usually 46 to 48.' },
  annualProductiveHours: {
    text: 'Hours one full-time employee spends on productive work in a year, used to express hours as FTEs.',
    search: 'productive hours per FTE per year',
  },

  // Benefits
  minutesSavedPerUserWeek: {
    text: 'Time each active user saves per week. Multiplied by users, hourly rate, working weeks, adoption, and realization.',
  },
  managerHoursSavedMonth: {
    text: 'Hours each manager saves per month, for example on reporting or approvals.',
  },
  reconciliationHoursSavedMonth: {
    text: 'Total analyst hours per month no longer spent reconciling or correcting data.',
    search: 'data reconciliation effort',
  },
  adoptionRate: {
    text: 'Share of target users who actually use the application. Scales every benefit, so a phased rollout below 100% is safer.',
    search: 'software adoption rate',
  },
  realizationRate: {
    text: 'Share of saved time that turns into real value instead of being absorbed. 50% to 80% is a common, defensible range.',
    search: 'benefit realization factor time savings',
  },
  capacityHoursRecoveredYear: {
    text: 'Hours per year freed up for other work, valued at the user hourly rate.',
    search: 'capacity recovered hours business case',
  },
  capacityRealizationRate: {
    text: 'Share of recovered capacity that is redeployed to useful work.',
  },
  contractorHoursAvoided: { text: 'Contractor hours per year you no longer need to buy.' },
  contractorHourlyRate: { text: 'What one contractor hour costs today.' },
  deferredHires: {
    text: 'Planned new hires you can postpone because the application absorbs the work.',
    search: 'hiring deferral cost avoidance',
  },
  monthsDeferred: {
    text: 'How long each hire is postponed. Counted once from go-live, not every year.',
  },
  monthlyLoadedFteCost: {
    text: 'Monthly fully loaded cost of one full-time employee in the deferred role.',
    search: 'fully loaded FTE cost',
  },
  influencedPipeline: {
    text: 'Annual sales pipeline the application touches, for example deals worked through it.',
    search: 'influenced pipeline sales',
  },
  incrementalWinRate: {
    text: 'Extra percentage points of win rate on that pipeline because of the application.',
    search: 'incremental win rate',
  },
  grossMargin: {
    text: 'Share of revenue left after direct costs. Revenue benefits are counted at margin, not at full revenue.',
    search: 'gross margin',
  },
  contributionRate: {
    text: 'Share of the revenue uplift you credit to this application rather than to people, pricing, or other tools. Above 25% needs evidence.',
    search: 'revenue attribution contribution rate',
  },
  additionalOpportunities: {
    text: 'New opportunities per year the application creates or uncovers.',
  },
  averageDealValue: { text: 'Average revenue of a won opportunity.', search: 'average deal size' },
  opportunityWinRate: {
    text: 'Expected win rate on those additional opportunities.',
    search: 'sales win rate',
  },
  riskExposure: {
    text: 'Financial loss if the risk occurs, for example a fine, outage, or audit finding.',
    search: 'risk exposure financial impact',
  },
  riskProbability: {
    text: 'Likelihood the risk occurs in a year.',
    search: 'annualized rate of occurrence risk',
  },
  riskReduction: {
    text: 'How much the application lowers that expected loss. Benefit is exposure × probability × reduction.',
    search: 'annualized loss expectancy risk reduction',
  },

  // Benefits: additional value types (v0.7.0)
  costRetiredSpend: {
    text: 'Annual license, tool, vendor, or contractor spend that stops because of this application. Count only contracts that are actually cancelled.',
    search: 'hard cost savings vs soft savings',
  },
  costMonthsToExit: {
    text: 'Months from go-live until those contracts end. Nothing is saved before then, so year one counts only the months after it.',
    search: 'software contract renewal cancellation notice period',
  },
  retentionArr: {
    text: 'Annual recurring revenue from the customers this application touches.',
    search: 'annual recurring revenue ARR',
  },
  retentionLift: {
    text: 'Expected improvement in net revenue retention, as a share of that ARR. One point (1%) is already a meaningful gain.',
    search: 'net revenue retention NRR',
  },
  retentionAttribution: {
    text: 'Share of the retention improvement this application earns, as opposed to customer success, product, or pricing.',
    search: 'revenue attribution business case',
  },
  cycleTimeRevenue: {
    text: 'Annual closed revenue that passes through the process this application speeds up.',
  },
  cycleTimeDaysSaved: {
    text: 'Days removed from the cycle. Only the timing value counts: margin brought forward, priced at the discount rate.',
    search: 'sales cycle length time value of money',
  },
  cashAnnualBilled: {
    text: 'Annual billed revenue whose invoicing or collection becomes faster.',
  },
  cashDaysFaster: {
    text: 'Days removed from days sales outstanding, billing lag, or quote-to-cash. The benefit is the financing cost of the working capital released.',
    search: 'days sales outstanding DSO working capital',
  },
  reworkHoursMonth: {
    text: 'Hours per month spent correcting errors today that the application removes. Measure it before claiming it.',
    search: 'cost of rework measurement',
  },
  errorsAvoidedYear: {
    text: 'Errors, escalations, or credits avoided per year, from a measured baseline.',
  },
  costPerError: {
    text: 'Direct cost of one error: credits, refunds, scrap, or handling time.',
    search: 'cost of poor quality',
  },
  auditPrepHoursYear: {
    text: 'Hours per year of audit preparation and evidence collection the application saves. Valued at the analyst rate.',
    search: 'audit readiness evidence collection effort',
  },
  auditExternalSavings: {
    text: 'Annual external audit, consultant, or evidence-tool fees that stop. Avoided fines belong under risk reduction.',
  },
  rampHiresYear: {
    text: 'New hires per year who would reach full productivity sooner with the application.',
  },
  rampWeeksSaved: {
    text: 'Weeks sooner each new hire reaches full productivity. Valued at the loaded hourly rate and realization factor.',
    search: 'employee ramp time to productivity',
  },
  attritionAvoidedYear: {
    text: 'Regretted departures avoided per year. Finance discounts this heavily unless attrition is already a known problem.',
    search: 'regretted attrition',
  },
  replacementCost: {
    text: 'Cost of replacing one departure: recruiting, onboarding, and lost output during ramp.',
    search: 'employee replacement cost',
  },
  forecastMissCost: {
    text: 'What forecast misses cost per year today, for example over-hiring, expediting, or missed targets.',
    search: 'cost of forecast error',
  },
  forecastImprovement: {
    text: 'Share of that cost the application removes through better accuracy or visibility.',
  },
  cxContactsAvoidedYear: {
    text: 'Support contacts (tickets, calls, chats) avoided per year. Claim churn effects under retention instead.',
    search: 'customer contact deflection',
  },
  cxCostPerContact: {
    text: 'Fully loaded cost of handling one support contact.',
    search: 'cost per contact customer support',
  },
  techDebtHoursYear: {
    text: 'Maintenance hours per year spent on integrations, scripts, or shadow IT that this application retires. Valued at the support rate.',
    search: 'technical debt consolidation savings',
  },
  techDebtRetiredSpend: {
    text: 'Annual hosting or license spend on the tools that are switched off. List each retired tool here or under hard cost reduction, not both.',
  },
  strategicAnnualValue: {
    text: 'A stated annual value for strategic optionality, such as a reusable platform or data asset. Reported beside the case and never added to ROI.',
    search: 'real options strategic value IT investment',
  },
  pilotSuccessThreshold: {
    text: 'The measurable result a pilot must reach for the initiative to continue, tied to the lead claim.',
    search: 'pilot success criteria',
  },
  killCriterion: {
    text: 'The result that stops the initiative. Reviewers trust a stated kill criterion more than a big headline number.',
    search: 'kill criteria project stage gate',
  },
  // TCO
  initialLaborHours: {
    text: 'Hours to build the application itself, excluding the activities listed below.',
  },
  discoveryHours: {
    text: 'Requirements, workshops, and design before building starts.',
    search: 'software discovery phase',
  },
  architectureHours: { text: 'Solution and integration design, data model, and platform setup.' },
  testingHours: { text: 'Writing and running tests, including user acceptance testing.' },
  securityReviewHours: {
    text: 'Threat modeling, code and access reviews, and penetration testing.',
  },
  documentationHours: { text: 'User guides, runbooks, and technical documentation.' },
  trainingHours: { text: 'Training users and supporting the launch.' },
  initialLaborRate: { text: 'Fully loaded hourly cost of the people building the application.' },
  otherInitialCost: {
    text: 'One-time costs that are not labor, such as licenses, hardware, or consultants.',
  },
  monthlyHosting: { text: 'Monthly compute and hosting cost.', search: 'cloud hosting cost' },
  monthlyDatabase: { text: 'Monthly database and storage cost.' },
  monthlyMonitoring: {
    text: 'Monthly cost of monitoring, logging, and alerting tools.',
    search: 'observability tooling cost',
  },
  monthlyAiRuntime: {
    text: 'Monthly AI model or API usage by the running application.',
    search: 'LLM API cost per month',
  },
  monthlySupportHours: { text: 'Hours per month spent answering users and fixing issues.' },
  supportHourlyRate: { text: 'Fully loaded hourly cost of support staff.' },
  annualMaintenance: {
    text: 'Yearly cost of bug fixes, upgrades, and keeping dependencies current.',
    search: 'software maintenance cost per year',
  },
  annualEnhancements: { text: 'Yearly budget for new features and changes users ask for.' },
  annualGovernance: {
    text: 'Yearly cost of oversight: architecture review, compliance, audits, and reporting.',
    search: 'IT governance cost',
  },
  annualSecurity: { text: 'Yearly cost of security tools, scans, and reviews.' },
  annualTraining: { text: 'Yearly cost of onboarding new users and refresher training.' },
  technicalDebtReserveRate: {
    text: 'Extra percentage added on top of annual run costs to pay down shortcuts taken during the build. Technical Health suggests a rate.',
    search: 'technical debt reserve',
  },

  // Build vs Buy
  buyImplementationCost: {
    text: 'Vendor or partner fees to configure and deploy the commercial product.',
  },
  buyIntegrationCost: {
    text: 'Connecting the product to your systems and moving existing data into it.',
    search: 'SaaS integration and data migration cost',
  },
  buyTrainingCost: {
    text: 'Training users and managing the change to the new product.',
    search: 'change management cost software rollout',
  },
  buySubscriptionPerUserMonth: {
    text: 'Subscription price per user per month, from a written quote.',
    search: 'SaaS per user per month pricing',
  },
  buyLicensedUsers: { text: 'Number of users you would license.' },
  buyAnnualPlatformFee: { text: 'Flat yearly fee charged on top of per-user pricing.' },
  buyAnnualAdministration: {
    text: 'Yearly internal cost of administering the product.',
    search: 'SaaS administration cost',
  },
  buyPriceGrowthRate: {
    text: 'Expected yearly vendor price increase at renewal.',
    search: 'SaaS renewal price increase',
  },
  buyBenefitFit: {
    text: 'Share of the build’s benefits the commercial product would also deliver. 100% means it does everything the build does.',
  },
  bvbFunctionalFit: {
    text: 'Which option better covers the required features and workflows.',
    search: 'build vs buy functional fit',
  },
  bvbExtensibility: { text: 'Which option is easier to extend and change as needs evolve.' },
  bvbDataOwnership: {
    text: 'Which option gives you more control over where data lives and how it is used.',
    search: 'SaaS data ownership',
  },
  bvbVendorLockIn: {
    text: 'Which option leaves you less dependent on a single supplier.',
    search: 'vendor lock-in',
  },
  bvbExitCost: {
    text: 'Which option is cheaper to leave or replace later.',
    search: 'software exit cost switching cost',
  },
  bvbSecurity: { text: 'Which option better meets your security and compliance requirements.' },

  // AI Development
  aiInputTokens: {
    text: 'Tokens sent to AI models during the build: prompts, code, and context.',
    search: 'LLM input tokens',
  },
  aiOutputTokens: {
    text: 'Tokens generated by AI models during the build.',
    search: 'LLM output tokens',
  },
  aiCachedTokens: {
    text: 'Input tokens served from the prompt cache, billed at a lower rate.',
    search: 'prompt caching tokens',
  },
  aiInputRatePerMillion: {
    text: 'Price per million input tokens from your provider’s price list.',
    search: 'LLM API pricing per million tokens',
  },
  aiOutputRatePerMillion: {
    text: 'Price per million output tokens.',
    search: 'LLM API pricing per million tokens',
  },
  aiCachedRatePerMillion: {
    text: 'Price per million cached input tokens.',
    search: 'prompt caching pricing',
  },
  aiSubscriptions: {
    text: 'Seat subscriptions for AI coding tools used during the build.',
    search: 'AI coding assistant subscription cost',
  },
  aiPromptingHours: { text: 'Developer hours spent writing prompts and steering the AI.' },
  aiReviewHours: {
    text: 'Hours spent reviewing AI-generated code before it is accepted.',
    search: 'reviewing AI generated code',
  },
  aiDebuggingHours: { text: 'Hours spent fixing defects in AI-generated code.' },
  aiSecurityRemediationHours: {
    text: 'Hours spent fixing security issues found in AI-generated code.',
    search: 'AI generated code security vulnerabilities',
  },
  traditionalBuildHours: {
    text: 'Hours a team would need to build the same application without AI assistance.',
  },
  traditionalBuildRate: { text: 'Fully loaded hourly rate for that traditional team.' },
  monthsAccelerated: {
    text: 'How many months earlier the application launches thanks to AI. Each month is valued at one month of recurring benefits.',
    search: 'time to market value',
  },

  // Technical Health
  architectureScore: {
    text: 'How well the design is structured and separated. 1 is strong, 5 is critical risk.',
    search: 'software architecture quality',
  },
  testingScore: {
    text: 'Coverage and reliability of automated tests. Strong or Good raises model confidence.',
    search: 'automated test coverage',
  },
  documentationScore: {
    text: 'Whether someone new could run and change the application. Strong or Good raises model confidence.',
  },
  securityScore: {
    text: 'Whether security has been validated by scans or reviews. Strong or Good raises model confidence.',
    search: 'application security testing',
  },
  dependencyScore: {
    text: 'How current and well supported third-party libraries are.',
    search: 'dependency management software supply chain',
  },
  deploymentScore: {
    text: 'How automated and repeatable releases are.',
    search: 'CI/CD deployment automation',
  },
  observabilityScore: {
    text: 'Whether logs, metrics, and alerts show how the application behaves in production.',
    search: 'observability',
  },
  ownershipScore: {
    text: 'Whether a named team owns and understands the code.',
    search: 'code ownership',
  },
  integrationScore: {
    text: 'How well integrations cope with failures and changes in connected systems.',
    search: 'integration resilience',
  },
  portabilityScore: {
    text: 'How easily you could switch AI model or provider.',
    search: 'LLM vendor portability',
  },

  // Actuals
  monthsSinceLaunch: {
    text: 'Months the application has been live. Used to total the actual net value to date.',
  },
  actualAdoptionRate: { text: 'Share of target users actually using the application today.' },
  actualAnnualBenefits: {
    text: 'Recurring benefits you can evidence today, annualized.',
    search: 'benefits realization tracking',
  },
  actualAnnualRunCost: { text: 'What running the application actually costs per year.' },
  actualInitialCost: { text: 'What the build actually cost, to compare with the estimate.' },
};

/** Google search URL for a field's concept. */
export function searchUrl(term: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(term)}`;
}
