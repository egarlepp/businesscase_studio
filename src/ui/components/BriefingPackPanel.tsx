import { useMemo, useState } from 'react';
import { Copy, Download, WandSparkles } from 'lucide-react';
import { PanelTitle } from './PanelTitle';
import { AUDIENCES, getAudience, isAudienceId, type AudienceId } from '../../guide/audiences';
import {
  BRIEFING_OUTPUTS,
  buildBriefingPack,
  isBriefingOutput,
  type BriefingOutput,
} from '../../export/briefingPack';
import { downloadFile } from '../../export/csv';
import type { AssumptionItem, Inputs, ScenarioName } from '../../types';

interface BriefingPackPanelProps {
  caseName: string;
  /** Base inputs, before scenario multipliers. */
  inputs: Inputs;
  scenario: ScenarioName;
  assumptions: readonly AssumptionItem[];
  /** The audience chosen in the walkthrough, used as the default. */
  defaultAudience: AudienceId | null;
  guardrails: readonly string[];
  hasFigures: boolean;
  appVersion: string;
  /** Slug for the download's file name. */
  fileBase: string;
}

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Reports card that exports the case as an AI briefing pack: figures, caveats, and a prompt
 * tuned to one audience. Nothing leaves the browser; the user pastes or attaches it.
 */
export function BriefingPackPanel({
  caseName,
  inputs,
  scenario,
  assumptions,
  defaultAudience,
  guardrails,
  hasFigures,
  appVersion,
  fileBase,
}: BriefingPackPanelProps) {
  const [audienceId, setAudienceId] = useState<AudienceId>(defaultAudience ?? 'general');
  const [output, setOutput] = useState<BriefingOutput>('both');
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const pack = useMemo(
    () =>
      buildBriefingPack({
        caseName,
        inputs,
        scenario,
        assumptions,
        audience: getAudience(audienceId),
        output,
        guardrails,
        appVersion,
        date: new Date(),
      }),
    [caseName, inputs, scenario, assumptions, audienceId, output, guardrails, appVersion],
  );

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(pack.markdown);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  const download = () =>
    downloadFile(
      `${fileBase}-ai-briefing-${audienceId}.md`,
      pack.markdown,
      'text/markdown;charset=utf-8',
    );

  return (
    <article className="panel span-2 briefing-pack no-print" aria-label="AI briefing pack">
      <PanelTitle icon={WandSparkles}>AI briefing pack</PanelTitle>
      <p className="body-copy">
        Turn this case into a written memo or a slide deck with an AI assistant such as Claude. The
        pack holds every figure, the risks and guardrails, and a prompt that tells the assistant to
        quote the figures exactly, never calculate new ones, keep the caveats, and follow your
        audience&rsquo;s storyline. The app sends nothing anywhere: you paste or attach the pack
        yourself.
      </p>
      <div className="field-grid">
        <div className="field">
          <div className="field-label">
            <label htmlFor="pack-audience">Audience</label>
          </div>
          <select
            id="pack-audience"
            className="input"
            value={audienceId}
            onChange={(e) => {
              if (isAudienceId(e.target.value)) setAudienceId(e.target.value);
              setCopyState('idle');
            }}
          >
            {AUDIENCES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <div className="field-label">
            <label htmlFor="pack-output">Ask the assistant for</label>
          </div>
          <select
            id="pack-output"
            className="input"
            value={output}
            onChange={(e) => {
              if (isBriefingOutput(e.target.value)) setOutput(e.target.value);
              setCopyState('idle');
            }}
          >
            {BRIEFING_OUTPUTS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="field-hint">
        The results table covers all three scenarios. The detail tables use the {scenario} scenario
        selected in the header.
      </p>
      <div className="button-row">
        <button type="button" className="primary" onClick={copy} disabled={!hasFigures}>
          <Copy size={17} />
          Copy pack
        </button>
        <button type="button" className="secondary" onClick={download} disabled={!hasFigures}>
          <Download size={17} />
          Download pack (.md)
        </button>
      </div>
      <p className="body-copy" role="status">
        {!hasFigures
          ? 'Enter figures on the Benefits and TCO pages first.'
          : copyState === 'copied'
            ? 'Copied. Paste it into your AI assistant and send it as it is.'
            : copyState === 'failed'
              ? 'Your browser blocked the clipboard. Use Download pack and attach the file instead.'
              : 'Before you present the result, check every figure against this page.'}
      </p>
      {hasFigures && (
        <details className="pack-preview">
          <summary>Preview the pack</summary>
          <pre tabIndex={0}>{pack.markdown}</pre>
        </details>
      )}
    </article>
  );
}
