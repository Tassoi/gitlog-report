import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { Dashboard } from './pages/Dashboard';
import { Repos } from './pages/Repos';
import { Commits } from './pages/Commits';
import { Reports } from './pages/Reports';
import { ReportsNew } from './pages/ReportsNew';
import { Templates } from './pages/Templates';
import { SettingsPage } from './pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'repos',
        element: <Repos />,
      },
      {
        path: 'commits',
        element: <Commits />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'reports/new',
        element: <ReportsNew />,
      },
      {
        path: 'templates',
        element: <Templates />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
]);
