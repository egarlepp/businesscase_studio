import { describe, expect, it } from 'vitest';
import { calculateBusinessCase } from './engine';
import { defaultInputs } from '../data/defaults';

describe('calculateBusinessCase',()=>{
 it('calculates full business case',()=>{const r=calculateBusinessCase(defaultInputs);expect(r.totalBenefits).toBeGreaterThan(0);expect(r.totalCosts).toBeGreaterThan(0);expect(r.annualBreakdown).toHaveLength(3);expect(r.benefitBreakdown.productivity).toBeGreaterThan(0);expect(r.costBreakdown.aiCash).toBeGreaterThan(0)});
 it('returns no payback when value is removed',()=>{const r=calculateBusinessCase({...defaultInputs,users:0,managers:0,reconciliationHoursSavedMonth:0,capacityHoursRecoveredYear:0,contractorHoursAvoided:0,deferredHires:0,influencedPipeline:0,additionalOpportunities:0,riskExposure:0});expect(r.paybackMonths).toBeNull()});
 it('calculates AI comparison',()=>{const r=calculateBusinessCase(defaultInputs);expect(r.aiAssistedBuildCost).toBeGreaterThan(0);expect(r.traditionalBuildCost).toBe(defaultInputs.traditionalBuildHours*defaultInputs.traditionalBuildRate)});
 it('flags double counting',()=>{const r=calculateBusinessCase(defaultInputs);expect(r.warnings.some(x=>x.includes('double-counted'))).toBe(true)});
 it('scores technical health',()=>{const r=calculateBusinessCase({...defaultInputs,architectureScore:1,testingScore:1,documentationScore:1,securityScore:1,dependencyScore:1,deploymentScore:1,observabilityScore:1,ownershipScore:1,integrationScore:1,portabilityScore:1});expect(r.technicalHealthScore).toBe(100);expect(r.technicalRisk).toBe('Low')});
});
