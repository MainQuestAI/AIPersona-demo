import { ChevronLeft, ChevronRight, ScanEye } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '@/types/route';
import { useShellUiStore } from '../providers';

export function GlobalRail() {
  const railCollapsed = useShellUiStore((state) => state.railCollapsed);
  const toggleRail = useShellUiStore((state) => state.toggleRail);
  const location = useLocation();

  return (
    <aside
      className={[
        'sticky top-0 z-30 flex h-screen flex-col border-r border-line bg-rail/80 px-3 py-4 backdrop-blur-xl transition-all duration-300',
        railCollapsed ? 'w-[84px]' : 'w-[260px]',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3 px-1 pb-5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-card border border-accent/25 bg-accentSoft text-accent">
            <ScanEye className="h-5 w-5" />
          </div>
          {!railCollapsed ? (
            <div className="min-w-0">
              <div className="eyebrow text-muted">AI Consumer</div>
              <div className="text-lg font-semibold tracking-[-0.02em] text-text">
                研究工作台
              </div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={toggleRail}
          className="grid h-9 w-9 place-items-center rounded-btn border border-line bg-panel text-muted transition hover:border-accent/40 hover:text-accent"
          aria-label={railCollapsed ? '展开导航栏' : '收起导航栏'}
        >
          {railCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {APP_ROUTES.map((route) => {
          const Icon = route.icon;
          return (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-card border px-3 py-3 transition-all duration-200',
                  (route.path === '/studies' && location.pathname.startsWith('/studies'))
                    || isActive
                    ? 'border-accent/35 bg-accentSoft text-text'
                    : 'border-transparent bg-transparent text-muted hover:border-line hover:bg-panel hover:text-text',
                  railCollapsed ? 'justify-center' : 'justify-start',
                ].join(' ')
              }
              title={route.label}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!railCollapsed ? (
                <div className="min-w-0">
                  <div className="text-sm font-medium tracking-wide">
                    {route.label}
                  </div>
                  <div className="eyebrow text-muted">
                    {route.railLabel}
                  </div>
                </div>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
