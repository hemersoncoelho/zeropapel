import { useAuth } from '../contexts/AuthContext'
import { ROLE_PERMISSIONS } from '../types/database'
import type { CompanyRole } from '../types/database'

// Role hierarchy for "at least X role" checks
const ROLE_HIERARCHY: Record<CompanyRole, number> = {
  viewer:  1,
  finance: 2,
  manager: 3,
  admin:   4,
  owner:   5,
}

interface PermissionHook {
  can: (action: string) => boolean
  hasRole: (minRole: CompanyRole) => boolean
  isOwner: boolean
  isAdmin: boolean
  isReadOnly: boolean
}

export function usePermission(): PermissionHook {
  const { companyRole } = useAuth()

  const can = (action: string): boolean => {
    if (!companyRole) return false
    return ROLE_PERMISSIONS[companyRole]?.includes(action) ?? false
  }

  const hasRole = (minRole: CompanyRole): boolean => {
    if (!companyRole) return false
    return ROLE_HIERARCHY[companyRole] >= ROLE_HIERARCHY[minRole]
  }

  return {
    can,
    hasRole,
    isOwner:   companyRole === 'owner',
    isAdmin:   companyRole === 'admin' || companyRole === 'owner',
    isReadOnly: companyRole === 'viewer',
  }
}
