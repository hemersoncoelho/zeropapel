import { NavLink, useNavigate } from 'react-router-dom'
import { Building2, FileText, LayoutDashboard, LayoutGrid, LogOut, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getInitials } from '../../lib/utils'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut, activeCompany } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-stone-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] min-w-[220px] h-screen bg-stone-950 border-r border-white/[0.06] flex flex-col sticky top-0">

        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
          <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center shrink-0">
            <FileText size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-display font-semibold text-sm text-white tracking-tight">
              ZeroPapel
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck size={10} className="text-rose-400" />
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest">Plataforma</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <LayoutDashboard size={15} strokeWidth={1.75} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/companies"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <LayoutGrid size={15} strokeWidth={1.75} />
            <span>Empresas</span>
          </NavLink>
          <NavLink
            to="/admin/members"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Users size={15} strokeWidth={1.75} />
            <span>Usuários</span>
          </NavLink>
        </nav>

        {/* Back to app */}
        <div className="px-3 py-2 border-t border-white/[0.06]">
          <button
            onClick={() => navigate(activeCompany ? '/dashboard' : '/select-company')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/[0.06] transition-all text-sm"
          >
            <Building2 size={15} />
            <span>Voltar ao app</span>
          </button>
        </div>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.06] transition-colors group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {profile?.full_name ? getInitials(profile.full_name) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-stone-200 truncate">{profile?.full_name ?? 'Admin'}</p>
              <p className="text-[10px] text-stone-500 truncate">{profile?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-md text-stone-500 hover:text-red-400 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
              title="Sair"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-[#0f0f0f]">
        {children}
      </main>
    </div>
  )
}
