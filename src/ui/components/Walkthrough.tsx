import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Compass,
  HelpCircle,
  MapPin,
  Star,
  X,
} from 'lucide-react';
import { getFormula } from '../../calculations/formulas';
import { AUDIENCES, VALUE_LEVERS, getAudience, type ValueLever } from '../../guide/audiences';
import { getValueType, isClaimed } from '../../data/valueTypes';
import { SCOPE_QUESTIONS, suggestClaims, type ScopeKey, type ScopeSource } from '../../data/scope';
import {
  ANSWER_OPTIONS,
  STAGE_OPTIONS,
  stepsFor,
  type Answer,
  type ExampleInput,
  type GuideAnswers,
} from '../../guide/steps';
import type { GuideState } from '../../guide/storage';
import type { Inputs, Results } from '../../types';
import { formatFormulaValue } from '../display';
import { fieldLocation, SCORE_LABELS, type Section } from '../fields';
import type { Formatters } from '../format';

interface WalkthroughProps {
  state: GuideState;
  onStateChange: (next: GuideState) => void;
  onClose: () => void;
  /** Opens a page of the app. */
  onNavigate: (section: Section) => void;
  inputs: Inputs;
  results: Results;
  fmt: Formatters;
  onApply: (key: keyof Inputs, value: string | number) => void;
  /** Claims the value types chosen in the setup questions (never unclaims others). */
  onClaim: (ids: ValueLever[]) => void;
  /** Model and claim guardrails currently raised; shown on the review step. */
  guardrailCount: number;
}

/** Formats a value the way its input field shows it. */
function formatInputValue(key: keyof Inputs, value: string | number, fmt: Formatters) {
  if (typeof value === 'string') return value || '—';
  switch (fieldLocation(key)?.kind) {
    case 'money':
      return value < 10 && value % 1 !== 0
        ? `${fmt.currencySymbol}${value.toFixed(2)}`
        : fmt.money(value);
    case 'percent':
      return new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(
        value,
      );
    case 'score':
      return `${value} — ${SCORE_LABELS[value] ?? ''}`;
    default:
      return fmt.number(value);
  }
}

/** Moves keyboard focus to an input and scrolls it into view, once the page has rendered. */
function focusField(key: keyof Inputs) {
  window.requestAnimationFrame(() => {
    const el = document.getElementById(`field-${key}`);
    if (!el) return;
    el.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    el.focus({ preventScroll: true });
  });
}

/**
 * A docked, non-modal guide. It drives navigation so the user can edit each page while the
 * explanation stays visible, and it can be reopened at any time from the header.
 */
