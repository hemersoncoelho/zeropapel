import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Building2, Bell } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Badge } from '../ui/Badge'
import { getInitials } from '../../lib/utils'
import { useState } from 'react'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/transactions': 'Lançamentos',
  '/accounts':     'Contas Bancárias',
  '/contacts':     'Contatos',
  '/transfers':    'Transferências',
  '/reports':      'Relatórios',
  '/categories':   'Categorias',
  '/users':        'Usuários',
  '/settings':     'Configurações',
}

export function Topbar() {
  const { profile, activeCompany, companyRole, companies, setActiveCompany } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false)

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'ZeroPapel'

  return (
    <header className="h-14 border-b border-stone-200 bg-white/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-40">

      {/* ── Page Title ── */}
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-stone-900">{pageTitle}</h1>
      </div>

      {/* ── Actions group ── */}
      <div className="flex items-center gap-3">

        {/* Company Switcher (if multiple) */}
        {companies.length > 1 && activeCompany && (
          <div className="relative">
            <button
              onClick={() => setCompanyMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all text-sm"
            >
              <Building2 size={14} className="text-rose-600" />
              <span className="font-medium text-stone-700 max-w-[160px] truncate">
                {activeCompany.name}
              </span>
              <ChevronDown size={13} className="text-stone-400" />
            </button>

            {companyMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-stone-200 rounded-xl shadow-lg shadow-stone-100 py-1 z-50 animate-slide-up">
                {companies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setActiveCompany(company)
                      setCompanyMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-stone-50 transition-colors ${
                      company.id === activeCompany.id ? 'text-rose-600 font-medium' : 'text-stone-700'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-md bg-rose-100 flex items-center justify-center shrink-0">
                      <Building2 size={12} className="text-rose-600" />
                    </div>
                    <span className="truncate">{company.name}</span>
                    {company.id === activeCompany.id && (
                      <span className="ml-auto w-1.5 h-1.5 bg-rose-600 rounded-full shrink-0" />
                    )}
                  </button>
                ))}
                <div className="border-t border-stone-100 mt-1 pt-1">
                  <button
                    onClick={() => { navigate('/select-company'); setCompanyMenuOpen(false) }}
                    className="w-full text-left px-3 py-2 text-xs text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Gerenciar empresas →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Role badge */}
        {companyRole && (
          <Badge role={companyRole} />
        )}

        {/* Notifications (placeholder) */}
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors relative">
          <Bell size={16} />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
          {profile?.full_name ? getInitials(profile.full_name) : '?'}
        </div>
      </div>
    </header>
  )
}
