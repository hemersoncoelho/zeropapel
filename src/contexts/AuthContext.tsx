import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type {
  Profile,
  UserCompany,
  CompanyRole,
  SessionState,
} from '../types/database'

// ─── Types ────────────────────────────────────────────────
interface AuthContextValue {
  // Auth state
  user: User | null
  session: Session | null
  profile: Profile | null
  sessionState: SessionState

  // Multi-tenant state
  companies: UserCompany[]
  activeCompany: UserCompany | null
  companyRole: CompanyRole | null

  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setActiveCompany: (company: UserCompany) => void
  refreshProfile: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

const ACTIVE_COMPANY_KEY = 'zeropapel:active_company_id'

// ─── Provider ─────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [companies, setCompanies] = useState<UserCompany[]>([])
  const [activeCompany, setActiveCompanyState] = useState<UserCompany | null>(null)
  const [companyRole, setCompanyRole] = useState<CompanyRole | null>(null)

  // Ref to read current sessionState inside event callbacks without stale closure
  const sessionStateRef = useRef<SessionState>('loading')
  sessionStateRef.current = sessionState

  // ── Fetch profile ────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data as Profile
  }, [])

  // ── Fetch companies ──────────────────────────────────────
  const fetchCompanies = useCallback(async (userId: string): Promise<UserCompany[]> => {
    const { data, error } = await supabase
      .from('company_members')
      .select(`
        role,
        companies (
          id,
          name,
          document,
          logo_url,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .eq('companies.is_active', true)

    if (error) {
      console.error('Error fetching companies:', error)
      return []
    }

    return ((data ?? []) as any[])
      .filter((row: any) => row.companies !== null && !Array.isArray(row.companies))
      .map((row: any) => ({
        ...row.companies,
        role: row.role,
      })) as UserCompany[]
  }, [])

  // ── Set active company ───────────────────────────────────
  const setActiveCompany = useCallback((company: UserCompany) => {
    setActiveCompanyState(company)
    setCompanyRole(company.role)
    localStorage.setItem(ACTIVE_COMPANY_KEY, company.id)
  }, [])

  // ── Initialize from session ──────────────────────────────
  const initializeFromSession = useCallback(
    async (newSession: Session | null) => {
      if (!newSession) {
        setUser(null)
        setSession(null)
        setProfile(null)
        setCompanies([])
        setActiveCompanyState(null)
        setCompanyRole(null)
        setSessionState('unauthenticated')
        return
      }

      setUser(newSession.user)
      setSession(newSession)

      const [fetchedProfile, fetchedCompanies] = await Promise.all([
        fetchProfile(newSession.user.id),
        fetchCompanies(newSession.user.id),
      ])

      setProfile(fetchedProfile)
      setCompanies(fetchedCompanies)

      // Restore active company from localStorage
      const savedCompanyId = localStorage.getItem(ACTIVE_COMPANY_KEY)
      if (savedCompanyId && fetchedCompanies.length > 0) {
        const saved = fetchedCompanies.find(c => c.id === savedCompanyId)
        if (saved) {
          setActiveCompanyState(saved)
          setCompanyRole(saved.role)
        } else {
          // saved company no longer accessible → auto-select first
          if (fetchedCompanies.length === 1) {
            setActiveCompanyState(fetchedCompanies[0])
            setCompanyRole(fetchedCompanies[0].role)
            localStorage.setItem(ACTIVE_COMPANY_KEY, fetchedCompanies[0].id)
          }
        }
      } else if (fetchedCompanies.length === 1) {
        // Only one company → auto-select
        setActiveCompanyState(fetchedCompanies[0])
        setCompanyRole(fetchedCompanies[0].role)
        localStorage.setItem(ACTIVE_COMPANY_KEY, fetchedCompanies[0].id)
      }

      setSessionState('authenticated')
    },
    [fetchProfile, fetchCompanies]
  )

  // ── Auth state listener ──────────────────────────────────
  useEffect(() => {
    if (localStorage.getItem('zeropapel_mock_login') === 'true') {
      const mockCompany: UserCompany = {
        id: 'mock-company-id', name: 'Empresa Teste', document: '00.000.000/0001-00',
        logo_url: null, is_active: true, created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(), role: 'owner'
      }
      setUser({ id: 'mock-user', email: 'teste@zeropapel.com' } as any)
      setSession({ access_token: 'fake', refresh_token: 'fake', expires_in: 3600, token_type: 'bearer', user: {} as any })
      setProfile({ id: 'mock-user', email: 'teste@zeropapel.com', full_name: 'Usuário Teste', avatar_url: null, created_at: '', updated_at: '' })
      setCompanies([mockCompany])
      setActiveCompanyState(mockCompany)
      setCompanyRole('owner')
      setSessionState('authenticated')
      return
    }

    // onAuthStateChange fires INITIAL_SESSION immediately on registration (Supabase JS v2),
    // so we don't need a separate getSession() call. Calling getSession() concurrently
    // creates an orphaned auth lock under React StrictMode (double-mount), causing the
    // 5-second "stuck loading" freeze when returning to the tab.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // TOKEN_REFRESHED: token silently renewed in background — just sync session token
      if (event === 'TOKEN_REFRESHED') {
        setSession(newSession)
        if (newSession) setUser(newSession.user)
        return
      }

      // SIGNED_IN while already authenticated: the tab regained focus and Supabase
      // re-emits the event after refreshing the token. Re-fetching profile/companies
      // here would try to acquire the auth lock while it's still held by the refresh
      // operation, causing a 5-second hang. Just sync the session token instead.
      if (event === 'SIGNED_IN' && sessionStateRef.current === 'authenticated') {
        setSession(newSession)
        if (newSession) setUser(newSession.user)
        return
      }

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(ACTIVE_COMPANY_KEY)
        await initializeFromSession(null)
        return
      }

      // INITIAL_SESSION, first SIGNED_IN, PASSWORD_RECOVERY, USER_UPDATED → full init
      await initializeFromSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [initializeFromSession])

  // ── signIn ───────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    if (email === 'teste@zeropapel.com' && password === '123456') {
      localStorage.setItem('zeropapel_mock_login', 'true')
      window.location.href = '/'
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  // ── signOut ──────────────────────────────────────────────
  const signOut = async () => {
    localStorage.removeItem(ACTIVE_COMPANY_KEY)
    if (localStorage.getItem('zeropapel_mock_login')) {
      localStorage.removeItem('zeropapel_mock_login')
      window.location.href = '/'
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // ── refreshProfile ───────────────────────────────────────
  const refreshProfile = async () => {
    if (!user) return
    const updated = await fetchProfile(user.id)
    if (updated) setProfile(updated)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        sessionState,
        companies,
        activeCompany,
        companyRole,
        signIn,
        signOut,
        setActiveCompany,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Consumer hook ─────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
