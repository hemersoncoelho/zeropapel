import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Users,
  Repeat2,
  BarChart3,
  Tag,
  Settings,
  LogOut,
  Building2,
  ChevronsUpDown,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermission } from '../../hooks/usePermission'
import { useAdmin } from '../../contexts/AdminContext'
import { getInitials } from '../../lib/utils'

const NAV_MAIN = [
  { to: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/lancamentos',  label: 'Lançamentos',    icon: ArrowLeftRight },
  { to: '/accounts',     label: 'Contas Bancárias', icon: Wallet },
  { to: '/contacts',     label: 'Contatos',       icon: Users },
  { to: '/transfers',    label: 'Transferências',  icon: Repeat2 },
  { to: '/reports',      label: 'Relatórios',     icon: BarChart3 },
]

const NAV_ADMIN = [
  { to: '/categories',   label: 'Categorias',     icon: Tag, minRole: 'admin' as const },
  { to: '/users',        label: 'Usuários',       icon: Users, minRole: 'admin' as const },
  { to: '/settings',     label: 'Configurações',  icon: Settings, minRole: 'admin' as const },
]

export function Sidebar() {
  const { profile, activeCompany, companies, signOut } = useAuth()
  const { hasRole } = usePermission()
  const { isAdmin } = useAdmin()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const adminNavItems = NAV_ADMIN.filter(item => hasRole(item.minRole))

  return (
    <aside className="w-[240px] min-w-[240px] h-screen bg-white border-r border-stone-200 flex flex-col sticky top-0 overflow-hidden">

      {/* ── Logo ── */}
      <div className="px-4 py-4 border-b border-stone-100 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center shrink-0">
          <FileText size={16} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="font-display font-semibold text-base text-stone-900 tracking-tight">
            Zero<span className="text-rose-600">Papel</span>
          </span>
        </div>
      </div>

      {/* ── Active Company Selector ── */}
      {activeCompany && (
        <div className="px-3 pt-3 pb-2">
          {companies.length > 1 ? (
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 hover:border-stone-300 hover:bg-stone-100 transition-all group"
              onClick={() => navigate('/select-company')}
            >
              <div className="w-7 h-7 rounded-md bg-rose-100 flex items-center justify-center shrink-0">
                <Building2 size={14} className="text-rose-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-stone-800 truncate">{activeCompany.name}</p>
              </div>
              <ChevronsUpDown size={13} className="text-stone-400 group-hover:text-stone-600 shrink-0" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-stone-50 border border-stone-200">
              <div className="w-7 h-7 rounded-md bg-rose-100 flex items-center justify-center shrink-0">
                <Building2 size={14} className="text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-800 truncate">{activeCompany.name}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Main Navigation ── */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <div className="space-y-0.5">
          {NAV_MAIN.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={16} strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        {adminNavItems.length > 0 && (
          <>
            <div className="mt-4 mb-2 px-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                Administração
              </span>
            </div>
            <div className="space-y-0.5">
              {adminNavItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={16} strokeWidth={1.75} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </>
        )}

        {/* Platform admin link */}
        {isAdmin && (
          <>
            <div className="mt-4 mb-2 px-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                Plataforma
              </span>
            </div>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <ShieldCheck size={16} strokeWidth={1.75} />
              <span>Gestão</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* ── User Footer ── */}
      <div className="px-3 py-3 border-t border-stone-100">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-stone-50 transition-colors group">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {profile?.full_name ? getInitials(profile.full_name) : '?'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-800 truncate">
              {profile?.full_name ?? 'Usuário'}
            </p>
            <p className="text-[10px] text-stone-400 truncate">{profile?.email}</p>
          </div>

          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
