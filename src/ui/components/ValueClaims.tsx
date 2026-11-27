import { AlertTriangle, CheckCircle2, ListChecks, Sparkles } from 'lucide-react';
import { PanelTitle } from './PanelTitle';
import {
  EVIDENCE_CLASSES,
  EVIDENCE_LABELS,
  VALUE_TYPES,
  baselineKey,
  claimKey,
  evidenceKey,
  evidenceOf,
  getValueType,
  isClaimed,
  type ValueType,
} from '../../data/valueTypes';
import type { Audience } from '../../guide/audiences';
import { suggestClaims } from '../../data/scope';
import type { ClaimReview } from '../../guide/claimReview';
import type { Inputs, Results } from '../../types';
import type { Formatters } from '../format';

interface ValueClaimsProps {
  inputs: Inputs;
  results: Results;
  review: ClaimReview;
  audience: Audience | null;
  fmt: Formatters;
  onChange: (key: keyof Inputs, value: string | number) => void;
}

const EVIDENCE_SHORT = { hard: 'Hard', 'semi-hard': 'Semi-hard', soft: 'Soft' } as const;

/**
 * The value-claims picker at the top of the Benefits page: which value types this case claims,
 * how finance will classify each, and where each baseline comes from.
 */
export function ValueClaimsPanel({
  inputs,
  results,
  review,
  audience,
  fmt,
  onChange,
}: ValueClaimsProps) {
  const recommended = new Set(audience?.recommendedClaims ?? []);
  const fits = new Set(suggestClaims(inputs).map((s) => s.id));
  const valueOf = (type: ValueType) => results.claims.find((c) => c.id === type.id)?.value ?? 0;

  const row = (type: ValueType) => {
    const claimed = isClaimed(inputs, type.id);
    const id = `claim-${type.id}`;
    return (
      <li key={type.id} className={claimed ? 'claim-row claimed' : 'claim-row'}>
        <div className="claim-head">
          <input
            id={id}
            type="checkbox"
            checked={claimed}
            onChange={(e) => onChange(claimKey(type.id), e.target.checked ? 1 : 0)}
          />
          <label htmlFor={id}>
            <strong>{type.label}</strong>
            {recommended.has(type.id) && audience && (
              <span className="claim-badge">For {audience.title}</span>
            )}
            {fits.has(type.id) && <span className="claim-badge scope">Fits this app</span>}
            {!type.countsTowardRoi && <span className="claim-badge muted">Not in ROI</span>}
            <small>{type.measure}</small>
          </label>
          {claimed && (
            <span className="claim-value">
              {fmt.money(valueOf(type))}
              <small>{type.countsTowardRoi ? 'year one' : 'excluded'}</small>
            </span>
          )}
        </div>
        {claimed && (
          <div className="claim-detail">
            <div className="field">
              <label htmlFor={`evidence-${type.id}`}>Evidence class</label>
              <select
                id={`evidence-${type.id}`}
                className="input"
                value={evidenceOf(inputs, type.id)}
                disabled={!type.countsTowardRoi}
                onChange={(e) => onChange(evidenceKey(type.id), e.target.value)}
              >
                {EVIDENCE_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {EVIDENCE_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor={`baseline-${type.id}`}>Baseline source</label>
              <input
                id={`baseline-${type.id}`}
                className="input"
                maxLength={500}
                placeholder="System of record, report, or study"
                value={String(inputs[baselineKey(type.id)])}
                onChange={(e) => onChange(baselineKey(type.id), e.target.value)}
              />
            </div>
            <p className="claim-challenge">
              <strong>Who cares:</strong> {type.audience}. <strong>Challenge:</strong>{' '}
              {type.challenge}
            </p>
          </div>
        )}
      </li>
    );
  };

  // Recommended types first for the chosen audience, then catalog order.
  const ordered = [
    ...VALUE_TYPES.filter((t) => recommended.has(t.id)),
    ...VALUE_TYPES.filter((t) => !recommended.has(t.id)),
  ];
  const { hard, semiHard, soft } = results.evidenceBreakdown;

  return (
    <>
      <article className="panel span-2" aria-label="Value claims">
        <div className="panel-heading">
          <div>
            <PanelTitle icon={Sparkles}>Value claims</PanelTitle>
            <p>
              Claim only what you will defend. Lead with one hard claim and add one or two
              supporting claims. Only claimed types count, and their panels appear below.
            </p>
          </div>
        </div>
        {audience && <p className="guide-note">{audience.claimAdvice}</p>}
        <ul className="claim-list">{ordered.map(row)}</ul>
      </article>
      <article className="panel span-2" aria-label="Claim review">
        <div className="panel-heading">
          <div>
            <PanelTitle icon={ListChecks}>Claim review</PanelTitle>
            <p>
              {review.lead
                ? `Lead with ${getValueType(review.lead.id).label} (${EVIDENCE_SHORT[review.lead.evidence].toLowerCase()}).`
                : 'No claim has a value yet.'}{' '}
              {review.roiClaimCount} claim{review.roiClaimCount === 1 ? '' : 's'} count toward ROI.
            </p>
          </div>
        </div>
        <dl className="score-list evidence-split">
          <div>
            <dt>Hard (cash)</dt>
            <dd>{fmt.money(hard)}</dd>
          </div>
          <div>
            <dt>Semi-hard (budget line)</dt>
            <dd>{fmt.money(semiHard)}</dd>
          </div>
          <div>
            <dt>Soft</dt>
            <dd>{fmt.money(soft)}</dd>
          </div>
          <div>
            <dt>Evidence-backed share</dt>
            <dd>
              {results.evidenceBackedShare === null
                ? '—'
                : fmt.percent(results.evidenceBackedShare)}
            </dd>
          </div>
          <div>
            <dt>NPV without soft claims</dt>
            <dd>{fmt.money(results.evidenceBackedNpv)}</dd>
          </div>
          {results.strategicValue > 0 && (
            <div>
              <dt>Strategic optionality (not in ROI)</dt>
              <dd>{fmt.money(results.strategicValue)}</dd>
            </div>
          )}
          {results.workingCapitalReleased > 0 && (
            <div>
              <dt>Working capital released (one-time, not in ROI)</dt>
              <dd>{fmt.money(results.workingCapitalReleased)}</dd>
            </div>
          )}
        </dl>
        <div className="warning-list">
          {review.warnings.length ? (
            review.warnings.map((w) => (
              <div className="warning" key={w}>
                <AlertTriangle size={17} />
                <span>{w}</span>
              </div>
            ))
          ) : (
            <div className="success">
              <CheckCircle2 size={18} />
              <span>No claim issues found.</span>
            </div>
          )}
        </div>
      </article>
    </>
  );
}

/** Report table of the claimed value types, hardest evidence first. */
export function ClaimsReport({
  inputs,
  results,
  review,
  fmt,
}: Omit<ValueClaimsProps, 'audience' | 'onChange'>) {
  const strategic = results.claims.find((c) => !c.countsTowardRoi);
  return (
    <article className="panel span-2" aria-label="Value claims report">
      <PanelTitle icon={Sparkles}>Value claims</PanelTitle>
      {review.ranked.length === 0 ? (
        <p className="body-copy">No value type is claimed yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Claimed value types, hardest evidence first</caption>
            <thead>
              <tr>
                <th scope="col">Claim</th>
                <th scope="col">Evidence</th>
                <th scope="col">Year-one value</th>
                <th scope="col">Baseline source</th>
              </tr>
            </thead>
            <tbody>
              {review.ranked.map((c) => (
                <tr key={c.id}>
                  <th scope="row">{getValueType(c.id).label}</th>
                  <td>{EVIDENCE_SHORT[c.evidence]}</td>
                  <td>{fmt.money(c.value)}</td>
                  <td>{String(inputs[baselineKey(c.id)]).trim() || 'Not stated'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="body-copy">
        Without soft claims the case has {fmt.money(results.evidenceBackedNpv)} NPV and{' '}
        {fmt.percent(results.evidenceBackedRoi)} ROI.
        {strategic &&
          ` Strategic optionality (${fmt.money(strategic.value)} a year, stated) is an argument on top and is not counted.`}
      </p>
      {(inputs.pilotSuccessThreshold.trim() || inputs.killCriterion.trim()) && (
        <dl className="qa-list">
          {inputs.pilotSuccessThreshold.trim() && (
            <div>
              <dt>Pilot success threshold</dt>
              <dd>{inputs.pilotSuccessThreshold}</dd>
            </div>
          )}
          {inputs.killCriterion.trim() && (
            <div>
              <dt>Kill criterion</dt>
              <dd>{inputs.killCriterion}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
}
