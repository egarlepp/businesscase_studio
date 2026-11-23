export type ScenarioName = 'Conservative' | 'Expected' | 'Upside';
export type Confidence = 'Measured' | 'Validated' | 'Estimated' | 'Proxy' | 'Speculative';

export interface Inputs {
  applicationName: string;
  sponsor: string;
  department: string;
  lifecycleStage: string;
  currency: string;
  horizonYears: number;
  discountRate: number;
  benefitsGrowthRate: number;
  costGrowthRate: number;
  users: number;
  managers: number;
  loadedHourlyRate: number;
  managerHourlyRate: number;
  workWeeks: number;
  annualProductiveHours: number;
  adoptionRate: number;
  realizationRate: number;
  minutesSavedPerUserWeek: number;
  managerHoursSavedMonth: number;
  reconciliationHoursSavedMonth: number;
  analystHourlyRate: number;
  capacityHoursRecoveredYear: number;
  capacityRealizationRate: number;
  contractorHoursAvoided: number;
  contractorHourlyRate: number;
  deferredHires: number;
  monthsDeferred: number;
  monthlyLoadedFteCost: number;
  influencedPipeline: number;
  incrementalWinRate: number;
  grossMargin: number;
  contributionRate: number;
  additionalOpportunities: number;
  averageDealValue: number;
  opportunityWinRate: number;
  riskExposure: number;
  riskProbability: number;
  riskReduction: number;
  initialLaborHours: number;
  initialLaborRate: number;
  discoveryHours: number;
  architectureHours: number;
  testingHours: number;
  securityReviewHours: number;
  documentationHours: number;
  trainingHours: number;
  aiInputTokens: number;
  aiOutputTokens: number;
  aiCachedTokens: number;
  aiInputRatePerMillion: number;
  aiOutputRatePerMillion: number;
  aiCachedRatePerMillion: number;
  aiSubscriptions: number;
  aiPromptingHours: number;
  aiReviewHours: number;
  aiDebuggingHours: number;
  aiSecurityRemediationHours: number;
  traditionalBuildHours: number;
  traditionalBuildRate: number;
  monthsAccelerated: number;
  otherInitialCost: number;
  monthlyHosting: number;
  monthlyDatabase: number;
  monthlyMonitoring: number;
  monthlyAiRuntime: number;
  monthlySupportHours: number;
  supportHourlyRate: number;
  annualMaintenance: number;
  annualEnhancements: number;
  annualGovernance: number;
  annualSecurity: number;
  annualTraining: number;
  technicalDebtReserveRate: number;
  architectureScore: number;
  testingScore: number;
  documentationScore: number;
  securityScore: number;
  dependencyScore: number;
  deploymentScore: number;
  observabilityScore: number;
  ownershipScore: number;
  integrationScore: number;
  portabilityScore: number;
  actualAdoptionRate: number;
  actualAnnualBenefits: number;
  actualAnnualRunCost: number;
  actualInitialCost: number;
  monthsSinceLaunch: number;
  // Build versus buy: the commercial alternative
  buySubscriptionPerUserMonth: number;
  buyLicensedUsers: number;
  buyAnnualPlatformFee: number;
  buyAnnualAdministration: number;
  buyImplementationCost: number;
  buyIntegrationCost: number;
  buyTrainingCost: number;
  buyPriceGrowthRate: number;
  /** Share of the modeled benefits the commercial product would deliver (0–1). */
  buyBenefitFit: number;
  // Non-financial checklist: 1 favors build, 0 neutral, -1 favors buy
  bvbFunctionalFit: number;
  bvbExtensibility: number;
  bvbDataOwnership: number;
  bvbVendorLockIn: number;
  bvbExitCost: number;
  bvbSecurity: number;
}

