import { AnimatePresence, motion } from 'framer-motion';
import { useWorkbenchUiStore } from '../store/ui-store';

export function ToastContainer() {
  const toasts = useWorkbenchUiStore((state) => state.toasts);
  const dismissToast = useWorkbenchUiStore((state) => state.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto rounded-[12px] border border-accent/30 bg-[rgba(3,3,5,0.92)] px-4 py-3 text-sm text-text shadow-lg backdrop-blur-xl"
          >
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="flex items-center gap-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {toast.message}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
