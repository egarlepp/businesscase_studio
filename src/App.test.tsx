// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { CHANGELOG, LAST_SEEN_VERSION_KEY, RECENT_RELEASES_SHOWN } from './data/changelog';
import { defaultInputs } from './data/defaults';
import { DRAFT_SCHEMA, DRAFT_VERSION, saveStoredDraft, STORAGE_KEY } from './persistence/draft';
import { sampleDraft, saveWorkspacePrefs, WORKSPACE_KEY } from './workspace/workspace';
import { APP_VERSION } from './version';

const SECTIONS = [
  'Overview',
  'Profile',
  'Benefits',
  'TCO',
  'Build vs Buy',
  'AI Development',
  'Technical Health',
  'Scenarios',
  'Assumptions',
  'Actuals',
  'Reports',
];

const nav = () => within(screen.getByRole('navigation', { name: 'Sections' }));
const goTo = async (user: ReturnType<typeof userEvent.setup>, name: string) =>
  user.click(nav().getByRole('button', { name }));
const roiCard = () =>
  screen.getByRole('button', { name: 'How ROI is calculated' }).closest('article')!;

afterEach(() => {
  vi.restoreAllMocks();
});

/** A returning user whose own saved case is a copy of the sample (demo mode off). */
const seedOwnSampleCase = () => {
  saveWorkspacePrefs(window.localStorage, { demoMode: false });
  saveStoredDraft(window.localStorage, sampleDraft());
};

