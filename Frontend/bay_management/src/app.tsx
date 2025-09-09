import { AppProviders } from '@/components/app-providers.tsx'
import { RouteObject, useRoutes } from 'react-router'
import { lazy } from 'react'
import { Layout } from '@/shared/components/layout/Layout'
import { AdminGuard } from '@/components/AdminGuard'

const LazyHomePage = lazy(() => import('@/pages/HomePage').then((module) => ({ default: module.HomePage })))
const LazyProfilePage = lazy(() => import('@/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const LazyAdminSessionPage = lazy(() =>
  import('@/pages/AdminSessionPage').then((module) => ({ default: module.AdminSessionPage })),
)
const LazyCheckInPage = lazy(() => import('@/pages/CheckInPage').then((module) => ({ default: module.CheckInPage })))

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <LazyHomePage /> },
      { path: 'profile', element: <LazyProfilePage /> },
      {
        path: 'admin/session',
        element: (
          <AdminGuard>
            <LazyAdminSessionPage />
          </AdminGuard>
        ),
      },
      { path: 'checkin', element: <LazyCheckInPage /> },
    ],
  },
]

export function App() {
  const router = useRoutes(routes)
  return <AppProviders>{router}</AppProviders>
}
