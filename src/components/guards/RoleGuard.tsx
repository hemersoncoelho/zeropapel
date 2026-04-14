import { usePermission } from '../../hooks/usePermission'
import type { CompanyRole } from '../../types/database'

interface Props {
  children: React.ReactNode
  minRole?: CompanyRole
  action?: string
  fallback?: React.ReactNode
}

/**
 * Conditionally renders children based on role/permission.
 * Does NOT redirect — use for inline show/hide of UI elements.
 */
export function RoleGuard({ children, minRole, action, fallback = null }: Props) {
  const { can, hasRole } = usePermission()

  const allowed = (() => {
    if (minRole && !hasRole(minRole)) return false
    if (action && !can(action)) return false
    return true
  })()

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}
