/**
 * User-facing release notes shown in the "What's new" dialog. Newest release first.
 * src/data/changelog.test.ts checks that the first entry matches APP_VERSION, so bumping
 * package.json without adding notes fails the build, and that at most MAX_CHANGELOG_ENTRIES are
 * kept: when you add a release, delete the oldest one.
 */
export interface Release {
  /** Semantic version without the leading "v". */
  version: string;
  /** Release date as an ISO date (YYYY-MM-DD). */
  date: string;
  /** One-line summary of the release. */
  title: string;
  /** User-visible changes, written for people using the app rather than developers. */
  changes: readonly string[];
}

/** How many releases the changelog keeps. Older entries are deleted, not hidden. */
export const MAX_CHANGELOG_ENTRIES = 5;

/** How many of the newest releases the dialog shows before "Show older releases". */
export const RECENT_RELEASES_SHOWN = 2;

export const CHANGELOG: readonly Release[] = [
  {
    version: '0.10.0',
    date: '2026-11-27',
    title: 'AI briefing pack for reports and decks',
    changes: [
      'A new AI briefing pack on the Reports page turns the case into a written memo, a slide deck, or both with an AI assistant such as Claude. Pick the audience and what to ask for, then copy the pack or download it as a Markdown file.',
      'The pack holds the results for all three scenarios, the ROI with soft claims removed, each claim with its evidence class and baseline source, costs, cash flow, the inputs that move NPV most, scope, assumptions, guardrail warnings, and the pilot threshold and kill criterion.',
      "Its prompt follows the audience's storyline and likely questions, and tells the assistant to quote figures exactly, never calculate or invent numbers, and keep every risk and caveat.",
      'Nothing is sent anywhere: you paste or attach the pack yourself. Check every figure in the result against the Reports page before you present it.',
    ],
  },
  {
    version: '0.9.0',
    date: '2026-11-27',
    title: 'Dark mode and a tidier header',
    changes: [
      'Dark mode: the sun, moon, and monitor buttons at the bottom of the sidebar switch between light, dark, and your system setting (the default). Every page and chart follows the theme, and printing stays light.',
      'The Demo data switch moved to the same row in the sidebar, as a flask button at the far right.',
      'Save file, Open file, and Clear data are now icon buttons at the right of the header. Hover or focus one to see what it does; Clear data still asks before erasing anything.',
      'Conservative, Expected, and Upside have icons, and every card on every page now has an icon beside its title.',
    ],
  },
  {
    version: '0.8.3',
    date: '2026-11-27',
    title: 'Shorter release notes',
    changes: [
      "What's new opens on the two latest releases. Select Show older releases to see the rest.",
      'Release notes now keep only the five most recent releases.',
    ],
  },
  {
    version: '0.8.2',
    date: '2026-11-27',
    title: 'Clear data restarts the walkthrough',
    changes: [
      'Clear data now also resets the guided walkthrough: its setup answers and step progress are cleared, so the guide starts again from the setup questions.',
      'The walkthrough setup explains that questions 2, 4, 5 and 6 are the same as Scope on the Profile page.',
    ],
  },
  {
    version: '0.8.1',
    date: '2026-11-27',
    title: 'Tidier Scope questions',
    changes: [
      'The Scope questions on the Profile page now sit in two rows of four, with their answer boxes lined up, and wrap to two columns or one on smaller screens.',
    ],
  },
];

/** localStorage key holding the last release the user opened in the "What's new" dialog. */
export const LAST_SEEN_VERSION_KEY = 'business-case-studio:last-seen-version';

export function readLastSeenVersion(storage: Storage | undefined): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(LAST_SEEN_VERSION_KEY);
  } catch {
    return null;
  }
}

export function writeLastSeenVersion(storage: Storage | undefined, version: string): void {
  if (!storage) return;
  try {
    storage.setItem(LAST_SEEN_VERSION_KEY, version);
  } catch {
    // Storage can be full or blocked (private mode). The unseen dot simply stays visible.
  }
}
