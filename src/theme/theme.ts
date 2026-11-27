import { useSyncExternalStore } from 'react';

/** The user's choice. `system` follows the operating system's light or dark setting. */
export type ThemePreference = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

/** Browser preference. Absent means `system`. Read by the inline script in index.html too. */
export const THEME_KEY = 'business-case-studio:theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): Theme {
  if (preference === 'system') return systemDark ? 'dark' : 'light';
  return preference;
}

function readPreference(): ThemePreference {
  try {
    const stored = globalThis.localStorage?.getItem(THEME_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY).matches
    : false;
}

let preference: ThemePreference = readPreference();
const listeners = new Set<() => void>();
let snapshot = { preference, theme: resolveTheme(preference, systemPrefersDark()) };

function apply() {
  snapshot = { preference, theme: resolveTheme(preference, systemPrefersDark()) };
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = snapshot.theme;
    document.documentElement.style.colorScheme = snapshot.theme;
  }
  listeners.forEach((l) => l());
}

export function setThemePreference(next: ThemePreference) {
  preference = next;
  try {
    if (next === 'system') globalThis.localStorage?.removeItem(THEME_KEY);
    else globalThis.localStorage?.setItem(THEME_KEY, next);
  } catch {
    // Storage blocked: the choice lasts for this session only.
  }
  apply();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(DARK_QUERY)
      : null;
  media?.addEventListener('change', apply);
  return () => {
    listeners.delete(listener);
    media?.removeEventListener('change', apply);
  };
}

/** Current preference and the theme it resolves to; re-renders when either changes. */
export function useTheme() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot,
  );
}

/** Sets the theme on <html> at startup, before React renders. */
export function initTheme() {
  apply();
}

/** Series and reference colors for Recharts, which takes colors as SVG attributes. */
export const CHART_PALETTE: Record<
  Theme,
  { benefits: string; costs: string; net: string; bar: string; reference: string }
> = {
  light: {
    benefits: '#2f7d5b',
    costs: '#c2410c',
    net: '#5f49d7',
    bar: '#5f49d7',
    reference: '#525b6e',
  },
  dark: {
    benefits: '#4cc38a',
    costs: '#f08a4b',
    net: '#a08cff',
    bar: '#8b76f0',
    reference: '#8b93a5',
  },
};

export function useChartColors() {
  return CHART_PALETTE[useTheme().theme];
}