export function Walkthrough({
  state,
  onStateChange,
  onClose,
  onNavigate,
  inputs,
  results,
  fmt,
  onApply,
  onClaim,
  guardrailCount,
}: WalkthroughProps) {
  const [editingAnswers, setEditingAnswers] = useState(state.answers === null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const answers = state.answers;
  const steps = answers ? stepsFor(answers, inputs) : [];
  const index = Math.max(
    0,
    steps.findIndex((s) => s.id === state.stepId),
  );
  const step = steps[index];
  const audience = answers ? getAudience(answers.audience) : null;
  const showSetup = editingAnswers || !answers;

  // Opening a step opens its page.
  const stepSection = showSetup ? null : step?.section;
  useEffect(() => {
    if (stepSection) onNavigate(stepSection);
  }, [stepSection, onNavigate]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [showSetup, step?.id]);

  const goTo = (i: number) => {
    const next = steps[Math.min(Math.max(i, 0), steps.length - 1)];
    if (next) onStateChange({ ...state, stepId: next.id });
  };

  const markDoneAndNext = () => {
    if (!step) return;
    const done = state.done.includes(step.id) ? state.done : [...state.done, step.id];
    const next = steps[index + 1];
    onStateChange({ ...state, done, stepId: next ? next.id : step.id });
    if (!next) onClose();
  };

  const doneCount = steps.filter((s) => state.done.includes(s.id)).length;

  return (
    <aside className="guide no-print" aria-label="Guided walkthrough">
      <div className="guide-top">
        <span className="guide-badge">
          <Compass size={16} /> Guided walkthrough
        </span>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Close walkthrough"
          title="Close (reopen any time with Guide)"
        >
          <X size={18} />
        </button>
      </div>

      {showSetup ? (
        <SetupForm
          initial={answers}
          inputs={inputs}
          headingRef={headingRef}
          onCancel={answers ? () => setEditingAnswers(false) : undefined}
          onSubmit={(next, scope) => {
            onClaim(next.levers);
            const scopeUpdates: Partial<Record<ScopeKey, string>> = {
              ...scope,
              scopeStage: next.stage,
              scopeAiBuild: next.aiAssisted,
              scopeBuyOption: next.buyOption,
            };
            for (const [key, value] of Object.entries(scopeUpdates) as [ScopeKey, string][])
              if (inputs[key] !== value) onApply(key, value);
            const nextSteps = stepsFor(next, { ...inputs, ...scopeUpdates });
            const keep = nextSteps.some((s) => s.id === state.stepId);
            onStateChange({
              ...state,
              answers: next,
              introDismissed: true,
              stepId: keep ? state.stepId : nextSteps[0].id,
            });
            setEditingAnswers(false);
          }}
        />
      ) : (
        step &&
        audience && (
          <div className="guide-body">
            <div className="guide-meta">
              <span>
                Step {index + 1} of {steps.length} · {step.section}
              </span>
              <button type="button" className="link-button" onClick={() => setEditingAnswers(true)}>
                Audience: {audience.title} · Change
              </button>
            </div>
            <div
              className="guide-progress"
              role="progressbar"
              aria-label="Steps done"
              aria-valuemin={0}
              aria-valuemax={steps.length}
              aria-valuenow={doneCount}
            >
              <span style={{ width: `${(doneCount / steps.length) * 100}%` }} />
            </div>

            <h2 tabIndex={-1} ref={headingRef}>
              {step.title}
            </h2>
            {audience.focusSections.includes(step.section) && (
              <p className="guide-key">
                <Star size={14} /> Key page for {audience.title}
              </p>
            )}
            <p className="guide-purpose">{step.purpose}</p>
            {audience.emphasis[step.section] && (
              <p className="guide-note">
                <strong>For {audience.title}:</strong> {audience.emphasis[step.section]}
              </p>
            )}

            {step.examples.length > 0 && (
              <section aria-label="Example inputs">
                <h3>Example inputs</h3>
                <ul className="guide-examples">
                  {step.examples.map((ex) => (
                    <ExampleRow
                      key={ex.key}
                      example={ex}
                      current={inputs[ex.key]}
                      fmt={fmt}
                      onApply={onApply}
                    />
                  ))}
                </ul>
              </section>
            )}

            {step.id === 'review' && (
              <section aria-label={`What ${audience.title} looks at`}>
                <h3>What {audience.title} looks at first</h3>
                <dl className="score-list compact">
                  {audience.headlineMetrics.map((id) => {
                    const f = getFormula(id);
                    return f ? (
                      <div key={id}>
                        <dt>{f.label}</dt>
                        <dd>{formatFormulaValue(f, results, fmt)}</dd>
                      </div>
                    ) : null;
                  })}
                </dl>
                {guardrailCount > 0 && (
                  <p className="guide-note">
                    {guardrailCount} guardrail warning
                    {guardrailCount === 1 ? '' : 's'} on this page to resolve.
                  </p>
                )}
              </section>
            )}

            {step.id === 'benefits-claims' && (
              <section aria-label={`Claims for ${audience.title}`}>
                <h3>What lands with {audience.title}</h3>
                <p className="guide-note">{audience.claimAdvice}</p>
                <ol className="guide-list">
                  {audience.recommendedClaims.map((id) => (
                    <li key={id}>
                      {getValueType(id).label}{' '}
                      <small>({isClaimed(inputs, id) ? 'claimed' : 'not claimed'})</small>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {step.id === 'scenarios' && (
              <p className="guide-note">
                <strong>Lead with {audience.leadScenario}.</strong> {audience.scenarioAdvice}
              </p>
            )}

            {step.id === 'present' && (
              <section aria-label="Storyline">
                <h3>Tell it in this order</h3>
                <ol className="guide-list">
                  {audience.storyline.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
                <p className="guide-purpose">
                  The audience briefing on this page lists the questions {audience.title} is likely
                  to ask and where the answers are.
                </p>
              </section>
            )}

            {step.ask.length > 0 && (
              <section aria-label="Questions to answer first">
                <h3>
                  <HelpCircle size={15} /> Answer before you enter numbers
                </h3>
                <ul className="guide-list">
                  {step.ask.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </section>
            )}

            <div className="guide-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button type="button" className="primary" onClick={markDoneAndNext}>
                {index === steps.length - 1 ? (
                  <>
                    <Check size={16} /> Finish
                  </>
                ) : (
                  <>
                    Done, next <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            <details className="guide-outline">
              <summary>
                All steps ({doneCount} of {steps.length} done)
              </summary>
              <ol>
                {steps.map((s, i) => {
                  const isDone = state.done.includes(s.id);
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={i === index ? 'current' : undefined}
                        aria-current={i === index ? 'step' : undefined}
                        onClick={() => goTo(i)}
                      >
                        {isDone ? (
                          <CheckCircle2 size={15} aria-label="Done" />
                        ) : i === index ? (
                          <MapPin size={15} aria-hidden="true" />
                        ) : (
                          <Circle size={15} aria-hidden="true" />
                        )}
                        <span>
                          {s.title}
                          <small>{s.section}</small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </details>
          </div>
        )
      )}
    </aside>
  );
}

function ExampleRow({
  example,
  current,
  fmt,
  onApply,
}: {
  example: ExampleInput;
  current: string | number;
  fmt: Formatters;
  onApply: (key: keyof Inputs, value: string | number) => void;
}) {
  const label = fieldLocation(example.key)?.label ?? example.key;
  const same = current === example.value;
  return (
    <li>
      <div className="guide-example-head">
        <button
          type="button"
          className="link-button"
          onClick={() => focusField(example.key)}
          title="Show this field"
        >
          {label}
        </button>
        <strong>{formatInputValue(example.key, example.value, fmt)}</strong>
      </div>
      <p>{example.why}</p>
      <div className="guide-example-foot">
        <span>Yours: {formatInputValue(example.key, current, fmt)}</span>
        <button
          type="button"
          className="chip-button"
          disabled={same}
          onClick={() => onApply(example.key, example.value)}
          aria-label={`Use example for ${label}`}
        >
          {same ? 'Using example' : 'Use example'}
        </button>
      </div>
    </li>
  );
}

/** The application questions asked here; the rest of the scope comes from questions 2, 4, 5. */
const APP_SCOPE_KEYS: ScopeKey[] = [
  'scopeAppType',
  'scopeUsers',
  'scopeData',
  'scopeAiRuntime',
  'scopeIntegrations',
];
const APP_SCOPE_QUESTIONS = SCOPE_QUESTIONS.filter((q) => APP_SCOPE_KEYS.includes(q.key));

const asStage = (v: string): GuideAnswers['stage'] | null =>
  v === 'idea' || v === 'built' || v === 'live' ? v : null;
const asAnswer = (v: string): Answer | null =>
  v === 'yes' || v === 'no' || v === 'unsure' ? v : null;

function SetupForm({
  initial,
  inputs,
  onSubmit,
  onCancel,
  headingRef,
}: {
  initial: GuideAnswers | null;
  /** The case: its scope answers pre-fill the questions. */
  inputs: ScopeSource;
  onSubmit: (answers: GuideAnswers, scope: Partial<Record<ScopeKey, string>>) => void;
  onCancel?: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const [draft, setDraft] = useState<GuideAnswers>(() => ({
    audience: 'general',
    levers: getAudience('general').defaultLevers,
    ...initial,
    // The case's own scope wins: it travels with the file and may have been edited on Profile.
    stage: asStage(inputs.scopeStage) ?? initial?.stage ?? 'idea',
    aiAssisted: asAnswer(inputs.scopeAiBuild) ?? initial?.aiAssisted ?? 'unsure',
    buyOption: asAnswer(inputs.scopeBuyOption) ?? initial?.buyOption ?? 'unsure',
  }));
  const [scope, setScope] = useState<Partial<Record<ScopeKey, string>>>(() =>
    Object.fromEntries(APP_SCOPE_KEYS.map((k) => [k, inputs[k]])),
  );
  const suggested = suggestClaims({ ...inputs, ...scope }).map((c) => c.id);
  const [leversTouched, setLeversTouched] = useState(initial !== null);

  const chooseAudience = (id: GuideAnswers['audience']) =>
    setDraft((d) => ({
      ...d,
      audience: id,
      levers: leversTouched ? d.levers : getAudience(id).defaultLevers,
    }));

  const toggleLever = (lever: ValueLever) => {
    setLeversTouched(true);
    setDraft((d) => ({
      ...d,
      levers: d.levers.includes(lever) ? d.levers.filter((l) => l !== lever) : [...d.levers, lever],
    }));
  };

  const selected = getAudience(draft.audience);
  const recommendedLevers = selected.recommendedClaims.map((id) =>
    VALUE_LEVERS.find((l) => l.id === id)!,
  );
  const otherLevers = VALUE_LEVERS.filter((l) => !selected.recommendedClaims.includes(l.id));
  const leverOption = (l: (typeof VALUE_LEVERS)[number]) => (
    <label key={l.id} className="option-row">
      <input
        type="checkbox"
        checked={draft.levers.includes(l.id)}
        onChange={() => toggleLever(l.id)}
      />
      <span>
        {l.label}
        {selected.recommendedClaims.includes(l.id) && (
          <span className="claim-badge">For {selected.title}</span>
        )}
        {suggested.includes(l.id) && <span className="claim-badge scope">Fits this app</span>}
        <small>{l.hint}</small>
      </span>
    </label>
  );

  return (
    <form
      className="guide-body"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft, scope);
      }}
    >
      <h2 tabIndex={-1} ref={headingRef}>
        Set up your walkthrough
      </h2>
      <p className="guide-purpose">
        Six questions decide which pages you need and what to emphasize. Questions 2, 4, 5 and 6 are
        the same as Scope on the Profile page, so an answer changed in one place shows in the other.
        You can change them later.
      </p>

      <fieldset>
        <legend>1. Who will you present this case to?</legend>
        <div className="audience-grid">
          {AUDIENCES.map((a) => (
            <label key={a.id} className={draft.audience === a.id ? 'option selected' : 'option'}>
              <input
                type="radio"
                name="audience"
                value={a.id}
                checked={draft.audience === a.id}
                onChange={() => chooseAudience(a.id)}
              />
              <span>{a.title}</span>
            </label>
          ))}
        </div>
        <p className="guide-note">
          <strong>{selected.title}</strong> decides: {selected.decision}
        </p>
      </fieldset>

      <fieldset>
        <legend>2. Where is the initiative today?</legend>
        {STAGE_OPTIONS.map((o) => (
          <label key={o.value} className="option-row">
            <input
              type="radio"
              name="stage"
              value={o.value}
              checked={draft.stage === o.value}
              onChange={() => setDraft((d) => ({ ...d, stage: o.value }))}
            />
            <span>
              {o.label}
              <small>{o.hint}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>3. Which kinds of value will you claim?</legend>
        <p className="guide-purpose">
          Pick one hard claim and one or two supporting claims. Marked types land with{' '}
          {selected.title}.
        </p>
        {recommendedLevers.map(leverOption)}
        <details
          className="more-levers"
          open={otherLevers.some((l) => draft.levers.includes(l.id))}
        >
          <summary>More value types ({otherLevers.length})</summary>
          {otherLevers.map(leverOption)}
        </details>
        {draft.levers.length === 0 && (
          <p className="guide-note" role="alert">
            Choose at least one; a business case needs a benefit.
          </p>
        )}
      </fieldset>

      <AnswerGroup
        legend="4. Is it built, or will it be built, with AI coding tools?"
        name="aiAssisted"
        value={draft.aiAssisted}
        onChange={(v) => setDraft((d) => ({ ...d, aiAssisted: v }))}
      />
      <AnswerGroup
        legend="5. Could you buy a commercial product instead?"
        name="buyOption"
        value={draft.buyOption}
        onChange={(v) => setDraft((d) => ({ ...d, buyOption: v }))}
      />

      <fieldset>
        <legend>6. About the application</legend>
        <p className="guide-purpose">
          These decide which pages are essential, optional, or not applicable, and which value types
          fit. Skip any you do not know yet.
        </p>
        <div className="scope-questions">
          {APP_SCOPE_QUESTIONS.map((q) => (
            <label key={q.key} className="scope-question">
              <span>{q.label}</span>
              <select
                className="input"
                value={scope[q.key] ?? ''}
                onChange={(e) => setScope((s) => ({ ...s, [q.key]: e.target.value }))}
              >
                <option value="">Not sure yet</option>
                {q.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="guide-actions">
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="primary" disabled={draft.levers.length === 0}>
          {initial ? 'Update steps' : 'Start walkthrough'} <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}

function AnswerGroup({
  legend,
  name,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  value: Answer;
  onChange: (value: Answer) => void;
}) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="segmented">
        {ANSWER_OPTIONS.map((o) => (
          <label key={o.value} className={value === o.value ? 'option selected' : 'option'}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
