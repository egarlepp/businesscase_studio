import {
  AlertTriangle,
  CheckCircle2,
  Columns2,
  FilePlus2,
  FileSearch,
  ChartLine,
  Scale,
} from 'lucide-react';
import { PanelTitle } from './PanelTitle';
import { useChartColors } from '../../theme/theme';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { assessEvidence } from '../../data/assumptions';
import { BUILD_VS_BUY_CATEGORY } from '../../data/defaults';
import type { AssumptionItem, Inputs, Results } from '../../types';
import { buildVsBuyHeadline, checklistTally, cumulativeNetSeries } from '../buildVsBuy';
import type { Formatters } from '../format';
import { ChartTable } from './ChartTable';
import { FormulaInfo } from './FormulaInfo';

interface BuildVsBuyPanelProps {
  inputs: Inputs;
  results: Results;
  assumptions: AssumptionItem[];
  fmt: Formatters;
  onAddEvidence: () => void;
}

export function BuildVsBuyPanel({
  inputs,
  results: r,
  assumptions,
  fmt,
  onAddEvidence,
}: BuildVsBuyPanelProps) {
  const b = r.buildVsBuy;
  const colors = useChartColors();
  const tally = checklistTally(inputs);
  const evidence = assessEvidence(assumptions, BUILD_VS_BUY_CATEGORY);

  const cumulative = cumulativeNetSeries(r);

  const rows: [string, number, number, 'money' | 'percent'][] = [
    ['One-time cost', r.initialCost, b.buyInitialCost, 'money'],
    ['Year-one recurring cost', r.annualRunCost, b.buyAnnualCost, 'money'],
    ['Total cost of ownership', r.totalCosts, b.buyTotalCost, 'money'],
    ['Total benefits', r.totalBenefits, b.buyTotalBenefits, 'money'],
    ['Net present value', r.npv, b.buyNpv, 'money'],
    ['ROI', r.roi, b.buyRoi, 'percent'],
  ];
  const show = (v: number, kind: 'money' | 'percent') =>
    kind === 'money' ? fmt.money(v) : fmt.percent(v);

  return (
    <section className="form-layout" aria-label="Build versus buy results">
      <article className={`panel span-2 verdict verdict-${b.recommendation}`}>
        <div className="verdict-head">
          <Scale size={26} />
          <div>
            <h2>{buildVsBuyHeadline(b, fmt)}</h2>
            {b.configured && (
              <p>
                Commercial TCO {fmt.money(b.buyTotalCost)} vs build {fmt.money(b.buildTotalCost)}{' '}
                over {r.annualBreakdown.length} years, crediting the product with{' '}
                {fmt.percent(Math.min(Math.max(inputs.buyBenefitFit, 0), 1))} of the benefits.
              </p>
            )}
          </div>
          {b.configured && (
            <FormulaInfo id="npvAdvantageOfBuild" inputs={inputs} results={r} fmt={fmt} />
          )}
        </div>
        <p className="tally">
          Non-financial factors: <strong>{tally.build} favor build</strong>,{' '}
          <strong>{tally.buy} favor buy</strong>, {tally.neutral} neutral.
        </p>
        {b.warnings.length > 0 && (
          <div className="warning-list">
            {b.warnings.map((w) => (
              <div className="warning" key={w}>
                <AlertTriangle size={17} />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </article>

      {b.configured && (
        <>
          <article className="panel">
            <PanelTitle icon={Columns2}>Side by side</PanelTitle>
            <div className="table-wrap">
              <table>
                <caption className="sr-only">Build versus buy comparison</caption>
                <thead>
                  <tr>
                    <th scope="col">Measure</th>
                    <th scope="col">Build</th>
                    <th scope="col">Buy</th>
                    <th scope="col">Buy − build</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, build, buy, kind]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td>{show(build, kind)}</td>
                      <td>{show(buy, kind)}</td>
                      <td>{show(buy - build, kind)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
          <article className="panel">
            <PanelTitle icon={ChartLine}>Cumulative net value</PanelTitle>
            <p className="body-copy">Benefits minus costs to date, before discounting.</p>
            <div className="chart" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulative}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={fmt.moneyCompact} width={70} />
                  <Tooltip formatter={(v) => fmt.money(Number(v))} />
                  <Legend />
                  <ReferenceLine y={0} stroke={colors.reference} />
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="build"
                    name="Build"
                    stroke={colors.net}
                    strokeWidth={2}
                  />
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="buy"
                    name="Buy"
                    stroke={colors.costs}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <ChartTable
              caption="Cumulative net value, build versus buy"
              columns={['Point', 'Build', 'Buy']}
              rows={cumulative.map((p) => [p.label, fmt.money(p.build), fmt.money(p.buy)])}
            />
          </article>
        </>
      )}

      <article className="panel span-2">
        <div className="panel-heading">
          <div>
            <PanelTitle icon={FileSearch}>Evidence for the commercial option</PanelTitle>
            <p>
              Vendor figures need a source and confidence level in the assumption register (category
              “{BUILD_VS_BUY_CATEGORY}”).
            </p>
          </div>
          <button type="button" className="secondary" onClick={onAddEvidence}>
            <FilePlus2 size={16} />
            Add vendor assumption
          </button>
        </div>
        {evidence.rows.length === 0 ? (
          <div className="warning">
            <AlertTriangle size={17} />
            <span>
              No vendor assumptions are recorded. Add the quote, its source, and confidence.
            </span>
          </div>
        ) : (
          <>
            <ul className="evidence-list">
              {evidence.rows.map((a) => (
                <li key={a.id}>
                  <strong>{a.name || 'Untitled assumption'}</strong>
                  <span>
                    {a.source || 'No source'} · {a.confidence} · {a.status}
                  </span>
                </li>
              ))}
            </ul>
            {!evidence.documented || evidence.weak.length > 0 ? (
              <div className="warning">
                <AlertTriangle size={17} />
                <span>
                  {!evidence.documented
                    ? 'At least one vendor assumption has no source.'
                    : `${evidence.weak.length === 1 ? '1 vendor assumption is' : `${evidence.weak.length} vendor assumptions are`} still Proxy/Speculative or in Draft; treat the comparison as directional.`}
                </span>
              </div>
            ) : (
              <div className="success">
                <CheckCircle2 size={17} />
                <span>Vendor assumptions are sourced and reviewed.</span>
              </div>
            )}
          </>
        )}
      </article>
    </section>
  );
}
