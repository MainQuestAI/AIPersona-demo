import { ChevronLeft, ChevronRight, LogIn, LogOut, Moon, ScanEye, Sun, X } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/types/route';
import { useShellUiStore } from '../providers';

function UserStatusArea({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  let user: { display_name?: string; email?: string } | null = null;
  try {
    const raw = localStorage.getItem('aipersona_user');
    if (raw) user = JSON.parse(raw);
  } catch { /* ignore */ }

  if (!user || !user.display_name) {
    return (
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="flex items-center gap-3 rounded-card border border-transparent px-3 py-3 text-muted transition hover:border-line hover:bg-panel hover:text-text"
        title="登录"
      >
        <LogIn className="h-5 w-5 shrink-0" />
        {!collapsed ? <span className="text-sm font-medium">登录</span> : null}
      </button>
    );
  }

  const initial = (user.display_name || '?')[0].toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-card px-3 py-3">
      <div className="h-8 w-8 shrink-0 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
        {initial}
      </div>
      {!collapsed ? (
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-text truncate">{user.display_name}</div>
          <div className="text-[0.6rem] text-tertiary truncate">{user.email}</div>
        </div>
      ) : null}
      {!collapsed ? (
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('aipersona_token');
            localStorage.removeItem('aipersona_user');
            localStorage.removeItem('aipersona_teams');
            navigate('/login');
          }}
          className="text-muted hover:text-danger transition"
          title="退出登录"
        >
          <LogOut className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export function GlobalRail() {
  const railCollapsed = useShellUiStore((state) => state.railCollapsed);
  const toggleRail = useShellUiStore((state) => state.toggleRail);
  const mobileRailOpen = useShellUiStore((state) => state.mobileRailOpen);
  const setMobileRailOpen = useShellUiStore((state) => state.setMobileRailOpen);
  const theme = useShellUiStore((state) => state.theme);
  const toggleTheme = useShellUiStore((state) => state.toggleTheme);
  const location = useLocation();
  const showLabels = !railCollapsed || mobileRailOpen;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileRailOpen ? (
        <div
          className="fixed inset-0 z-40 backdrop-blur-sm md:hidden"
          style={{ background: 'var(--color-overlay-60)' }}
          onClick={() => setMobileRailOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={[
          // Base styles
          'flex h-screen flex-col overflow-x-hidden border-r border-line bg-rail/80 px-3 py-4 backdrop-blur-xl transition-all duration-300',
          // Desktop: sticky sidebar
          'md:sticky md:top-0 md:z-30',
          railCollapsed ? 'md:w-[84px]' : 'md:w-[260px]',
          // Mobile: fixed overlay drawer, hidden by default
          'fixed top-0 left-0 z-50 w-[280px]',
          mobileRailOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <div className={[
          'px-1 pb-5',
          railCollapsed ? 'flex flex-col items-center gap-2' : 'flex items-center justify-between gap-3',
        ].join(' ')}>
          <div className="flex min-w-0 items-center gap-3 overflow-hidden">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-card border border-accent/25 bg-accentSoft text-accent">
              <ScanEye className="h-5 w-5" />
            </div>
            {!railCollapsed ? (
              <div className="min-w-0">
                <div className="eyebrow text-muted">MirrorWorld</div>
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
            className="hidden h-9 w-9 shrink-0 place-items-center rounded-btn border border-line bg-panel text-muted transition hover:border-accent/40 hover:text-accent md:grid"
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
                      || (route.path === '/consumer-twins' && location.pathname.startsWith('/persona/'))
                      || isActive
                      ? 'border-accent/35 bg-accentSoft text-text'
                      : 'border-transparent bg-transparent text-muted hover:border-line hover:bg-panel hover:text-text',
                    railCollapsed ? 'md:justify-center' : 'justify-start',
                  ].join(' ')
                }
                title={route.label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {showLabels ? (
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

        <div className="mt-auto border-t border-line pt-3">
          <button
            type="button"
            onClick={toggleTheme}
            className={[
              'mb-3 flex w-full items-center gap-3 rounded-card border border-transparent px-3 py-3 transition hover:border-line hover:bg-panel',
              railCollapsed && !mobileRailOpen ? 'justify-center' : 'justify-start',
            ].join(' ')}
            title={theme === 'light' ? '切换深色模式' : '切换浅色模式'}
            aria-label={theme === 'light' ? '切换深色模式' : '切换浅色模式'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 shrink-0 text-muted" />
            ) : (
              <Sun className="h-5 w-5 shrink-0 text-muted" />
            )}
            {showLabels ? (
              <span className="text-sm font-medium text-muted">
                {theme === 'light' ? '深色模式' : '浅色模式'}
              </span>
            ) : null}
          </button>
          <UserStatusArea collapsed={railCollapsed && !mobileRailOpen} />
        </div>
      </aside>
    </>
  );
}
