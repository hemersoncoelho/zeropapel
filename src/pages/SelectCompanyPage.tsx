import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ChevronRight, FileText, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAdmin } from '../contexts/AdminContext'
import { formatDocument, getInitials } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import type { UserCompany } from '../types/database'

export function SelectCompanyPage() {
  const { companies, activeCompany, setActiveCompany, signOut, profile, sessionState } = useAuth()
  const { isAdmin, isCheckingAdmin } = useAdmin()
  const navigate = useNavigate()

  // Perform automatic selections ONLY if it makes sense.
  // DO NOT force admins back to /admin here, because they might be here deliberately to pick a company.
  useEffect(() => {
    // Wait for hydration
    if (sessionState !== 'authenticated' || isCheckingAdmin) return

    // If exactly 1 company and nothing selected yet, auto-select and proceed
    if (companies.length === 1 && !activeCompany) {
      setActiveCompany(companies[0])
      navigate('/dashboard', { replace: true })
    }
    
    // If they have > 1 company, we let them pick.
    // If they are an admin, we just let them stay on the page.
    // We trust RootRedirect in App.tsx to handle the initial post-login routing.
  }, [sessionState, isCheckingAdmin, companies, activeCompany, setActiveCompany, navigate])

  const handleSelectCompany = (company: UserCompany) => {
    setActiveCompany(company)
    navigate('/dashboard', { replace: true })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  if (sessionState === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spinner size={28} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      <div className="noise-overlay" />

      {/* Background blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-stone-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-[480px] animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-900 rounded-xl mb-4">
            <FileText size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl font-bold text-stone-900 tracking-tight">
            Zero<span className="text-rose-600">Papel</span>
          </h1>
          {profile?.full_name && (
            <p className="text-sm text-stone-500 mt-1">
              Olá, <strong className="text-stone-700">{profile.full_name.split(' ')[0]}</strong>. Escolha uma empresa para continuar.
            </p>
          )}
        </div>

        {/* Company list */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm shadow-stone-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-700">Suas empresas</h2>
            <p className="text-xs text-stone-400 mt-0.5">{companies.length} empresa{companies.length !== 1 ? 's' : ''} vinculada{companies.length !== 1 ? 's' : ''}</p>
          </div>

          {companies.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Building2 size={20} className="text-stone-400" />
              </div>
              <p className="text-sm font-medium text-stone-600">Nenhuma empresa vinculada</p>
              <p className="text-xs text-stone-400 mt-1 mb-6">
                Entre em contato com o administrador do sistema.
              </p>
              
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-all shadow-md shadow-rose-600/20"
                >
                  Acessar Gestão da Plataforma
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {companies.map(company => (
                <button
                  key={company.id}
                  onClick={() => handleSelectCompany(company)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors group text-left"
                >
                  {/* Logo/Avatar */}
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {getInitials(company.name)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{company.name}</p>
                    {company.document && (
                      <p className="text-xs text-stone-400 font-mono">{formatDocument(company.document)}</p>
                    )}
                  </div>

                  {/* Role badge */}
                  <Badge role={company.role} />

                  {/* Arrow */}
                  <ChevronRight
                    size={16}
                    className="text-stone-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all shrink-0"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sign out link */}
        <div className="mt-4 text-center">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={14} />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
