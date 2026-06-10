import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Building2, FileText, LayoutDashboard, LayoutGrid, LogOut, Menu, ShieldCheck, Users, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getInitials } from '../../lib/utils'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut, activeCompany } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const closeMobile = () => setMobileOpen(false)

  const aside = (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(280px,92vw)] flex-col border-r border-white/[0.06] bg-stone-950 shadow-xl transition-transform duration-200 ease-out
        lg:static lg:z-auto lg:h-screen lg:w-[220px] lg:min-w-[220px] lg:translate-x-0 lg:shadow-none
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-4 lg:justify-start">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-600">
            <FileText size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <span className="font-display text-sm font-semibold tracking-tight text-white">
              ZeroPapel
            </span>
            <div className="mt-0.5 flex items-center gap-1">
              <ShieldCheck size={10} className="text-rose-400" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-rose-400">Plataforma</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-white/[0.08] hover:text-white lg:hidden"
          aria-label="Fechar menu"
          onClick={closeMobile}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        <NavLink
          to="/admin"
          end
          onClick={closeMobile}
          className={({ isActive }) =>
            `admin-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <LayoutDashboard size={15} strokeWidth={1.75} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/admin/companies"
          onClick={closeMobile}
          className={({ isActive }) =>
            `admin-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <LayoutGrid size={15} strokeWidth={1.75} />
          <span>Empresas</span>
        </NavLink>
        <NavLink
          to="/admin/members"
          onClick={closeMobile}
          className={({ isActive }) =>
            `admin-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <Users size={15} strokeWidth={1.75} />
          <span>Usuários</span>
        </NavLink>
      </nav>

      <div className="border-t border-white/[0.06] px-3 py-2">
        <button
          type="button"
          onClick={() => { navigate(activeCompany ? '/dashboard' : '/select-company'); closeMobile() }}
          className="flex w-full min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-400 transition-all hover:bg-white/[0.06] hover:text-white lg:min-h-0"
        >
          <Building2 size={15} />
          <span>Voltar ao app</span>
        </button>
      </div>

      <div className="border-t border-white/[0.06] px-3 py-3">
        <div className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.06]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-[10px] font-bold text-white">
            {profile?.full_name ? getInitials(profile.full_name) : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-stone-200">{profile?.full_name ?? 'Admin'}</p>
            <p className="truncate text-[10px] text-stone-500">{profile?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-red-900/20 hover:text-red-400 lg:h-9 lg:w-9 lg:opacity-0 lg:group-hover:opacity-100"
            title="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] min-w-0 overflow-hidden bg-stone-950">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] lg:hidden"
          onClick={closeMobile}
        />
      )}

      {aside}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 min-h-[56px] shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#0f0f0f] px-3 lg:hidden">
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>
          <span className="truncate text-sm font-semibold text-white">Administração</span>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#0f0f0f] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {children}
        </main>
      </div>
    </div>
  )
}
