import { describe, expect, it } from 'vitest';
import { calculateBusinessCase } from '../calculations/engine';
import { defaultInputs } from '../data/defaults';
import { buildCashFlowCsv, csvCell, fileSlug } from './csv';

describe('csvCell', () => {
  it('quotes commas, quotes, and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line\nbreak')).toBe('"line\nbreak"');
  });

  it('neutralizes spreadsheet formula injection in text cells', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+1')).toBe("'+1");
    expect(csvCell('@SUM')).toBe("'@SUM");
  });

  it('leaves negative numbers alone and rounds to cents', () => {
    expect(csvCell(-1234.567)).toBe('-1234.57');
    expect(csvCell(Number.NaN)).toBe('');
  });
});

describe('buildCashFlowCsv', () => {
  it('has a header, a year-0 investment row, and one row per year', () => {
    const r = calculateBusinessCase(defaultInputs);
    const lines = buildCashFlowCsv(r, 'USD').trim().split('\r\n');
    expect(lines).toHaveLength(1 + 1 + defaultInputs.horizonYears);
    expect(lines[0]).toContain('Recurring benefits (USD)');
    expect(lines[1].split(',')[3]).toBe(String(Math.round(r.initialCost * 100) / 100));
    const lastCumulative = Number(lines.at(-1)!.split(',')[6]);
    expect(lastCumulative).toBeCloseTo(r.annualBreakdown.at(-1)!.cumulativeNet, 1);
  });
});

describe('fileSlug', () => {
  it('produces a safe filename stem', () => {
    expect(fileSlug('Internal Workflow App / v2!')).toBe('internal-workflow-app-v2');
    expect(fileSlug('***')).toBe('business-case');
  });
});
