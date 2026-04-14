import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: number
  className?: string
}

export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return (
    <Loader2
      size={size}
      className={`animate-spin text-rose-600 ${className}`}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="flex flex-col items-center gap-4">
        <Spinner size={32} />
        <p className="text-sm text-stone-400 font-mono">Carregando...</p>
      </div>
    </div>
  )
}
