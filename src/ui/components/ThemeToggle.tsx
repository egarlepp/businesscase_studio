import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { setThemePreference, useTheme, type ThemePreference } from '../../theme/theme';
import { HintTooltip } from './HintTooltip';

const OPTIONS: Array<{ value: ThemePreference; label: string; detail: string; icon: LucideIcon }> =
  [
    { value: 'light', label: 'Light mode', detail: 'Always use the light theme.', icon: Sun },
    { value: 'dark', label: 'Dark mode', detail: 'Always use the dark theme.', icon: Moon },
    {
      value: 'system',
      label: 'Match system',
      detail: "Follow your device's light or dark setting.",
      icon: Monitor,
    },
  ];

/** Icon-only light, dark, and system theme buttons. The choice is kept in this browser. */
export function ThemeToggle() {
  const { preference } = useTheme();
  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      {OPTIONS.map(({ value, label, detail, icon: Icon }) => (
        <HintTooltip
          key={value}
          placement="top"
          className="sidebar-tool-anchor"
          content={
            <>
              <strong>{label}</strong>
              <span>{detail}</span>
            </>
          }
        >
          {(describedBy) => (
            <button
              type="button"
              className={preference === value ? 'sidebar-tool on' : 'sidebar-tool'}
              aria-label={label}
              aria-pressed={preference === value}
              aria-describedby={describedBy}
              onClick={() => setThemePreference(value)}
            >
              <Icon size={17} aria-hidden="true" />
            </button>
          )}
        </HintTooltip>
      ))}
    </div>
  );
}
