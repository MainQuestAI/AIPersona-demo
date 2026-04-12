import type { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { create } from 'zustand';

type ShellUiState = {
  railCollapsed: boolean;
  mobileRailOpen: boolean;
  toggleRail: () => void;
  setRailCollapsed: (collapsed: boolean) => void;
  setMobileRailOpen: (open: boolean) => void;
};

export const useShellUiStore = create<ShellUiState>((set) => ({
  railCollapsed: false,
  mobileRailOpen: false,
  toggleRail: () =>
    set((state) => ({
      railCollapsed: !state.railCollapsed,
    })),
  setRailCollapsed: (collapsed) => set({ railCollapsed: collapsed }),
  setMobileRailOpen: (open) => set({ mobileRailOpen: open }),
}));

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
