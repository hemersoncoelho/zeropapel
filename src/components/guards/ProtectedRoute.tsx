import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface Props {
  children: React.ReactNode
}

/**
 * Redirect to /login if not authenticated.
 * Redirect authenticated users away from /login.
 */
export function ProtectedRoute({ children }: Props) {
  const { sessionState } = useAuth()
  const location = useLocation()

  if (sessionState === 'loading') {
    return null // AppLoader handles this at root level
  }

  if (sessionState === 'unauthenticated' || sessionState === 'expired') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

/**
 * Redirect authenticated users away from public pages (login)
 */
export function PublicOnlyRoute({ children }: Props) {
  const { sessionState } = useAuth()

  if (sessionState === 'loading') return null

  if (sessionState === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
