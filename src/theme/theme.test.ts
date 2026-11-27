// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { CHART_PALETTE, resolveTheme, setThemePreference, THEME_KEY } from './theme';

afterEach(() => setThemePreference('system'));

describe('theme', () => {
  it('follows the system setting unless the user picked light or dark', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('saves an explicit choice, applies it to the page, and forgets it for system', () => {
    setThemePreference('dark');
    expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');

    setThemePreference('system');
    expect(window.localStorage.getItem(THEME_KEY)).toBeNull();
    // jsdom has no matchMedia, so the system setting reads as light.
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('has a chart color for every series in both themes', () => {
    expect(Object.keys(CHART_PALETTE.dark)).toEqual(Object.keys(CHART_PALETTE.light));
  });
});