describe('App', () => {
  beforeEach(seedOwnSampleCase);

  it('renders the overview with key metrics', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      defaultInputs.applicationName,
    );
    expect(roiCard()).toHaveTextContent('40.3%');
    expect(screen.getByText('Total cost of ownership')).toBeInTheDocument();
  });

  it('renders every section, with accessible names and aria-current on the nav', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const name of SECTIONS) {
      await goTo(user, name);
      const button = nav().getByRole('button', { name });
      expect(button).toHaveAttribute('aria-current', 'page');
      expect(screen.getByText(`BUSINESS CASE / ${name.toUpperCase()}`)).toBeInTheDocument();
    }
  });

  it('recalculates when an input changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    const before = roiCard().textContent;
    await goTo(user, 'Profile');
    const users = screen.getByLabelText('Target users');
    await user.clear(users);
    await user.type(users, '200');
    await goTo(user, 'Overview');
    expect(roiCard().textContent).not.toBe(before);
  });

  it('switches scenarios with pressed state', async () => {
    const user = userEvent.setup();
    render(<App />);
    const group = within(screen.getByRole('group', { name: 'Scenario' }));
    await user.click(group.getByRole('button', { name: 'Upside' }));
    expect(group.getByRole('button', { name: 'Upside' })).toHaveAttribute('aria-pressed', 'true');
    expect(roiCard()).toHaveTextContent('87.7%');
  });

  it('explains each scenario and the confidence score in keyboard-accessible tooltips', async () => {
    const user = userEvent.setup();
    render(<App />);
    const group = within(screen.getByRole('group', { name: 'Scenario' }));
    expect(group.getByRole('button', { name: 'Conservative' })).toHaveAccessibleDescription(
      /Adoption rate −20%/,
    );
    expect(group.getByRole('button', { name: 'Expected' })).toHaveAccessibleDescription(
      /exactly as entered/,
    );
    const confidence = screen.getByLabelText(/model confidence/);
    expect(confidence).toHaveAccessibleDescription(/base of 55 points/);
    const tip = document.getElementById(confidence.getAttribute('aria-describedby')!)!;
    expect(tip).toHaveAttribute('data-open', 'false');
    act(() => confidence.focus());
    expect(tip).toHaveAttribute('data-open', 'true');
    await user.keyboard('{Escape}');
    expect(tip).toHaveAttribute('data-open', 'false');
  });

  it('explains a field with a Google search link from its info icon', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, 'Profile');
    const info = screen.getByRole('button', { name: 'About Discount rate' });
    expect(info).toHaveAccessibleDescription(/cost of capital/);
    const tip = document.getElementById(info.getAttribute('aria-describedby')!)!;
    await user.hover(info);
    expect(tip).toHaveAttribute('data-open', 'true');
    const link = within(tip).getByRole('link', { name: /Search Google/ });
    expect(link).toHaveAttribute('href', expect.stringContaining('google.com/search?q=discount'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('formats money in the selected currency', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, 'Profile');
    await user.selectOptions(screen.getByLabelText('Currency'), 'EUR');
    await goTo(user, 'Overview');
    expect(screen.getByText('Total cost of ownership').closest('article')).toHaveTextContent('€');
  });

  it('only clears data after confirmation', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, 'Profile');
    const name = screen.getByLabelText('Application or initiative');
    await user.clear(name);
    await user.type(name, 'Changed');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    await user.click(screen.getByRole('button', { name: 'Clear data' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Changed');
    confirm.mockReturnValueOnce(true);
    await user.click(screen.getByRole('button', { name: 'Clear data' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Untitled business case');
    expect(screen.getByLabelText('Target users')).toHaveValue(0);
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toContain('Changed');
  });

  it('autosaves edits and restores them on the next load', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await goTo(user, 'Profile');
    const name = screen.getByLabelText('Application or initiative');
    await user.clear(name);
    await user.type(name, 'Saved Model');
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('Saved Model');
    unmount();
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Saved Model');
    expect(screen.getByText('Saved in this browser')).toBeInTheDocument();
  });

  it('imports a draft file after confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);
    await goTo(user, 'Reports');
    const draft = {
      schema: DRAFT_SCHEMA,
      version: DRAFT_VERSION,
      inputs: { ...defaultInputs, applicationName: 'Imported Case' },
      scenario: 'Conservative',
    };
    const file = new File([JSON.stringify(draft)], 'case.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Open business case file'), file);
    expect(await screen.findByText('Opened "Imported Case".')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Imported Case');
    expect(
      within(screen.getByRole('group', { name: 'Scenario' })).getByRole('button', {
        name: 'Conservative',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('copies an AI briefing pack tuned to the chosen audience', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, 'Reports');
    const panel = within(screen.getByRole('article', { name: 'AI briefing pack' }));
    await user.selectOptions(panel.getByLabelText('Audience'), 'cfo');
    await user.selectOptions(panel.getByLabelText('Ask the assistant for'), 'deck');
    await user.click(panel.getByRole('button', { name: 'Copy pack' }));
    expect(panel.getByRole('status')).toHaveTextContent('Copied.');
    const copied = await navigator.clipboard.readText();
    expect(copied).toContain('# AI briefing pack:');
    expect(copied).toContain('The audience is CFO / Finance');
    expect(copied).toContain('(.pptx)');
    expect(copied).toContain('## Facts');
  });

  it('reports an invalid import and keeps the current model', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm');
    render(<App />);
    await goTo(user, 'Reports');
    const file = new File(['{not json'], 'broken.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Open business case file'), file);
    expect(await screen.findByText('The file is not valid JSON.')).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      defaultInputs.applicationName,
    );
  });

  it('explains a metric on demand', async () => {
    const user = userEvent.setup();
    render(<App />);
    const toggle = screen.getByRole('button', { name: 'How ROI is calculated' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(roiCard()).toHaveTextContent('Built from: Total benefits');
  });

  it('applies the suggested technical-debt reserve', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, 'TCO');
    const reserve = screen.getByLabelText('Technical debt reserve');
    await user.clear(reserve);
    await user.type(reserve, '2');
    await goTo(user, 'Technical Health');
    await user.click(screen.getByRole('button', { name: 'Apply suggested reserve' }));
    expect(screen.getByRole('button', { name: 'Apply suggested reserve' })).toBeDisabled();
    await goTo(user, 'TCO');
    expect(screen.getByLabelText('Technical debt reserve')).toHaveValue(15.6);
  });

  it('shows a sensitivity table on the Scenarios page', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, 'Scenarios');
    const table = screen.getByRole('table', { name: /Sensitivity of NPV/ });
    expect(within(table).getByRole('rowheader', { name: 'Adoption rate' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/Metric/), 'roi');
    expect(screen.getByRole('table', { name: /Sensitivity of ROI/ })).toBeInTheDocument();
  });

  it('compares build with buy and reacts to the scenario', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, 'Build vs Buy');
    expect(screen.getByRole('heading', { name: /Too close to call/ })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Build versus buy comparison' })).toBeInTheDocument();
    const group = within(screen.getByRole('group', { name: 'Scenario' }));
    await user.click(group.getByRole('button', { name: 'Upside' }));
    expect(screen.getByRole('heading', { name: /Building is ahead/ })).toBeInTheDocument();
    await user.click(group.getByRole('button', { name: 'Conservative' }));
    expect(screen.getByRole('heading', { name: /Buying is ahead/ })).toBeInTheDocument();
  });

  it('tallies the non-financial checklist', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, 'Build vs Buy');
    await user.selectOptions(screen.getByLabelText('Data ownership'), 'Favors build');
    await user.selectOptions(screen.getByLabelText('Functional fit'), 'Favors buy');
    expect(screen.getByText(/Non-financial factors/)).toHaveTextContent(
      '1 favor build, 1 favor buy, 4 neutral',
    );
  });

  it('adds a vendor assumption from the evidence panel', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, 'Build vs Buy');
    await user.click(screen.getByRole('button', { name: 'Add vendor assumption' }));
    expect(nav().getByRole('button', { name: 'Assumptions' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const names = screen.getAllByLabelText(/^Assumption for assumption \d+$/);
    expect(names.at(-1)).toHaveValue('Vendor quote');
    expect(screen.getAllByLabelText(/^Category for assumption \d+$/).at(-1)).toHaveValue(
      'Build vs buy',
    );
  });

  it('adds, edits, and removes assumptions in the register', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, 'Assumptions');
    const before = screen.getAllByLabelText(/^Assumption for assumption \d+$/).length;
    await user.click(screen.getByRole('button', { name: 'Add assumption' }));
    const name = screen.getByLabelText(`Assumption for assumption ${before + 1}`);
    await user.type(name, 'Churn stays below 5%');
    await user.type(screen.getByLabelText(`Source for assumption ${before + 1}`), 'CRM export');
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('Churn stays below 5%');
    await user.click(
      screen.getByRole('button', { name: `Remove assumption ${before + 1}: Churn stays below 5%` }),
    );
    expect(screen.getAllByLabelText(/^Assumption for assumption \d+$/)).toHaveLength(before);
  });

  it('leaves the comparison unconfigured for a draft saved before build vs buy existed', async () => {
    // An edited case: an untouched legacy sample is treated as a first launch instead.
    window.localStorage.removeItem(WORKSPACE_KEY);
    const legacyInputs: Record<string, unknown> = { ...defaultInputs, applicationName: 'Mine' };
    for (const key of Object.keys(legacyInputs))
      if (key.startsWith('buy') || key.startsWith('bvb')) delete legacyInputs[key];
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schema: DRAFT_SCHEMA, version: DRAFT_VERSION, inputs: legacyInputs }),
    );
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, 'Build vs Buy');
    expect(
      screen.getByRole('heading', { name: /Enter the commercial option/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Build versus buy comparison' })).toBeNull();
  });

  it('opens release notes from the version badge and remembers they were seen', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    const badge = screen.getByRole('button', { name: /^Version .*new updates\. Show what's new$/ });
    expect(badge).toHaveTextContent(`v${APP_VERSION}`);
    await user.click(badge);
    const dialog = screen.getByRole('dialog', { name: /^What.s new$/ });
    expect(within(dialog).getByRole('button', { name: "Close what's new" })).toHaveFocus();
    expect(
      within(dialog).getByRole('region', { name: `Version ${APP_VERSION}` }),
    ).toBeInTheDocument();
    expect(within(dialog).getAllByRole('region')).toHaveLength(RECENT_RELEASES_SHOWN);
    const toggle = within(dialog).getByRole('button', { name: /^Show older releases/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(dialog).getAllByRole('region')).toHaveLength(CHANGELOG.length);
    await user.click(within(dialog).getByRole('button', { name: /^Hide older releases/ }));
    expect(within(dialog).getAllByRole('region')).toHaveLength(RECENT_RELEASES_SHOWN);
    expect(window.localStorage.getItem(LAST_SEEN_VERSION_KEY)).toBe(APP_VERSION);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      screen.getByRole('button', { name: `Version ${APP_VERSION}. Show what's new` }),
    ).toBeInTheDocument();
    unmount();

    render(<App />);
    expect(screen.queryByRole('button', { name: /new updates/ })).toBeNull();
  });

  it('opens release notes from the footer version and closes with the close button', async () => {
    const user = userEvent.setup();
    render(<App />);
    const footer = screen.getByRole('contentinfo');
    await user.click(
      within(footer).getByRole('button', { name: `Release notes for version ${APP_VERSION}` }),
    );
    await user.click(screen.getByRole('button', { name: "Close what's new" }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Workspace: blank start and demo mode', () => {
  const ALL_SECTIONS = SECTIONS;

  it('asks on first launch and starts a blank case that renders without broken numbers', async () => {
    const user = userEvent.setup();
    render(<App />);
    const dialog = screen.getByRole('dialog', { name: 'How do you want to start?' });
    expect(within(dialog).getByRole('button', { name: /Start blank/ })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: /Start blank/ }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Untitled business case');
    expect(
      screen.getByRole('heading', { name: 'Add figures to build your business case' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Demo data' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(JSON.parse(window.localStorage.getItem(WORKSPACE_KEY)!)).toMatchObject({
      demoMode: false,
    });
    for (const name of ALL_SECTIONS) {
      await goTo(user, name);
      expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
    }
    expect(screen.getByText(/has no benefits or costs yet/)).toBeInTheDocument();
  });

  it('shows a value type’s panel only once it is claimed', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Start blank/ }));
    await goTo(user, 'Benefits');
    expect(screen.queryByLabelText('Annual spend retired')).toBeNull();
    expect(screen.getByText(/No value type is claimed/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /Hard cost reduction/ }));
    expect(screen.getByLabelText('Annual spend retired')).toBeInTheDocument();
    expect(screen.getByLabelText('Evidence class')).toHaveValue('hard');
    expect(screen.getByText(/No baseline source for Hard cost reduction/)).toBeInTheDocument();
  });

  it('opens a page from the blank-case steps', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Start blank/ }));
    await user.click(screen.getByRole('button', { name: 'Open Benefits' }));
    expect(screen.getByText('BUSINESS CASE / BENEFITS')).toBeInTheDocument();
  });

  it('does not save edits made in demo mode', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Explore demo data/ }));
    expect(screen.getByRole('note')).toHaveTextContent('Demo mode.');
    expect(screen.getByText('Demo data: changes are not saved')).toBeInTheDocument();
    await goTo(user, 'Profile');
    const name = screen.getByLabelText('Application or initiative');
    await user.clear(name);
    await user.type(name, 'Scratch');
    expect(window.localStorage.getItem(STORAGE_KEY) ?? '').not.toContain('Scratch');
  });

  it('switches to the demo and back without losing the user’s own case', async () => {
    seedOwnSampleCase();
    const own = sampleDraft();
    own.inputs.applicationName = 'Claims portal';
    saveStoredDraft(window.localStorage, own);
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    expect(screen.queryByRole('dialog')).toBeNull();
    const toggle = screen.getByRole('switch', { name: 'Demo data' });

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      defaultInputs.applicationName,
    );
    // Demo mode survives a reload.
    unmount();
    render(<App />);
    expect(screen.getByRole('switch', { name: 'Demo data' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Exit demo' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Claims portal');
  });

  it('keeps an edited case from an earlier version without asking', () => {
    const own = sampleDraft();
    own.inputs.applicationName = 'Claims portal';
    saveStoredDraft(window.localStorage, own);
    render(<App />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Claims portal');
  });

  it('asks again when the saved case is the untouched sample from an earlier version', () => {
    saveStoredDraft(window.localStorage, sampleDraft());
    render(<App />);
    expect(screen.getByRole('dialog', { name: 'How do you want to start?' })).toBeInTheDocument();
  });

  it('leaves demo mode when a draft is imported', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Explore demo data/ }));
    await goTo(user, 'Reports');
    const draft = {
      schema: DRAFT_SCHEMA,
      version: DRAFT_VERSION,
      inputs: { ...defaultInputs, applicationName: 'Imported Case' },
    };
    const file = new File([JSON.stringify(draft)], 'case.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Open business case file'), file);
    expect(await screen.findByText('Opened "Imported Case".')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Demo data' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('Imported Case');
  });
});

