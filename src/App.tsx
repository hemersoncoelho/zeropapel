import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AdminProvider, useAdmin } from './contexts/AdminContext'
import { PageSpinner } from './components/ui/Spinner'

// Guards
import { ProtectedRoute, PublicOnlyRoute } from './components/guards/ProtectedRoute'
import { TenantRoute } from './components/guards/TenantRoute'
import { AdminRoute } from './components/guards/AdminRoute'

// Layout
import { AppShell } from './components/layout/AppShell'
import { AdminLayout } from './components/layout/AdminLayout'

// Pages
import { LoginPage } from './pages/LoginPage'
import { SelectCompanyPage } from './pages/SelectCompanyPage'
import { DashboardPage } from './pages/DashboardPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { AccountsPage } from './pages/AccountsPage'
import { ContactsPage } from './pages/ContactsPage'
import { TransfersPage } from './pages/TransfersPage'
import { ReportsPage } from './pages/ReportsPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { UsersPage } from './pages/UsersPage'
import { SettingsPage } from './pages/SettingsPage'
import { AdminCompaniesPage } from './pages/admin/AdminCompaniesPage'
import { AdminCompanyDetailPage } from './pages/admin/AdminCompanyDetailPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminMembersPage } from './pages/admin/AdminMembersPage'

// ── Placeholder pages for nav structure ────────────────────
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-7xl min-w-0 px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h2 className="text-xl font-display font-semibold text-stone-900">{title}</h2>
        <p className="text-sm text-stone-400 mt-0.5">Em desenvolvimento — próximo bloco</p>
      </div>
      <div className="card flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <p className="text-sm font-medium text-stone-600">Módulo em construção</p>
        <p className="text-xs text-stone-400 mt-1 max-w-xs text-center">
          Este módulo será implementado no próximo bloco de desenvolvimento.
        </p>
      </div>
    </div>
  )
}

// ── Root redirect based on session state ───────────────────
function RootRedirect() {
  const { sessionState, activeCompany } = useAuth()
  const { isAdmin, isCheckingAdmin } = useAdmin()

  if (sessionState === 'loading' || isCheckingAdmin) return <PageSpinner />
  if (sessionState === 'unauthenticated' || sessionState === 'expired') {
    return <Navigate to="/login" replace />
  }
  // Platform admins go straight to the admin area
  if (isAdmin) return <Navigate to="/admin" replace />
  if (!activeCompany) return <Navigate to="/select-company" replace />
  return <Navigate to="/dashboard" replace />
}

// ── App ─────────────────────────────────────────────────────
function AppRoutes() {
  const { sessionState } = useAuth()
  const { isCheckingAdmin } = useAdmin()

  // Global loading state (restoring session OR checking admin status)
  if (sessionState === 'loading' || isCheckingAdmin) return <PageSpinner />

  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      {/* Authenticated — company selector */}
      <Route
        path="/select-company"
        element={
          <ProtectedRoute>
            <SelectCompanyPage />
          </ProtectedRoute>
        }
      />

      {/* Authenticated + Tenant — main app */}
      <Route
        element={
          <ProtectedRoute>
            <TenantRoute>
              <AppShell />
            </TenantRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard"    element={<DashboardPage />} />
        <Route path="/lancamentos"  element={<TransactionsPage />} />
        <Route path="/accounts"     element={<AccountsPage />} />
        <Route path="/contacts"     element={<ContactsPage />} />
        <Route path="/transfers"    element={<TransfersPage />} />
        <Route path="/reports"      element={<ReportsPage />} />
        <Route path="/categories"   element={<CategoriesPage />} />
        <Route path="/users"        element={<UsersPage />} />
        <Route path="/settings"     element={<SettingsPage />} />
      </Route>

      {/* Admin platform — protected by AdminRoute */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/companies"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminRoute>
                <AdminCompaniesPage />
              </AdminRoute>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/companies/:id"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminRoute>
                <AdminCompanyDetailPage />
              </AdminRoute>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/members"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminRoute>
                <AdminMembersPage />
              </AdminRoute>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminProvider>
          <AppRoutes />
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
