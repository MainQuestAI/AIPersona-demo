import { ChevronLeft, ChevronRight, ScanEye, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '@/types/route';
import { useShellUiStore } from '../providers';

export function GlobalRail() {
  const railCollapsed = useShellUiStore((state) => state.railCollapsed);
  const toggleRail = useShellUiStore((state) => state.toggleRail);
  const mobileRailOpen = useShellUiStore((state) => state.mobileRailOpen);
  const setMobileRailOpen = useShellUiStore((state) => state.setMobileRailOpen);
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileRailOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileRailOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={[
          // Base styles
          'flex h-screen flex-col border-r border-line bg-rail/80 px-3 py-4 backdrop-blur-xl transition-all duration-300',
          // Desktop: sticky sidebar
          'md:sticky md:top-0 md:z-30',
          railCollapsed ? 'md:w-[84px]' : 'md:w-[260px]',
          // Mobile: fixed overlay drawer, hidden by default
          'fixed top-0 left-0 z-50 w-[280px]',
          mobileRailOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-3 px-1 pb-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-card border border-accent/25 bg-accentSoft text-accent">
              <ScanEye className="h-5 w-5" />
            </div>
            {!railCollapsed ? (
              <div className="min-w-0">
                <div className="eyebrow text-muted">AIpersona</div>
                <div className="text-lg font-semibold tracking-[-0.02em] text-text">
                  研究工作台
                </div>
              </div>
            ) : null}
          </div>
          {/* Desktop: collapse toggle */}
          <button
            type="button"
            onClick={toggleRail}
            className="hidden md:grid h-9 w-9 place-items-center rounded-btn border border-line bg-panel text-muted transition hover:border-accent/40 hover:text-accent"
            aria-label={railCollapsed ? '展开导航栏' : '收起导航栏'}
          >
            {railCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
          {/* Mobile: close button */}
          <button
            type="button"
            onClick={() => setMobileRailOpen(false)}
            className="grid md:hidden h-9 w-9 place-items-center rounded-btn border border-line bg-panel text-muted transition hover:text-text"
            aria-label="关闭导航"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {APP_ROUTES.map((route) => {
            const Icon = route.icon;
            return (
              <NavLink
                key={route.path}
                to={route.path}
                onClick={() => setMobileRailOpen(false)}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-card border px-3 py-3 transition-all duration-200',
                    (route.path === '/studies' && location.pathname.startsWith('/studies'))
                      || isActive
                      ? 'border-accent/35 bg-accentSoft text-text'
                      : 'border-transparent bg-transparent text-muted hover:border-line hover:bg-panel hover:text-text',
                    railCollapsed ? 'md:justify-center' : 'justify-start',
                  ].join(' ')
                }
                title={route.label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!railCollapsed || mobileRailOpen ? (
                  <span className="text-sm font-medium tracking-wide md:hidden">
                    {route.label}
                  </span>
                ) : null}
                {!railCollapsed ? (
                  <span className="hidden md:inline text-sm font-medium tracking-wide">
                    {route.label}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