/** Capture what the app downloads: the file name and its text. */
function captureDownloads() {
  const files: Array<{ name: string; blob: Blob }> = [];
  let pending: Blob | null = null;
  Object.assign(URL, {
    createObjectURL: (blob: Blob) => {
      pending = blob;
      return 'blob:test';
    },
    revokeObjectURL: () => undefined,
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    if (pending) files.push({ name: this.download, blob: pending });
    pending = null;
  });
  return files;
}

describe('Named business cases and case files', () => {
  beforeEach(seedOwnSampleCase);

  it('renames the case from the header and keeps the application name visible', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'Rename business case' }));
    const field = screen.getByRole('textbox', { name: 'Business case name' });
    expect(field).toHaveFocus();
    expect(field).toHaveValue(defaultInputs.applicationName);
    await user.clear(field);
    await user.type(field, '  FY27 funding request  {Enter}');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('FY27 funding request');
    expect(screen.getByText(`Application: ${defaultInputs.applicationName}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename business case' })).toBeInTheDocument();
    unmount();
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('FY27 funding request');
  });

  it('cancels a rename with Escape', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Rename business case' }));
    await user.type(screen.getByRole('textbox', { name: 'Business case name' }), 'Nope{Escape}');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      defaultInputs.applicationName,
    );
  });

  it('saves the whole case to a file named after the case', async () => {
    const user = userEvent.setup();
    const downloads = captureDownloads();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Rename business case' }));
    const field = screen.getByRole('textbox', { name: 'Business case name' });
    await user.clear(field);
    await user.type(field, 'Q3 Pipeline Review{Enter}');
    await user.click(screen.getByRole('button', { name: 'Save file' }));
    expect(downloads).toHaveLength(1);
    expect(downloads[0].name).toBe('q3-pipeline-review.json');
    const saved = JSON.parse(await downloads[0].blob.text()) as Record<string, unknown>;
    expect(saved).toMatchObject({
      schema: DRAFT_SCHEMA,
      version: DRAFT_VERSION,
      appVersion: APP_VERSION,
      caseName: 'Q3 Pipeline Review',
      scenario: 'Expected',
    });
    expect((saved.inputs as Record<string, unknown>).applicationName).toBe(
      defaultInputs.applicationName,
    );
  });

  it('opens a saved file, restoring its name and walkthrough audience', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);
    const draft = {
      schema: DRAFT_SCHEMA,
      version: DRAFT_VERSION,
      caseName: 'Claims portal business case',
      inputs: { ...defaultInputs, applicationName: 'Claims portal' },
      guide: {
        answers: {
          audience: 'cfo',
          stage: 'built',
          aiAssisted: 'no',
          buyOption: 'no',
          levers: ['productivity'],
        },
        stepId: null,
        done: [],
      },
    };
    const file = new File([JSON.stringify(draft)], 'claims.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Open business case file'), file);
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Claims portal business case'));
    expect(await screen.findByText('Opened "Claims portal business case".')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Claims portal business case',
    );
    expect(screen.getByText('Application: Claims portal')).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('Claims portal business case');
    expect(window.localStorage.getItem('business-case-studio:guide')).toContain('"cfo"');
  });

  it('keeps the current case when the overwrite is declined', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<App />);
    const draft = { schema: DRAFT_SCHEMA, version: DRAFT_VERSION, caseName: 'Other', inputs: {} };
    const file = new File([JSON.stringify(draft)], 'other.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Open business case file'), file);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      defaultInputs.applicationName,
    );
    expect(screen.queryByText('Opened "Other".')).not.toBeInTheDocument();
  });

  it('opens a file into an empty case without asking', async () => {
    window.localStorage.clear();
    saveWorkspacePrefs(window.localStorage, { demoMode: false });
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm');
    render(<App />);
    const draft = { schema: DRAFT_SCHEMA, version: 1, inputs: { applicationName: 'Old file' } };
    const file = new File([JSON.stringify(draft)], 'old.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Open business case file'), file);
    expect(confirm).not.toHaveBeenCalled();
    expect(await screen.findByText('Opened "Old file".')).toBeInTheDocument();
    expect(screen.getByText(/left blank/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dismiss message' }));
    expect(screen.queryByText('Opened "Old file".')).not.toBeInTheDocument();
  });
});
