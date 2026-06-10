import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Building2, Bell, Menu } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Badge } from '../ui/Badge'
import { getInitials } from '../../lib/utils'
import { useEffect, useState } from 'react'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Visão Geral',
  '/lancamentos':  'Lançamentos',
  '/accounts':     'Contas Bancárias',
  '/contacts':     'Contatos',
  '/transfers':    'Transferências',
  '/reports':      'Relatórios',
  '/categories':   'Categorias',
  '/users':        'Usuários',
  '/settings':     'Configurações',
}

type TopbarProps = {
  onOpenNav?: () => void
}

export function Topbar({ onOpenNav }: TopbarProps) {
  const { profile, activeCompany, companyRole, companies, setActiveCompany } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false)

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'ZeroPapel'

  useEffect(() => {
    if (!companyMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCompanyMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [companyMenuOpen])

  return (
    <header className="sticky top-0 z-30 flex h-14 min-h-[56px] shrink-0 items-center gap-2 border-b border-stone-200 bg-white/80 px-3 backdrop-blur-sm sm:gap-4 sm:px-6">

      <button
        type="button"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-700 transition-colors hover:bg-stone-100 focus-ring lg:hidden"
        aria-label="Abrir menu de navegação"
        onClick={onOpenNav}
      >
        <Menu size={22} strokeWidth={1.75} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-stone-900 sm:text-base">{pageTitle}</h1>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">

        {companies.length > 1 && activeCompany && (
          <div className="relative max-w-[min(100%,11rem)] sm:max-w-none">
            <button
              type="button"
              onClick={() => setCompanyMenuOpen(prev => !prev)}
              className="flex max-w-full min-h-[44px] items-center gap-1.5 rounded-xl border border-stone-200 px-2.5 py-2 text-sm transition-all hover:border-stone-300 hover:bg-stone-50 sm:min-h-0 sm:rounded-lg sm:px-3 sm:py-1.5"
            >
              <Building2 size={14} className="shrink-0 text-rose-600" />
              <span className="min-w-0 truncate font-medium text-stone-700">
                {activeCompany.name}
              </span>
              <ChevronDown size={13} className="shrink-0 text-stone-400" />
            </button>

            {companyMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-[min(calc(100vw-1.5rem),16rem)] rounded-xl border border-stone-200 bg-white py-1 shadow-lg shadow-stone-100 animate-slide-up sm:w-56">
                {companies.map(company => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => {
                      setActiveCompany(company)
                      setCompanyMenuOpen(false)
                    }}
                    className={`flex w-full min-h-[44px] items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-stone-50 sm:min-h-0 sm:py-2 ${
                      company.id === activeCompany.id ? 'font-medium text-rose-600' : 'text-stone-700'
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rose-100">
                      <Building2 size={12} className="text-rose-600" />
                    </div>
                    <span className="min-w-0 truncate">{company.name}</span>
                    {company.id === activeCompany.id && (
                      <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" />
                    )}
                  </button>
                ))}
                <div className="mt-1 border-t border-stone-100 pt-1">
                  <button
                    type="button"
                    onClick={() => { navigate('/select-company'); setCompanyMenuOpen(false) }}
                    className="w-full px-3 py-2.5 text-left text-xs text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-600 sm:py-2"
                  >
                    Gerenciar empresas →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {companyRole && (
          <Badge role={companyRole} />
        )}

        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 sm:h-10 sm:w-10 sm:rounded-lg"
          aria-label="Notificações"
        >
          <Bell size={16} />
        </button>

        <div className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-xs font-bold text-white">
          {profile?.full_name ? getInitials(profile.full_name) : '?'}
        </div>
      </div>
    </header>
  )
}
