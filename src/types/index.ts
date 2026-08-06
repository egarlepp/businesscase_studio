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
}

export interface AnnualBreakdown {
  year: number;
  benefits: number;
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
  hiringDeferral: number;
  winRate: number;
  opportunityCoverage: number;
  riskReduction: number;
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
  confidenceScore: number;
  benefitBreakdown: BenefitBreakdown;
  costBreakdown: CostBreakdown;
  annualBreakdown: AnnualBreakdown[];
  warnings: string[];
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
