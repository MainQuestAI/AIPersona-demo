import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  type RouteObject,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useEffect, useState } from 'react';

import { AppShell } from './layout/app-shell';
import { CalibrationCenterPage } from './pages/calibration-center-page';
import { ComparePlaceholder } from './pages/compare-placeholder';
import { ConsumerTwinsPage } from './pages/consumer-twins-page';
import { DashboardPage } from './pages/dashboard-page';
import { LoginPage } from './pages/login-page';
import { PersonaChatPage } from './pages/persona-chat-page';
import { SagePage } from './pages/sage-page';
import { StudiesPage } from './pages/studies-page';
import { StudyDetailLayout } from './pages/study-detail-layout';
import { StimulusLibraryPage } from './pages/stimulus-library-page';
import { TwinsPlaceholder } from './pages/twins-placeholder';
import { WorkbenchPlaceholder } from './pages/workbench-placeholder';
import { clearAuthSession, fetchAuthSession, persistAuthSession } from './services/auth-session';

function RequireAuth() {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  if (typeof window === 'undefined') {
    return <AppShell />;
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await fetchAuthSession();
        if (cancelled) {
          return;
        }
        if (session) {
          persistAuthSession(session);
          setAuthenticated(true);
        } else {
          clearAuthSession();
          setAuthenticated(false);
        }
      } catch {
        if (!cancelled) {
          clearAuthSession();
          setAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-text">
        <div className="rounded-panel border border-line bg-panel px-5 py-4 text-sm text-muted shadow-panel">
          正在检查登录状态…
        </div>
      </div>
    );
  }

  if (!authenticated) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return <AppShell />;
}

function WorkbenchCompatRedirect() {
  const { studyId = '' } = useParams();
  return <Navigate to={studyId ? `/studies/${encodeURIComponent(studyId)}/workbench` : '/studies'} replace />;
}

function SearchStudyRedirect({ view }: { view: 'compare' | 'twins' | 'workbench' }) {
  const [searchParams] = useSearchParams();
  const studyId = searchParams.get('studyId');
  if (!studyId) {
    return <Navigate to="/studies" replace />;
  }
  return <Navigate to={`/studies/${encodeURIComponent(studyId)}/${view}`} replace />;
}

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'studies',
        children: [
          {
            index: true,
            element: <StudiesPage />,
          },
          {
            path: ':studyId',
            element: <StudyDetailLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="workbench" replace />,
              },
              {
                path: 'workbench',
                element: <WorkbenchPlaceholder />,
              },
              {
                path: 'compare',
                element: <ComparePlaceholder />,
              },
              {
                path: 'twins',
                element: <TwinsPlaceholder />,
              },
            ],
          },
        ],
      },
      {
        path: 'consumer-twins',
        element: <ConsumerTwinsPage />,
      },
      {
        path: 'persona/:twinId/chat',
        element: <PersonaChatPage />,
      },
      {
        path: 'stimulus-library',
        element: <StimulusLibraryPage />,
      },
      {
        path: 'calibration-center',
        element: <CalibrationCenterPage />,
      },
      {
        path: 'sage',
        element: <SagePage />,
      },
      {
        path: 'workbench',
        element: <SearchStudyRedirect view="workbench" />,
      },
      {
        path: 'workbench/:studyId',
        element: <WorkbenchCompatRedirect />,
      },
      {
        path: 'compare',
        element: <SearchStudyRedirect view="compare" />,
      },
      {
        path: 'twins',
        element: <SearchStudyRedirect view="twins" />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}

export function AppRouter() {
  return <RouterProvider router={createAppRouter()} />;
}
