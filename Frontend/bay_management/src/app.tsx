import { AppProviders } from '@/components/app-providers.tsx'
import { RouteObject, useRoutes } from 'react-router'
import { lazy } from 'react'
import { Layout } from '@/shared/components/layout/Layout'
import { AdminGuard } from '@/components/AdminGuard'

const LazyHomePage = lazy(() => import('@/pages/HomePage').then(module => ({ default: module.HomePage })))
const LazyAttendancePage = lazy(() => import('@/pages/AttendancePage').then(module => ({ default: module.AttendancePage })))
const LazyProfilePage = lazy(() => import('@/pages/ProfilePage').then(module => ({ default: module.ProfilePage })))
const LazyPointsPage = lazy(() => import('@/pages/PointsPage').then(module => ({ default: module.PointsPage })))
const LazyAdminSessionPage = lazy(() => import('@/pages/AdminSessionPage').then(module => ({ default: module.AdminSessionPage })))
const LazyCheckInPage = lazy(() => import('@/pages/CheckInPage').then(module => ({ default: module.CheckInPage })))

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <LazyHomePage /> },
      { path: 'attendance', element: <LazyAttendancePage /> },
      { path: 'profile', element: <LazyProfilePage /> },
      { path: 'points', element: <LazyPointsPage /> },
      { path: 'admin/session', element: <AdminGuard><LazyAdminSessionPage /></AdminGuard> },
      { path: 'checkin', element: <LazyCheckInPage /> },
    ],
  },
]

export function App() {
  const router = useRoutes(routes)
  return (
    <AppProviders>
      {router}
    </AppProviders>
  )
}
