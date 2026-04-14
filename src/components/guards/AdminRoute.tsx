import { Navigate } from 'react-router-dom'
import { useAdmin } from '../../contexts/AdminContext'
import { PageSpinner } from '../ui/Spinner'

interface Props {
  children: React.ReactNode
}

/**
 * Protects admin-only routes.
 * Redirects to /dashboard if user is not a platform admin.
 */
export function AdminRoute({ children }: Props) {
  const { isAdmin, isCheckingAdmin } = useAdmin()

  if (isCheckingAdmin) return <PageSpinner />
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
