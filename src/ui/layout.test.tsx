// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { saveStoredDraft } from '../persistence/draft';
import { setThemePreference } from '../theme/theme';
import { sampleDraft, saveWorkspacePrefs } from '../workspace/workspace';

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

beforeEach(() => {
  saveWorkspacePrefs(window.localStorage, { demoMode: false });
  saveStoredDraft(window.localStorage, sampleDraft());
});
afterEach(() => setThemePreference('system'));

const sidebar = () => within(screen.getByRole('complementary'));

describe('Layout and theme controls', () => {
  it('switches between light, dark, and system themes from the sidebar', async () => {
    const user = userEvent.setup();
    render(<App />);
    const group = within(sidebar().getByRole('group', { name: 'Color theme' }));
    expect(group.getByRole('button', { name: 'Match system' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(group.getByRole('button', { name: 'Dark mode' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(group.getByRole('button', { name: 'Dark mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(group.getByRole('button', { name: 'Light mode' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('keeps the demo data switch in the sidebar as an icon-only button', () => {
    render(<App />);
    const toggle = sidebar().getByRole('switch', { name: 'Demo data' });
    expect(toggle).toHaveTextContent('');
    expect(toggle).toHaveAccessibleDescription(/explore a filled-in sample case/);
    expect(screen.getByRole('banner')).not.toContainElement(toggle);
  });

  it('shows Save, Open, and Clear as icon-only header buttons with descriptions', () => {
    render(<App />);
    const files = within(screen.getByRole('group', { name: 'Case file' }));
    for (const name of ['Save file', 'Open file', 'Clear data']) {
      const button = files.getByRole('button', { name });
      expect(button).toHaveTextContent('');
      expect(button.querySelector('svg')).not.toBeNull();
      expect(button).toHaveAccessibleDescription(/./);
    }
  });

  it('puts an icon before each scenario name', () => {
    render(<App />);
    const group = within(screen.getByRole('group', { name: 'Scenario' }));
    for (const name of ['Conservative', 'Expected', 'Upside']) {
      expect(group.getByRole('button', { name }).querySelector('svg')).not.toBeNull();
    }
  });

  it('gives every card title on every page an icon', async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = within(screen.getByRole('navigation', { name: 'Sections' }));
    for (const name of SECTIONS) {
      await user.click(nav.getByRole('button', { name }));
      const titles = document.querySelectorAll('main .panel h2');
      expect(titles.length, name).toBeGreaterThan(0);
      for (const title of titles) {
        const card = title.closest('.panel')!;
        // Report, verdict, and health cards lead with a large icon of their own instead.
        const hasIcon =
          title.querySelector(':scope > svg') !== null ||
          card.querySelector(':scope > svg, :scope > .health-score > svg') !== null ||
          title.closest('.verdict-head')?.querySelector(':scope > svg') != null;
        expect(hasIcon, `${name}: ${title.textContent}`).toBe(true);
      }
    }
  });
});
