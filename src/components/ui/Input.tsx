import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export function Input({
  label,
  error,
  hint,
  icon,
  iconRight,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-stone-600 uppercase tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
            {icon}
          </span>
        )}

        <input
          id={inputId}
          className={`
            w-full min-h-[44px] h-12 rounded-lg border bg-white px-3 text-base text-stone-900
            placeholder:text-stone-400 transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500
            disabled:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-400
            sm:min-h-0 sm:h-10 sm:text-sm
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-stone-300 hover:border-stone-400'}
            ${icon ? 'pl-10 sm:pl-10' : 'pl-3'}
            ${iconRight ? 'pr-10 sm:pr-10' : 'pr-3'}
            ${className}
          `}
          {...props}
        />

        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
            {iconRight}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  )
}
