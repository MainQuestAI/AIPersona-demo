import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { APP_ROUTES, STUDY_DETAIL_VIEWS } from '@/types/route';
import { useLatestStudySession } from '../hooks/useLatestStudySession';
import { useShellUiStore } from '../providers';
import { buildStudyRoute } from '../services/studyRuntimeViews';
import { getActiveStudyId } from '../services/studySession';
import { GlobalRail } from './global-rail';
import { ToastContainer } from './toast-container';

function getRouteMeta(pathname: string) {
  if (pathname.startsWith('/studies/')) {
    return {
      label: '研究详情',
    };
  }
  const normalized = pathname === '/' ? '/dashboard' : pathname;
  return APP_ROUTES.find((route) => route.path === normalized) ?? APP_ROUTES[0];
}

type AppShellProps = {
  children?: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const routeMeta = getRouteMeta(location.pathname);
  const studyId = getActiveStudyId(location.pathname, location.search);
  const latestStudy = useLatestStudySession();
  const setMobileRailOpen = useShellUiStore((state) => state.setMobileRailOpen);

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* MQDS Ambient Light Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Top-right warm orb */}
        <div
          className="absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            top: '-8%',
            right: '-4%',
            background: 'radial-gradient(circle, var(--color-action-soft) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        {/* Bottom-left cool orb */}
        <div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            bottom: '5%',
            left: '8%',
            background: 'radial-gradient(circle, var(--color-accent-soft) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        {/* Center-top neutral wash */}
        <div
          className="absolute rounded-full"
          style={{
            width: 800,
            height: 800,
            top: '-15%',
            left: '30%',
            background: 'radial-gradient(circle, var(--color-neutral-wash) 0%, transparent 70%)',
            filter: 'blur(120px)',
          }}
        />
      </div>

      <div className="relative flex min-h-screen">
        <GlobalRail />
        <div className="flex h-screen flex-1 flex-col overflow-hidden">
          <header className="flex-none border-b border-line bg-bg/80 backdrop-blur-xl z-20">
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileRailOpen(true)}
                  className="grid md:hidden h-9 w-9 place-items-center rounded-btn border border-line bg-panel text-muted transition hover:text-text"
                  aria-label="打开导航"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="eyebrow text-tertiary hidden sm:block">MirrorWorld</div>
                <h1 className="text-lg font-semibold tracking-[-0.02em] text-text">
                  {routeMeta.label}
                </h1>
              </div>
            </div>
            {studyId ? (
              <div className="border-t border-line px-6 py-3 sm:px-8">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-btn border border-accent/30 bg-accentSoft px-3 py-1 eyebrow text-accent">
                    研究进行中
                  </div>
                  {latestStudy?.businessQuestion ? (
                    <div className="max-w-xs truncate text-sm text-muted">
                      {latestStudy.businessQuestion}
                    </div>
                  ) : null}
                  {location.pathname.startsWith('/studies/') ? (
                    <div className="flex flex-wrap gap-2">
                      {STUDY_DETAIL_VIEWS.map((view) => (
                        <NavLink
                          key={view.key}
                          to={buildStudyRoute(`/${view.key}`, studyId)}
                          className={({ isActive }) =>
                            [
                              'rounded-btn border px-3 py-1 eyebrow transition',
                              isActive
                                ? 'border-accent/35 bg-accentSoft text-text'
                                : 'border-line bg-panel text-muted hover:border-accent/35 hover:text-text',
                            ].join(' ')
                          }
                        >
                          {view.label}
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : latestStudy ? (
              <div className="border-t border-line px-6 py-3 sm:px-8">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-btn border border-accent/30 bg-accentSoft px-3 py-1 eyebrow text-accent">
                    最近研究就绪
                  </div>
                  {latestStudy.businessQuestion ? (
                    <div className="max-w-sm truncate text-sm text-muted">
                      {latestStudy.businessQuestion}
                    </div>
                  ) : null}
                  <NavLink
                    to={buildStudyRoute('/workbench', latestStudy.id)}
                    className="btn-accent"
                  >
                    继续上次研究
                  </NavLink>
                </div>
              </div>
            ) : null}
          </header>
          <main className="flex flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 14, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="flex h-full min-h-full flex-1 flex-col"
              >
                {children ?? <Outlet />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
