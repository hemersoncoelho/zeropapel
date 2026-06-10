import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError(null)

    try {
      await signIn(email, password)
      // AuthContext will update sessionState → redirect happens via PublicOnlyRoute
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login'
      // Translate Supabase messages
      if (message.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.')
      } else if (message.includes('Email not confirmed')) {
        setError('Confirme o seu e-mail antes de entrar.')
      } else if (message.includes('Too many requests')) {
        setError('Muitas tentativas. Aguarde um momento.')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Background blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-stone-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-[400px] animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-900 rounded-xl mb-4">
            <FileText size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl font-bold text-stone-900 tracking-tight">
            Zero<span className="text-rose-600">Papel</span>
          </h1>
          <p className="text-sm text-stone-500 mt-1">Financeiro Multiempresa</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-stone-900">Entrar na sua conta</h2>
            <p className="text-sm text-stone-400 mt-0.5">Informe suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seuemail@empresa.com.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail size={15} />}
              autoComplete="email"
              autoFocus
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              icon={<Lock size={15} />}
              autoComplete="current-password"
              required
            />

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-lg animate-fade-in">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center">
            <button className="text-sm text-stone-400 hover:text-rose-600 transition-colors">
              Esqueceu sua senha?
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-stone-400 mt-6 font-mono">
          ZeroPapel · Financeiro Seguro por RLS
        </p>
      </div>
    </div>
  )
}
