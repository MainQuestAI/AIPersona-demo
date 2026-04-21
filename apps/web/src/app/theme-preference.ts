export const THEME_STORAGE_KEY = 'aipersona_theme';

export type ThemeMode = 'dark' | 'light';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

export function readStoredThemePreference(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(storedTheme) ? storedTheme : 'light';
}

export function persistThemePreference(theme: ThemeMode) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

export function applyThemePreference(theme: ThemeMode) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