export interface AnnualBreakdown {
  year: number;
  /** Total benefits recognized in the year, including one-time benefits. */
  benefits: number;
  /** Portion of `benefits` that is one-time (e.g. deferred hiring), not subject to growth. */
  oneTimeBenefits: number;
  costs: number;
  net: number;
  discountedNet: number;
  cumulativeNet: number;
}

export interface BenefitBreakdown {
  productivity: number;
  management: number;
  reconciliation: number;
  capacity: number;
  contractorAvoidance: number;
  winRate: number;
  opportunityCoverage: number;
  riskReduction: number;
}

/** One-time benefits, totaled over the evaluation horizon. */
export interface OneTimeBenefitBreakdown {
  hiringDeferral: number;
}

export interface CostBreakdown {
  labor: number;
  aiCash: number;
  otherInitial: number;
  platform: number;
  support: number;
  maintenance: number;
  governance: number;
  technicalDebt: number;
}

export interface Results {
  /** Recurring benefits for year one; excludes one-time benefits such as deferred hiring. */
  annualBenefits: number;
  initialCost: number;
  annualRunCost: number;
  totalBenefits: number;
  totalCosts: number;
  netBenefit: number;
  roi: number;
  benefitCostRatio: number;
  paybackMonths: number | null;
  npv: number;
  equivalentFte: number;
  aiAssistedBuildCost: number;
  traditionalBuildCost: number;
  aiDevelopmentSavings: number;
  timeToMarketBenefit: number;
  technicalHealthScore: number;
  technicalRisk: 'Low' | 'Moderate' | 'High' | 'Critical';
  /** Heuristic reserve rate derived from the technical-health score (not applied automatically). */
  suggestedTechnicalDebtReserveRate: number;
  confidenceScore: number;
  /** Recurring benefits for year one. */
  benefitBreakdown: BenefitBreakdown;
  oneTimeBenefitBreakdown: OneTimeBenefitBreakdown;
  costBreakdown: CostBreakdown;
  annualBreakdown: AnnualBreakdown[];
  buildVsBuy: BuildVsBuyResults;
  warnings: string[];
}

export type BuildVsBuyRecommendation = 'build' | 'buy' | 'close' | 'not-configured';

export interface BuildVsBuyYear {
  year: number;
  buildBenefits: number;
  buildCost: number;
  buyBenefits: number;
  buyCost: number;
}

export interface BuildVsBuyResults {
  /** False when every commercial cost input is zero. */
  configured: boolean;
  buyInitialCost: number;
  /** Year-one recurring commercial cost. */
  buyAnnualCost: number;
  /** Initial plus recurring commercial cost over the horizon. */
  buyTotalCost: number;
  buyTotalBenefits: number;
  buyNpv: number;
  buyRoi: number;
  buildTotalCost: number;
  buildNpv: number;
  /** Build NPV − buy NPV; positive favors building. */
  npvAdvantageOfBuild: number;
  /** Buy TCO − build TCO; positive means buying costs more. */
  tcoDifference: number;
  recommendation: BuildVsBuyRecommendation;
  annual: BuildVsBuyYear[];
  warnings: string[];
}

export interface ActualsResults {
  adoptionVariance: number;
  annualBenefitsVariance: number;
  annualRunCostVariance: number;
  initialCostVariance: number;
  actualAnnualNet: number;
  annualNetVariance: number;
  /** Actual ÷ modeled recurring annual benefits; null when nothing is modeled. */
  benefitRealization: number | null;
  /** Actual net value accumulated since launch. */
  netToDate: number;
  /** Net to date ÷ actual initial cost; null when there is no initial cost. */
  paybackProgress: number | null;
  /** Months to recover actual initial cost at the actual run rate; null if never. */
  actualPaybackMonths: number | null;
  /** Horizon ROI using actual annual figures held flat. */
  actualRoi: number;
}

export interface AssumptionItem {
  id: string;
  name: string;
  category: string;
  owner: string;
  source: string;
  confidence: Confidence;
  status: 'Draft' | 'Reviewed' | 'Approved';
}
