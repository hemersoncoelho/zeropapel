import type { CompanyRole } from '../../types/database'
import { ROLE_LABELS, ROLE_COLORS } from '../../types/database'

interface BadgeProps {
  children?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'role'
  role?: CompanyRole
  className?: string
}

const variantClasses = {
  default: 'bg-stone-100 text-stone-600',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-700',
  role:    '',
}

export function Badge({ children, variant = 'default', role, className = '' }: BadgeProps) {
  const colorClass = role ? ROLE_COLORS[role] : variantClasses[variant]
  const label = role ? ROLE_LABELS[role] : children

  return (
    <span className={`badge ${colorClass} ${className}`}>
      {label}
    </span>
  )
}
