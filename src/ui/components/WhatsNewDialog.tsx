import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { Release } from '../../data/changelog';

interface WhatsNewDialogProps {
  releases: readonly Release[];
  currentVersion: string;
  onClose: () => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

function formatReleaseDate(isoDate: string): string {
  const time = Date.parse(`${isoDate}T00:00:00Z`);
  return Number.isNaN(time) ? isoDate : dateFormatter.format(time);
}

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/** Modal listing release notes, newest first. Closes on Escape, backdrop click, or the close button. */
export function WhatsNewDialog({ releases, currentVersion, onClose }: WhatsNewDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => opener?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="modal-backdrop no-print"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        className="modal whats-new"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
      >
        <header className="modal-header">
          <div className="modal-title">
            <Sparkles size={18} aria-hidden="true" />
            <h2 id={titleId}>What&rsquo;s new</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="modal-close"
            aria-label="Close what's new"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="modal-body" tabIndex={0} aria-label="Release notes">
          {releases.map((release) => (
            <section
              key={release.version}
              className="release"
              aria-label={`Version ${release.version}`}
            >
              <div className="release-heading">
                <span className="version-pill static">v{release.version}</span>
                {release.version === currentVersion && (
                  <span className="release-current">Current</span>
                )}
                <time dateTime={release.date}>{formatReleaseDate(release.date)}</time>
              </div>
              <h3>{release.title}</h3>
              <ul>
                {release.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
