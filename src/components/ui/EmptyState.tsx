import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4">
          <Icon size={22} className="text-stone-400" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-stone-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-stone-400 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}
