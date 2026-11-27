import { Layers, PackageX } from 'lucide-react';
import { PanelTitle } from './PanelTitle';
import {
  SCOPE_QUESTIONS,
  TIER_LABELS,
  hasScope,
  moduleForSection,
  moduleStatuses,
  suggestClaims,
  type ModuleStatus,
} from '../../data/scope';
import { claimKey, getValueType, isClaimed } from '../../data/valueTypes';
import type { Inputs } from '../../types';
import type { Section } from '../fields';

type OnChange = (key: keyof Inputs, value: string | number) => void;

const AUTO = '';

/**
 * Scope panel at the top of the Profile page: what kind of application this is, which optional
 * modules apply, and which value types fit. Every choice is stored in the case.
 */
export function ScopePanel({ inputs, onChange }: { inputs: Inputs; onChange: OnChange }) {
  const modules = moduleStatuses(inputs);
  const suggestions = suggestClaims(inputs);
  const unclaimed = suggestions.filter((s) => !isClaimed(inputs, s.id));

  return (
    <article className="panel span-2 scope-panel" aria-labelledby="scope-title">
      <div className="panel-heading">
        <div>
          <PanelTitle id="scope-title" icon={Layers}>
            Scope
          </PanelTitle>
          <p>
            Describe the application. The answers mark each optional page as essential, optional, or
            not applicable, and suggest value types. Turning a page off keeps its inputs, and any
            costs it carries still count.
          </p>
        </div>
      </div>

      <div className="scope-grid">
        {SCOPE_QUESTIONS.map((q) => {
          const id = `scope-${q.key}`;
          return (
            <div className="scope-field" key={q.key}>
              <label htmlFor={id}>{q.label}</label>
              <select
                id={id}
                className="input"
                value={inputs[q.key]}
                onChange={(e) => onChange(q.key, e.target.value)}
              >
                <option value="">Not answered</option>
                {q.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <small className="field-hint">{q.hint}</small>
            </div>
          );
        })}
      </div>

      <h3 className="scope-subhead">Modules</h3>
      <div className="table-wrap">
        <table className="scope-table">
          <caption className="sr-only">Optional modules and whether they apply</caption>
          <thead>
            <tr>
              <th scope="col">Page</th>
              <th scope="col">Applies</th>
              <th scope="col">Why</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr key={m.id}>
                <th scope="row">{m.label}</th>
                <td>
                  <select
                    className="cell-input tier-select"
                    aria-label={`${m.label}: applies`}
                    value={m.overridden ? m.tier : AUTO}
                    onChange={(e) => onChange(m.key, e.target.value)}
                  >
                    <option value={AUTO}>
                      Recommended: {TIER_LABELS[m.recommended.tier].toLowerCase()}
                    </option>
                    <option value="essential">{TIER_LABELS.essential}</option>
                    <option value="optional">{TIER_LABELS.optional}</option>
                    <option value="off">{TIER_LABELS.off}</option>
                  </select>
                </td>
                <td>
                  <TierBadge tier={m.tier} /> {m.overridden ? 'Set by you. ' : ''}
                  {m.recommended.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="scope-subhead">Value types that fit this application</h3>
      {suggestions.length === 0 ? (
        <p className="body-copy">
          Answer the application type, users, and data questions to get suggestions.
        </p>
      ) : (
        <>
          <ul className="scope-suggestions">
            {suggestions.map((s) => {
              const claimed = isClaimed(inputs, s.id);
              const label = getValueType(s.id).label;
              return (
                <li key={s.id}>
                  <div>
                    <strong>{label}</strong>
                    <span>{s.reason}</span>
                  </div>
                  <button
                    type="button"
                    className="chip-button"
                    disabled={claimed}
                    aria-label={claimed ? `${label} is claimed` : `Claim ${label}`}
                    onClick={() => onChange(claimKey(s.id), 1)}
                  >
                    {claimed ? 'Claimed' : 'Claim'}
                  </button>
                </li>
              );
            })}
          </ul>
          {unclaimed.length > 1 && (
            <button
              type="button"
              className="secondary"
              onClick={() => unclaimed.forEach((s) => onChange(claimKey(s.id), 1))}
            >
              Claim all {unclaimed.length} suggested
            </button>
          )}
          <p className="body-copy">
            Claiming turns a value type on in Benefits; enter its figures there. Unclaimed types
            count for nothing.
          </p>
        </>
      )}
    </article>
  );
}

export function TierBadge({ tier }: { tier: ModuleStatus['tier'] }) {
  return <span className={`tier-badge tier-${tier}`}>{TIER_LABELS[tier]}</span>;
}

/** Notice at the top of an optional page: whether it applies, and a way to turn it back on. */
export function ModuleNotice({
  inputs,
  section,
  onChange,
  onOpenScope,
}: {
  inputs: Inputs;
  section: Section;
  onChange: OnChange;
  onOpenScope: () => void;
}) {
  const m = moduleForSection(inputs, section);
  if (!m || (!hasScope(inputs) && !m.overridden)) return null;
  if (m.tier !== 'off')
    return (
      <p className="module-note no-print">
        <TierBadge tier={m.tier} /> {m.overridden ? 'Set by you.' : m.recommended.reason}{' '}
        <button type="button" className="link-button" onClick={onOpenScope}>
          Change scope
        </button>
      </p>
    );
  return (
    <div className="module-off no-print" role="note">
      <PackageX size={20} aria-hidden="true" />
      <div>
        <strong>Not applicable for this scope.</strong>{' '}
        {m.overridden ? 'You turned this page off.' : m.recommended.reason} The inputs below are
        kept
        {m.carriesCosts ? ', and any costs entered here still count in TCO' : ''}, but the guide
        skips this page and Reports leave it out.
      </div>
      <button type="button" className="secondary" onClick={() => onChange(m.key, 'optional')}>
        Turn on
      </button>
    </div>
  );
}

/** Report section that states the scope and what is left out, so reviewers see the gaps. */
export function ScopeReport({ inputs }: { inputs: Inputs }) {
  if (!hasScope(inputs) && !moduleStatuses(inputs).some((m) => m.overridden)) return null;
  const answered = SCOPE_QUESTIONS.filter((q) => inputs[q.key] !== '');
  const modules = moduleStatuses(inputs);
  const off = modules.filter((m) => m.tier === 'off');
  const missedSuggestions = suggestClaims(inputs).filter((s) => !isClaimed(inputs, s.id));
  return (
    <article className="panel span-2" aria-label="Scope">
      <PanelTitle icon={Layers}>Scope</PanelTitle>
      <dl className="score-list compact">
        {answered.map((q) => (
          <div key={q.key}>
            <dt>{q.label}</dt>
            <dd>{q.options.find((o) => o.value === inputs[q.key])?.label}</dd>
          </div>
        ))}
        {modules.map((m) => (
          <div key={m.id}>
            <dt>{m.label}</dt>
            <dd>
              <TierBadge tier={m.tier} />
            </dd>
          </div>
        ))}
      </dl>
      {off.length > 0 && (
        <p className="body-copy">
          <strong>Left out:</strong>{' '}
          {off
            .map((m) => `${m.label} (${m.overridden ? 'set by the author' : m.recommended.reason})`)
            .join('; ')}
          .
        </p>
      )}
      {missedSuggestions.length > 0 && (
        <p className="body-copy">
          <strong>Value types that fit but are not claimed:</strong>{' '}
          {missedSuggestions.map((s) => getValueType(s.id).label).join(', ')}.
        </p>
      )}
    </article>
  );
}
