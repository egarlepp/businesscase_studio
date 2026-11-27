// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { CHANGELOG, LAST_SEEN_VERSION_KEY } from './data/changelog';
import { defaultInputs } from './data/defaults';
import { DRAFT_SCHEMA, DRAFT_VERSION, STORAGE_KEY } from './persistence/draft';
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

describe('App', () => {
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

  it('formats money in the selected currency', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, 'Profile');
    await user.selectOptions(screen.getByLabelText('Currency'), 'EUR');
    await goTo(user, 'Overview');
    expect(screen.getByText('Total cost of ownership').closest('article')).toHaveTextContent('€');
  });

  it('only resets after confirmation', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, 'Profile');
    const name = screen.getByLabelText('Application or initiative');
    await user.clear(name);
    await user.type(name, 'Changed');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Changed');
    confirm.mockReturnValueOnce(true);
    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      defaultInputs.applicationName,
    );
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
    await user.upload(screen.getByLabelText('Import draft file'), file);
    expect(await screen.findByText('Imported "Imported Case".')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Imported Case');
    expect(
      within(screen.getByRole('group', { name: 'Scenario' })).getByRole('button', {
        name: 'Conservative',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('reports an invalid import and keeps the current model', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm');
    render(<App />);
    await goTo(user, 'Reports');
    const file = new File(['{not json'], 'broken.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Import draft file'), file);
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
    const legacyInputs: Record<string, unknown> = { ...defaultInputs };
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
    expect(
      within(dialog).getByRole('region', { name: `Version ${APP_VERSION}` }),
    ).toBeInTheDocument();
    expect(within(dialog).getAllByRole('region').length).toBe(CHANGELOG.length);
    expect(within(dialog).getByRole('button', { name: "Close what's new" })).toHaveFocus();
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
