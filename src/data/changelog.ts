/**
 * User-facing release notes shown in the "What's new" dialog. Newest release first.
 * src/data/changelog.test.ts checks that the first entry matches APP_VERSION, so bumping
 * package.json without adding notes fails the build.
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

export const CHANGELOG: readonly Release[] = [
  {
    version: '0.8.0',
    date: '2026-11-27',
    title: 'Scope: which pages apply',
    changes: [
      'A new Scope panel on the Profile page asks what kind of application this is: its type, who uses it, what data it handles, how it uses AI, how many systems it integrates with, whether you could buy a product instead, and where it stands today. The guided walkthrough asks the same questions.',
      'The answers mark AI Development, Build vs Buy, Technical Health, and Actuals as essential, optional, or not applicable. You can override any of them.',
      'Pages that do not apply are greyed out in the navigation and can be hidden. Their inputs are kept, and any costs entered there still count in TCO.',
      'Scope suggests the value types that fit the application, with one-click claiming, and marks them "Fits this app" on the Benefits page.',
      'New guardrails catch costs the scope makes essential but are still zero, such as production AI with no runtime cost or personal data with no security spend.',
      'Reports add a Scope section listing what was left out and why.',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-11-27',
    title: 'More value types and claim review',
    changes: [
      'Benefits now covers 15 value types. Beside time saved, capacity, revenue influence, and risk reduction you can claim hard cost reduction, retention and expansion, cycle time, cash acceleration, quality and rework, compliance, employee ramp and retention, forecast quality, customer experience, tech debt, and strategic optionality.',
      'Switch on only the value types you will defend. Each claimed type shows its panel, an evidence class (hard, semi-hard, or soft), and a baseline source.',
      'A claim review flags double counting, more than three claims, soft claims in the lead, missing baselines, and idea-stage cases without a pilot success threshold and kill criterion. It also asks you to compare against the commercial product when one exists.',
      'The model reports NPV and ROI with soft claims removed. Strategic optionality is shown as an argument on top and is never counted in ROI.',
      'Hard cost savings count only from the month a contract ends. Cycle time and cash acceleration count as the timing value of money, not new revenue.',
      'The guide recommends claims for each audience, for example cycle time, rep ramp, forecast accuracy, and retention for a CRO, and Reports lists each claim with its evidence and source.',
      'Cases saved before this version keep their four original benefit types claimed and calculate as before.',
    ],
  },
  {
    version: '0.6.0',
    date: '2026-11-27',
    title: 'Named business cases and case files',
    changes: [
      'Give each business case its own name: select the pencil next to the title. The name is separate from the application name on the Profile page, which still shows under the title.',
      'Save file in the header downloads the whole case as a JSON file named after the case: every input, the scenario, the assumption register, and your walkthrough answers.',
      'Open file in the header loads a saved case so you can pick up where you left off. The file is checked first, you are asked before your current case is replaced, and anything that could not be read is listed.',
      'Files saved by earlier versions still open. Fields the app does not recognize are ignored, and fields missing from a file are left blank instead of being filled with sample figures.',
    ],
  },
  {
    version: '0.5.1',
    date: '2026-11-27',
    title: 'Field, scenario, and confidence explanations',
    changes: [
      'Every input field has an info icon beside its label. Hover, focus, or tap it for a short explanation and a Search Google link that opens a web search for the term in a new tab.',
      'Hover, focus, or tap Conservative, Expected, or Upside to see exactly which inputs each scenario adjusts and by how much.',
      'Hover, focus, or tap the model confidence block in the sidebar to see how the score is built, what a high or low value means, and how technical risk is rated.',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-11-27',
    title: 'Guided walkthrough, audiences, and blank start',
    changes: [
      'New guided walkthrough: open Guide in the header at any time. Five questions decide which steps you need, then it opens each page, explains what the step does, and shows example figures you can use or replace.',
      'Choose who you are presenting to: IT manager, CIO / CTO, CFO, CRO, COO, CISO, or the board. The guide tailors its advice, marks the pages they care about with a dot, and Reports adds a briefing with the numbers to lead with and the questions to expect.',
      'New cases start blank, with every figure at zero and no sample names or assumptions. The first launch asks whether to start blank, start with the guide, or explore demo data.',
      'A Demo data switch in the header shows a filled-in sample case. Your own case is kept separately, and demo edits are not saved.',
      'Clear data replaces Reset and erases the case saved in this browser after you confirm.',
    ],
  },
  {
    version: '0.4.1',
    date: '2026-11-27',
    title: 'Version and release notes',
    changes: [
      'The app version now appears next to the Studio name. Select it to see what changed in each release.',
      'A dot on the version badge marks a release you have not opened yet.',
      'The browser tab shows the Business Case Studio icon.',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-11-21',
    title: 'Build vs Buy',
    changes: [
      'New Build vs Buy page compares building in house against a commercial option, with a verdict, side-by-side table, and cumulative net-value chart.',
      'Vendor evidence check flags commercial assumptions that lack a source or confidence and adds them to the register.',
      'The assumption register is editable: add, change, and remove assumptions with their source and confidence.',
      'Reports include a build-vs-buy summary when the comparison is configured.',
      'Drafts saved before this release open with the comparison left unconfigured.',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-11-10',
    title: 'Drafts, explanations, and sensitivity',
    changes: [
      'Save, reopen, and import versioned drafts.',
      'Every headline metric explains its formula and the inputs behind it.',
      'Tornado chart shows which assumptions move ROI the most.',
      'Choose the currency for all figures.',
      'Print-friendly report and CSV export of annual cash flows.',
      'Payback accounts for cost growth, technical-debt reserve follows the health assessment, and actuals compare realized against planned value.',
      'Keyboard and screen-reader accessibility improvements, including chart data tables.',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-08-06',
    title: 'First public MVP',
    changes: [
      'Model ROI, total cost of ownership, NPV, and payback for an internally built application.',
      'Benefits, TCO, AI-assisted development, technical health, scenarios, assumptions, and actuals pages.',
      'Conservative, expected, and upside scenarios.',
      'Inputs are saved only in this browser.',
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
