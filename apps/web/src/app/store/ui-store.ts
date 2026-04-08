import { create } from 'zustand';

export type WorkbenchDrawerId = 'trust' | 'twins' | 'inputs';

type ToastItem = {
  id: number;
  message: string;
};

type WorkbenchUiState = {
  activeDrawer: WorkbenchDrawerId | null;
  replayOpen: boolean;
  toasts: ToastItem[];
  openDrawer: (drawer: WorkbenchDrawerId) => void;
  closeDrawer: () => void;
  openReplay: () => void;
  closeReplay: () => void;
  showToast: (message: string) => void;
  dismissToast: (id: number) => void;
};

let toastIdCounter = 0;

export const useWorkbenchUiStore = create<WorkbenchUiState>((set) => ({
  activeDrawer: null,
  replayOpen: false,
  toasts: [],
  openDrawer: (drawer) => set({ activeDrawer: drawer }),
  closeDrawer: () => set({ activeDrawer: null }),
  openReplay: () => set({ replayOpen: true }),
  closeReplay: () => set({ replayOpen: false }),
  showToast: (message) => {
    const id = ++toastIdCounter;
    set((state) => ({ toasts: [...state.toasts, { id, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
