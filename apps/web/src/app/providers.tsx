import { type ReactNode, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { create } from 'zustand';
import {
  applyThemePreference,
  persistThemePreference,
  readStoredThemePreference,
  type ThemeMode,
} from './theme-preference';

type ShellUiState = {
  railCollapsed: boolean;
  mobileRailOpen: boolean;
  theme: ThemeMode;
  toggleRail: () => void;
  setRailCollapsed: (collapsed: boolean) => void;
  setMobileRailOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

export const useShellUiStore = create<ShellUiState>((set) => ({
  railCollapsed: false,
  mobileRailOpen: false,
  theme: readStoredThemePreference(),
  toggleRail: () =>
    set((state) => ({
      railCollapsed: !state.railCollapsed,
    })),
  setRailCollapsed: (collapsed) => set({ railCollapsed: collapsed }),
  setMobileRailOpen: (open) => set({ mobileRailOpen: open }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
}));

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const theme = useShellUiStore((state) => state.theme);

  useEffect(() => {
    applyThemePreference(theme);
    persistThemePreference(theme);
  }, [theme]);

  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
