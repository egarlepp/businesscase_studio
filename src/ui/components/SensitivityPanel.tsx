import { useMemo, useState } from 'react';
import { Tornado } from 'lucide-react';
import { PanelTitle } from './PanelTitle';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useChartColors } from '../../theme/theme';
import { runSensitivity, type SensitivityMetric } from '../../calculations/sensitivity';
import type { Inputs } from '../../types';
import { fieldLocation } from '../fields';
import type { Formatters } from '../format';
import { formatInputValue } from '../display';

const RANGES = [0.1, 0.2, 0.3] as const;
const MAX_ROWS = 12;

interface SensitivityPanelProps {
  inputs: Inputs;
  fmt: Formatters;
}

export function SensitivityPanel({ inputs, fmt }: SensitivityPanelProps) {
  const colors = useChartColors();
  const [metric, setMetric] = useState<SensitivityMetric>('npv');
  const [range, setRange] = useState<number>(0.2);
  const result = useMemo(() => runSensitivity(inputs, metric, range), [inputs, metric, range]);
  const rows = result.rows.slice(0, MAX_ROWS);
  const show = (v: number) => (metric === 'npv' ? fmt.money(v) : fmt.percent(v));
  const showDelta = (v: number) =>
    metric === 'npv' ? fmt.moneyCompact(v) : `${(v * 100).toFixed(0)} pts`;
  const pctLabel = `${Math.round(range * 100)}%`;
  const data = rows.map((row) => ({
    name: fieldLocation(row.key)?.label ?? row.key,
    down: row.low - result.base,
    up: row.high - result.base,
  }));

  return (
    <article className="panel span-2">
      <div className="panel-heading">
        <div>
          <PanelTitle icon={Tornado}>Sensitivity (tornado)</PanelTitle>
          <p>
            Change in {metric === 'npv' ? 'NPV' : 'ROI'} when each driver moves ±{pctLabel}, all
            else held at the selected scenario. Base: {show(result.base)}.
          </p>
        </div>
        <div className="inline-controls">
          <label>
            Metric{' '}
            <select value={metric} onChange={(e) => setMetric(e.target.value as SensitivityMetric)}>
              <option value="npv">NPV</option>
              <option value="roi">ROI</option>
            </select>
          </label>
          <label>
            Range{' '}
            <select value={range} onChange={(e) => setRange(Number(e.target.value))}>
              {RANGES.map((r) => (
                <option key={r} value={r}>
                  ±{Math.round(r * 100)}%
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="body-copy">No driver changes the result. Enter non-zero inputs first.</p>
      ) : (
        <>
          <div className="chart" style={{ height: rows.length * 30 + 70 }} aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={showDelta} />
                <YAxis type="category" dataKey="name" width={190} />
                <Tooltip formatter={(v) => showDelta(Number(v))} />
                <Legend />
                <ReferenceLine x={0} stroke={colors.reference} />
                <Bar
                  isAnimationActive={false}
                  dataKey="down"
                  name={`Driver −${pctLabel}`}
                  stackId="t"
                  fill={colors.costs}
                />
                <Bar
                  isAnimationActive={false}
                  dataKey="up"
                  name={`Driver +${pctLabel}`}
                  stackId="t"
                  fill={colors.benefits}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-wrap">
            <table>
              <caption className="sr-only">
                Sensitivity of {metric === 'npv' ? 'NPV' : 'ROI'} to ±{pctLabel} changes
              </caption>
              <thead>
                <tr>
                  <th scope="col">Driver</th>
                  <th scope="col">−{pctLabel}</th>
                  <th scope="col">+{pctLabel}</th>
                  <th scope="col">Swing</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">{fieldLocation(row.key)?.label ?? row.key}</th>
                    <td>
                      {show(row.low)}{' '}
                      <small>
                        at {formatInputValue(row.key, { ...inputs, [row.key]: row.lowInput }, fmt)}
                      </small>
                    </td>
                    <td>
                      {show(row.high)}{' '}
                      <small>
                        at {formatInputValue(row.key, { ...inputs, [row.key]: row.highInput }, fmt)}
                      </small>
                    </td>
                    <td>
                      {metric === 'npv'
                        ? fmt.money(row.swing)
                        : `${(row.swing * 100).toFixed(1)} pts`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </article>
  );
}
