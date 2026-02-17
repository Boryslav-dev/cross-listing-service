import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute } from './routes/GuestRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { ForgotPasswordPage } from './pages/ForgotPassword'
import { ResetPasswordPage } from './pages/ResetPassword'
import { EmailVerifiedPage } from './pages/EmailVerified'
import { AppLayout } from './components/layout/AppLayout'
import { WorkspaceProvider } from './workspaces/WorkspaceProvider'
import { WorkspaceListPage } from './pages/workspaces/WorkspaceListPage'
import { WorkspaceMembersPage } from './pages/workspaces/WorkspaceMembersPage'
import { WorkspaceAuditPage } from './pages/workspaces/WorkspaceAuditPage'

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        }
      />

      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPasswordPage />
          </GuestRoute>
        }
      />

      <Route path="/email-verified" element={<EmailVerifiedPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <WorkspaceProvider>
              <AppLayout />
            </WorkspaceProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/workspaces" replace />} />
        <Route path="workspaces" element={<WorkspaceListPage />} />
        <Route path="workspaces/:id" element={<Navigate to="members" replace />} />
        <Route path="workspaces/:id/members" element={<WorkspaceMembersPage />} />
        <Route path="workspaces/:id/audit" element={<WorkspaceAuditPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App
