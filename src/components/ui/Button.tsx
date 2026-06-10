import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-200 disabled:bg-rose-300',
  secondary: 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 hover:border-stone-400',
  ghost:     'text-stone-500 hover:text-stone-900 hover:bg-stone-100',
  danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
}

/* Mobile-first: larger touch targets by default; compact from sm breakpoint up */
const sizeClasses: Record<Size, string> = {
  sm: 'min-h-[44px] h-11 px-4 text-sm gap-2 sm:min-h-0 sm:h-8 sm:px-3 sm:text-xs sm:gap-1.5',
  md: 'min-h-[44px] h-11 px-5 text-base gap-2 sm:min-h-0 sm:h-9 sm:px-4 sm:text-sm',
  lg: 'min-h-[48px] h-12 px-6 text-base gap-2 sm:min-h-0 sm:h-11 sm:px-6 sm:text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-150 focus-ring
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
