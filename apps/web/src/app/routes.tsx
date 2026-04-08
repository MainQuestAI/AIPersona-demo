import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  type RouteObject,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import { AppShell } from './layout/app-shell';
import { CalibrationCenterPage } from './pages/calibration-center-page';
import { ComparePlaceholder } from './pages/compare-placeholder';
import { ConsumerTwinsPage } from './pages/consumer-twins-page';
import { DashboardPage } from './pages/dashboard-page';
import { StudiesPage } from './pages/studies-page';
import { StudyDetailLayout } from './pages/study-detail-layout';
import { StimulusLibraryPage } from './pages/stimulus-library-page';
import { TwinsPlaceholder } from './pages/twins-placeholder';
import { WorkbenchPlaceholder } from './pages/workbench-placeholder';

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
    element: <AppShell />,
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
        path: 'stimulus-library',
        element: <StimulusLibraryPage />,
      },
      {
        path: 'calibration-center',
        element: <CalibrationCenterPage />,
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
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}

export function AppRouter() {
  return <RouterProvider router={createAppRouter()} />;
}
