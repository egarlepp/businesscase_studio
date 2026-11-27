import { Presentation } from 'lucide-react';
import { PanelTitle } from './PanelTitle';
import { getFormula } from '../../calculations/formulas';
import type { Audience } from '../../guide/audiences';
import type { Results, ScenarioName } from '../../types';
import { formatFormulaValue } from '../display';
import type { Formatters } from '../format';

interface AudienceBriefingProps {
  audience: Audience;
  scenario: ScenarioName;
  results: Results;
  fmt: Formatters;
  onChangeAudience: () => void;
}

/** Report card that tailors the presentation to the chosen pitch audience. */
export function AudienceBriefing({
  audience,
  scenario,
  results,
  fmt,
  onChangeAudience,
}: AudienceBriefingProps) {
  return (
    <article className="panel span-2 briefing" aria-label="Audience briefing">
      <div className="panel-heading">
        <div>
          <PanelTitle icon={Presentation}>Audience briefing: {audience.title}</PanelTitle>
          <p>{audience.decision}</p>
        </div>
        <button type="button" className="secondary no-print" onClick={onChangeAudience}>
          Change audience
        </button>
      </div>
      <div className="briefing-grid">
        <section>
          <h3>Lead with these numbers</h3>
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
          <p className="body-copy">
            <strong>Lead with {audience.leadScenario}.</strong> {audience.scenarioAdvice}
            {scenario !== audience.leadScenario &&
              ` The figures above use the ${scenario} scenario.`}
          </p>
        </section>
        <section>
          <h3>Storyline</h3>
          <ol className="guide-list">
            {audience.storyline.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>
        <section className="span-2">
          <h3>Questions to expect</h3>
          <dl className="qa-list">
            {audience.questions.map((item) => (
              <div key={item.q}>
                <dt>{item.q}</dt>
                <dd>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </article>
  );
}
