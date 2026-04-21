import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  persistThemePreference,
  readStoredThemePreference,
  THEME_STORAGE_KEY,
} from './theme-preference';
import { useShellUiStore } from './providers';

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
}

describe('theme preference helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    useShellUiStore.setState({
      railCollapsed: false,
      mobileRailOpen: false,
      theme: 'light',
    });
  });

  it('defaults to light when no browser storage is available', () => {
    expect(readStoredThemePreference()).toBe('light');
  });

  it('persists the selected theme and reads it back on the next load', () => {
    const localStorage = createLocalStorageMock();
    vi.stubGlobal('window', { localStorage });

    persistThemePreference('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(readStoredThemePreference()).toBe('dark');
  });

  it('toggles the shell theme in store state', () => {
    useShellUiStore.getState().toggleTheme();
    expect(useShellUiStore.getState().theme).toBe('dark');

    useShellUiStore.getState().toggleTheme();
    expect(useShellUiStore.getState().theme).toBe('light');
  });
});
