import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { MAX_CASE_NAME_LENGTH, normalizeCaseName } from '../../persistence/draft';

export interface CaseTitleProps {
  /** The business case's own name; empty when it has not been named. */
  caseName: string;
  /** The initiative named on the Profile page, shown when the case has no name of its own. */
  applicationName: string;
  /** Heading for a case with neither name. */
  untitled: string;
  onRename: (name: string) => void;
}

/** The page heading: the business case name, with an inline control to rename it. */
export function CaseTitle({ caseName, applicationName, untitled, onRename }: CaseTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputId = useId();
  const renameButton = useRef<HTMLButtonElement>(null);
  const shown = caseName.trim() || applicationName.trim() || untitled;
  const application = applicationName.trim();
  const showApplication = caseName.trim() !== '' && application !== '' && application !== shown;

  const startEditing = () => {
    setDraft(caseName.trim() || applicationName.trim());
    setEditing(true);
  };
  const finish = (save: boolean) => {
    if (save) onRename(normalizeCaseName(draft));
    setEditing(false);
    // Return focus to the control that opened the editor once it is rendered again.
    requestAnimationFrame(() => renameButton.current?.focus());
  };
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    finish(true);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      finish(false);
    }
  };

  if (editing) {
    return (
      <form className="case-title editing" onSubmit={onSubmit}>
        <label htmlFor={inputId} className="sr-only">
          Business case name
        </label>
        <input
          id={inputId}
          className="case-title-input"
          value={draft}
          maxLength={MAX_CASE_NAME_LENGTH}
          placeholder="Name this business case"
          // The user just asked to rename, so moving focus into the field is expected.
          autoFocus
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className="icon-button" aria-label="Save name" title="Save name">
          <Check size={18} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Cancel renaming"
          title="Cancel"
          onClick={() => finish(false)}
        >
          <X size={18} />
        </button>
      </form>
    );
  }

  return (
    <>
      <div className="case-title">
        <h1>{shown}</h1>
        <button
          ref={renameButton}
          type="button"
          className="icon-button"
          aria-label="Rename business case"
          title="Rename business case"
          onClick={startEditing}
        >
          <Pencil size={16} />
        </button>
      </div>
      {showApplication && <p className="case-application">Application: {application}</p>}
    </>
  );
}
