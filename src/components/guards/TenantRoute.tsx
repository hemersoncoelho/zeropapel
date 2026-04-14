import { Navigate, useNavigate } from 'react-router-dom'
import { Building2, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useAdmin } from '../../contexts/AdminContext'

interface Props {
  children: React.ReactNode
}

/**
 * Requires an active company to be set.
 * If authenticated but no company selected, check roles:
 * - If Admin: Show a fallback component telling them they need a company to view the tenant app.
 * - If regular user: Redirect to /select-company.
 */
export function TenantRoute({ children }: Props) {
  const { sessionState, activeCompany } = useAuth()
  const { isAdmin, isCheckingAdmin } = useAdmin()
  const navigate = useNavigate()

  // Wait for both auth and admin context to hydrate
  if (sessionState === 'loading' || isCheckingAdmin) return null

  // If we have an active company, render the tenant app normally
  if (activeCompany) return <>{children}</>

  // We DO NOT have an active company.
  // Standard users are forced to select a company
  if (!isAdmin) {
    return <Navigate to="/select-company" replace />
  }

  // Admins who wander into a tenant route without an active company get a polite fallback
  // instead of a harsh redirect back to /select-company, which creates loops.
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
      <div className="bg-[#141414] border border-white/[0.08] p-8 rounded-2xl w-full max-w-md text-center shadow-2xl">
        <div className="w-16 h-16 bg-rose-900/40 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Building2 size={24} className="text-rose-400" />
        </div>
        
        <h2 className="text-xl font-display font-semibold text-white mb-2">Acesso Restrito</h2>
        <p className="text-sm text-stone-400 mb-8">
          Você é um <strong>Platform Admin</strong>, mas tentou acessar uma rota restrita de empresas.<br/><br/>
          Para visualizar este módulo, você precisa selecionar uma empresa para visualizar (Modo Suporte).
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-all shadow-lg"
          >
            <ArrowLeft size={16} />
            Voltar à Gestão da Plataforma
          </button>
          
          <button
            onClick={() => navigate('/select-company')}
            className="w-full py-3 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-lg text-sm transition-colors"
          >
            Selecionar uma Empresa
          </button>
        </div>
      </div>
    </div>
  )
}
