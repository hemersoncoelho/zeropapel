import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export type CompanyPlan = 'free' | 'starter' | 'pro' | 'enterprise'

export interface AdminCompany {
  id: string
  name: string
  document: string | null
  logo_url: string | null
  is_active: boolean
  plan: CompanyPlan
  plan_expires_at: string | null
  created_at: string
  updated_at: string
  member_count: number
}

interface AdminContextValue {
  isAdmin: boolean
  isCheckingAdmin: boolean
  companies: AdminCompany[]
  loading: boolean
  error: string | null
  refreshCompanies: () => Promise<void>
  updateCompanyPlan: (companyId: string, plan: CompanyPlan, expiresAt?: string | null) => Promise<void>
  updateCompanyStatus: (companyId: string, isActive: boolean) => Promise<void>
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, sessionState } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true)
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if current user is a platform admin
  // We wait until the session has finished loading before resolving
  useEffect(() => {
    // Session still bootstrapping — keep spinner
    if (sessionState === 'loading') return

    // Session done but no authenticated user
    if (!user || sessionState !== 'authenticated') {
      setIsAdmin(false)
      setIsCheckingAdmin(false)
      return
    }

    let cancelled = false

    // Safety timeout — never hang the spinner forever
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setIsAdmin(false)
        setIsCheckingAdmin(false)
      }
    }, 8000)

    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_admins')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        
        console.log('--- ADMIN DB CHECK ---', { userId: user.id, email: user.email, data, error })

        let userIsAdmin = !!data && !error

        // Fallback for development/testing: if email is admin, automatically grand access
        if (!userIsAdmin && (user.email?.startsWith('admin@') || user.email === 'hemersoncoelho21@gmail.com')) {
          console.log('--- ADMIN FALLBACK: Auto-granting admin to', user.email)
          userIsAdmin = true
          
          // Try to insert them into platform_admins so it's persisted in DB
          try {
            await supabase.from('platform_admins').insert({ user_id: user.id })
          } catch(e) {
            console.error('Failed to auto-insert admin', e)
          }
        }

        if (!cancelled) {
          setIsAdmin(userIsAdmin)
          setIsCheckingAdmin(false)
        }
      } catch (err) {
        console.error('--- ADMIN DB ERROR ---', err)
        if (!cancelled) {
          setIsAdmin(false)
          setIsCheckingAdmin(false)
        }
      } finally {
        clearTimeout(timeout)
      }
    }

    checkAdmin()

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [user, sessionState])

  // Fetch all companies with member count
  const fetchCompanies = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    setError(null)

    try {
      // Get companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (companiesError) throw companiesError

      // Get member counts for each company
      const { data: membersData, error: membersError } = await supabase
        .from('company_members')
        .select('company_id')

      if (membersError) throw membersError

      // Count members per company
      const memberCounts: Record<string, number> = {}
      membersData?.forEach(m => {
        memberCounts[m.company_id] = (memberCounts[m.company_id] || 0) + 1
      })

      const enriched: AdminCompany[] = (companiesData || []).map(c => ({
        ...c,
        plan: c.plan ?? 'free',
        member_count: memberCounts[c.id] ?? 0,
      }))

      setCompanies(enriched)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao buscar empresas'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) fetchCompanies()
  }, [isAdmin, fetchCompanies])

  const updateCompanyPlan = async (companyId: string, plan: CompanyPlan, expiresAt?: string | null) => {
    const { error } = await supabase
      .from('companies')
      .update({ plan, plan_expires_at: expiresAt ?? null, updated_at: new Date().toISOString() })
      .eq('id', companyId)

    if (error) throw error

    setCompanies(prev => prev.map(c =>
      c.id === companyId ? { ...c, plan, plan_expires_at: expiresAt ?? null } : c
    ))
  }

  const updateCompanyStatus = async (companyId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('companies')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', companyId)

    if (error) throw error

    setCompanies(prev => prev.map(c =>
      c.id === companyId ? { ...c, is_active: isActive } : c
    ))
  }

  return (
    <AdminContext.Provider value={{
      isAdmin,
      isCheckingAdmin,
      companies,
      loading,
      error,
      refreshCompanies: fetchCompanies,
      updateCompanyPlan,
      updateCompanyStatus,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
