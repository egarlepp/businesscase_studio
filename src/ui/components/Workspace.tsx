import { useEffect, useRef } from 'react';
import { Compass, FilePlus2, FlaskConical, PencilLine, Sparkles } from 'lucide-react';
import { PanelTitle } from './PanelTitle';
import { HintTooltip } from './HintTooltip';
import type { Section } from '../fields';
import { useWorkspace } from '../../workspace/useWorkspace';

/** Icon-only switch between the sample case and the user's own case. The user's case is never touched. */
export function DemoToggle() {
  const { demoMode, enterDemo, exitDemo } = useWorkspace();
  return (
    <HintTooltip
      placement="top"
      className="sidebar-tool-anchor"
      content={
        <>
          <strong>Demo data {demoMode ? 'on' : 'off'}</strong>
          <span>
            {demoMode
              ? 'Turn off to return to your own business case.'
              : 'Turn on to explore a filled-in sample case. Your own case is kept.'}
          </span>
        </>
      }
    >
      {(describedBy) => (
        <button
          type="button"
          role="switch"
          aria-checked={demoMode}
          aria-label="Demo data"
          aria-describedby={describedBy}
          className={demoMode ? 'sidebar-tool demo-switch on' : 'sidebar-tool demo-switch'}
          onClick={demoMode ? exitDemo : enterDemo}
        >
          <FlaskConical size={17} aria-hidden="true" />
        </button>
      )}
    </HintTooltip>
  );
}

export function DemoBanner() {
  const { exitDemo } = useWorkspace();
  return (
    <div className="demo-banner" role="note">
      <FlaskConical size={18} aria-hidden="true" />
      <p>
        <strong>Demo mode.</strong> You are viewing an illustrative sample case. Edits here are not
        saved, and your own business case is kept separately.
      </p>
      <button type="button" className="secondary" onClick={exitDemo}>
        Exit demo
      </button>
    </div>
  );
}

const FIRST_STEPS: Array<{ section: Section; title: string; detail: string }> = [
  {
    section: 'Profile',
    title: 'Profile',
    detail: 'Name the initiative, then set users, hourly rates, and the evaluation horizon.',
  },
  {
    section: 'Benefits',
    title: 'Benefits',
    detail: 'Enter time saved, adoption, and any capacity, revenue, or risk effects.',
  },
  {
    section: 'TCO',
    title: 'Total cost of ownership',
    detail: 'Enter build hours, AI spend, and the monthly and annual cost to run it.',
  },
];

/** Shown on the Overview while the case has no benefits or costs. */
export function OverviewEmptyState({
  onNavigate,
  onStartGuide,
}: {
  onNavigate: (section: Section) => void;
  /** Opens the guided walkthrough. */
  onStartGuide?: () => void;
}) {
  const { enterDemo } = useWorkspace();
  return (
    <section className="panel empty-state" aria-labelledby="empty-state-title">
      <PanelTitle id="empty-state-title" icon={PencilLine}>
        Add figures to build your business case
      </PanelTitle>
      <p className="body-copy">
        No benefits or costs are entered yet, so the charts are hidden and the metrics read zero.
        Work through these pages in order; the Overview fills in as you type.
      </p>
      {onStartGuide && (
        <div className="button-row">
          <button type="button" className="primary" onClick={onStartGuide}>
            <Compass size={17} aria-hidden="true" />
            Start the guided walkthrough
          </button>
        </div>
      )}
      <ol className="empty-steps">
        {FIRST_STEPS.map((step, index) => (
          <li key={step.section}>
            <span className="empty-step-number" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <strong>{step.title}</strong>
              <span>{step.detail}</span>
            </div>
            <button type="button" className="secondary" onClick={() => onNavigate(step.section)}>
              Open {step.section}
            </button>
          </li>
        ))}
      </ol>
      <p className="body-copy">
        Want to see a finished example first?{' '}
        <button type="button" className="link-button" onClick={enterDemo}>
          Explore the demo data
        </button>
        . Your own case is kept and comes back when you turn demo data off.
      </p>
    </section>
  );
}

/** First-launch choice between an empty case and the sample. Rendered as a modal dialog. */
export function WelcomeDialog({ onStartGuide }: { onStartGuide?: () => void } = {}) {
  const { startBlank, enterDemo } = useWorkspace();
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButton.current?.focus();
  }, []);

  return (
    <div className="modal-backdrop">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-description"
        onKeyDown={(event) => {
          // Keep focus inside the dialog: there is no way to dismiss it without choosing.
          if (event.key !== 'Tab') return;
          const buttons = Array.from(event.currentTarget.querySelectorAll('button'));
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <span className="eyebrow">WELCOME</span>
        <h2 id="welcome-title">How do you want to start?</h2>
        <p id="welcome-description">
          Start with a blank case to model your own initiative, or explore a filled-in sample first.
          You can switch at any time with the Demo data button (the flask) at the bottom of the
          sidebar.
        </p>
        <div className="choice-grid">
          <button type="button" className="choice" ref={firstButton} onClick={startBlank}>
            <FilePlus2 size={22} aria-hidden="true" />
            <strong>Start blank</strong>
            <span>All figures at zero, no sample names or assumptions. Saved in this browser.</span>
          </button>
          {onStartGuide && (
            <button
              type="button"
              className="choice"
              onClick={() => {
                startBlank();
                onStartGuide();
              }}
            >
              <Compass size={22} aria-hidden="true" />
              <strong>Start with the guide</strong>
              <span>
                A blank case plus a step-by-step guide, with examples tailored to your audience.
              </span>
            </button>
          )}
          <button type="button" className="choice" onClick={enterDemo}>
            <Sparkles size={22} aria-hidden="true" />
            <strong>Explore demo data</strong>
            <span>
              A sample internal workflow app with every page filled in. Edits are not saved.
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
