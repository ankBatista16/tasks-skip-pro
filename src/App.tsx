import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { StoreProvider, useStore } from '@/context/StoreContext'
import Layout from '@/components/Layout'
import LoginPage from '@/pages/LoginPage'
import Index from '@/pages/Index'
import NotFound from '@/pages/NotFound'
import ProjectsPage from '@/pages/projects/ProjectsPage'
import ProjectDetailsPage from '@/pages/projects/ProjectDetailsPage'
import UsersPage from '@/pages/users/UsersPage'
import CompaniesPage from '@/pages/companies/CompaniesPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'

// Permission Guard
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: JSX.Element
  allowedRoles?: string[]
}) => {
  const { state } = useStore()

  if (!state.currentUser) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(state.currentUser.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

const AppRoutes = () => {
  const { state } = useStore()

  return (
    <Routes>
      <Route
        path="/login"
        element={state.currentUser ? <Navigate to="/" /> : <LoginPage />}
      />

      <Route element={<Layout />}>
        <Route path="/" element={<Index />} />

        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['MASTER', 'ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/companies"
          element={
            <ProtectedRoute allowedRoles={['MASTER']}>
              <CompaniesPage />
            </ProtectedRoute>
          }
        />

        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <StoreProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </StoreProvider>
  </BrowserRouter>
)

export default App
