import type { Inputs, Results } from '../types';
const clamp = (v:number,min=0,max=1)=>Math.min(Math.max(v,min),max);
const positive = (v:number)=>Math.max(v,0);

export function calculateBusinessCase(raw: Inputs): Results {
  const adoption=clamp(raw.adoptionRate), realization=clamp(raw.realizationRate), capRealization=clamp(raw.capacityRealizationRate);
  const grossMargin=clamp(raw.grossMargin), contribution=clamp(raw.contributionRate), years=Math.max(1,Math.round(raw.horizonYears));
  const productivity=raw.users*(raw.minutesSavedPerUserWeek/60)*raw.loadedHourlyRate*raw.workWeeks*adoption*realization;
  const management=raw.managers*raw.managerHoursSavedMonth*12*raw.managerHourlyRate*adoption*realization;
  const reconciliation=raw.reconciliationHoursSavedMonth*12*raw.analystHourlyRate*adoption*realization;
  const capacity=raw.capacityHoursRecoveredYear*raw.loadedHourlyRate*capRealization*adoption;
  const contractorAvoidance=raw.contractorHoursAvoided*raw.contractorHourlyRate*adoption;
  const hiringDeferral=raw.deferredHires*raw.monthsDeferred*raw.monthlyLoadedFteCost*adoption;
  const winRate=raw.influencedPipeline*positive(raw.incrementalWinRate)*grossMargin*contribution*adoption;
  const opportunityCoverage=raw.additionalOpportunities*raw.averageDealValue*clamp(raw.opportunityWinRate)*grossMargin*contribution*adoption;
  const riskReduction=raw.riskExposure*clamp(raw.riskProbability)*clamp(raw.riskReduction);
  const annualBenefits=productivity+management+reconciliation+capacity+contractorAvoidance+hiringDeferral+winRate+opportunityCoverage+riskReduction;

  const aiCash=(raw.aiInputTokens/1e6)*raw.aiInputRatePerMillion+(raw.aiOutputTokens/1e6)*raw.aiOutputRatePerMillion+(raw.aiCachedTokens/1e6)*raw.aiCachedRatePerMillion+raw.aiSubscriptions;
  const laborHours=raw.initialLaborHours+raw.discoveryHours+raw.architectureHours+raw.testingHours+raw.securityReviewHours+raw.documentationHours+raw.trainingHours+raw.aiPromptingHours+raw.aiReviewHours+raw.aiDebuggingHours+raw.aiSecurityRemediationHours;
  const labor=laborHours*raw.initialLaborRate;
  const initialCost=labor+aiCash+raw.otherInitialCost;
  const platform=(raw.monthlyHosting+raw.monthlyDatabase+raw.monthlyMonitoring+raw.monthlyAiRuntime)*12;
  const support=raw.monthlySupportHours*raw.supportHourlyRate*12;
  const maintenance=raw.annualMaintenance+raw.annualEnhancements+raw.annualTraining;
  const governance=raw.annualGovernance+raw.annualSecurity;
  const annualBaseRunCost=platform+support+maintenance+governance;
  const technicalDebt=annualBaseRunCost*positive(raw.technicalDebtReserveRate);
  const annualRunCost=annualBaseRunCost+technicalDebt;

  let cumulativeNet=-initialCost, npv=-initialCost, totalBenefits=0, recurringCosts=0;
  const annualBreakdown=Array.from({length:years},(_,i)=>{
    const year=i+1;
    const benefits=annualBenefits*Math.pow(1+raw.benefitsGrowthRate,i);
    const costs=annualRunCost*Math.pow(1+raw.costGrowthRate,i);
    totalBenefits+=benefits; recurringCosts+=costs;
    const net=benefits-costs; cumulativeNet+=net;
    const discountedNet=net/Math.pow(1+positive(raw.discountRate),year); npv+=discountedNet;
    return {year,benefits,costs,net,discountedNet,cumulativeNet};
  });
  const totalCosts=initialCost+recurringCosts, netBenefit=totalBenefits-totalCosts;
  const roi=totalCosts?netBenefit/totalCosts:0, benefitCostRatio=totalCosts?totalBenefits/totalCosts:0;
  const monthlyNet=(annualBenefits-annualRunCost)/12, paybackMonths=monthlyNet>0?initialCost/monthlyNet:null;
  const traditionalBuildCost=raw.traditionalBuildHours*raw.traditionalBuildRate;
  const aiAssistedBuildCost=labor+aiCash;
  const aiDevelopmentSavings=traditionalBuildCost-aiAssistedBuildCost;
  const timeToMarketBenefit=Math.max(raw.monthsAccelerated,0)*(annualBenefits/12);
  const scores=[raw.architectureScore,raw.testingScore,raw.documentationScore,raw.securityScore,raw.dependencyScore,raw.deploymentScore,raw.observabilityScore,raw.ownershipScore,raw.integrationScore,raw.portabilityScore];
  const technicalHealthScore=100-((scores.reduce((a,b)=>a+b,0)/scores.length-1)/4)*100;
  const technicalRisk=technicalHealthScore>=80?'Low':technicalHealthScore>=60?'Moderate':technicalHealthScore>=40?'High':'Critical';
  const confidenceScore=Math.round(55+adoption*12+realization*10+(raw.testingScore<=2?8:3)+(raw.securityScore<=2?8:3)+(raw.documentationScore<=2?7:3));
  const warnings:string[]=[];
  if(raw.adoptionRate>=1) warnings.push('Adoption is modeled at 100%; use a phased rollout assumption.');
  if(raw.contributionRate>0.25) warnings.push('Revenue contribution exceeds 25%; document causal evidence.');
  if(raw.technicalDebtReserveRate===0) warnings.push('No technical debt reserve is included.');
  if(raw.annualMaintenance===0) warnings.push('No annual maintenance cost is included.');
  if(aiCash>0 && laborHours===0) warnings.push('AI spend is included without human oversight effort.');
  if(annualBenefits<=annualRunCost) warnings.push('Annual run costs exceed or equal annual benefits; payback is not achieved.');
  if(raw.deferredHires>0 && raw.capacityHoursRecoveredYear>0) warnings.push('Check that recovered capacity and deferred hiring are not double-counted.');
  if(raw.incrementalWinRate>0.03) warnings.push('Win-rate improvement exceeds 3%; validate against historical cohorts.');
  if(technicalRisk==='High'||technicalRisk==='Critical') warnings.push('Technical-health assessment indicates elevated maintenance risk.');

  return {annualBenefits,initialCost,annualRunCost,totalBenefits,totalCosts,netBenefit,roi,benefitCostRatio,paybackMonths,npv,
    equivalentFte:raw.annualProductiveHours?raw.capacityHoursRecoveredYear/raw.annualProductiveHours:0,aiAssistedBuildCost,traditionalBuildCost,aiDevelopmentSavings,timeToMarketBenefit,technicalHealthScore,technicalRisk,confidenceScore,
    benefitBreakdown:{productivity,management,reconciliation,capacity,contractorAvoidance,hiringDeferral,winRate,opportunityCoverage,riskReduction},
    costBreakdown:{labor,aiCash,otherInitial:raw.otherInitialCost,platform,support,maintenance,governance,technicalDebt},annualBreakdown,warnings};
}
