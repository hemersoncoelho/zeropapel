// Database types matching the Supabase schema

export type CompanyRole = 'owner' | 'admin' | 'finance' | 'manager' | 'viewer'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  document: string | null       // CNPJ/CPF
  logo_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CompanyMember {
  id: string
  company_id: string
  user_id: string
  role: CompanyRole
  created_at: string
}

// Extended type including company data for the user's company list
export interface UserCompany extends Company {
  role: CompanyRole
}

// Auth session states
export type SessionState = 'loading' | 'authenticated' | 'unauthenticated' | 'expired'

// Permission actions mapped to roles
export const ROLE_PERMISSIONS: Record<CompanyRole, string[]> = {
  viewer: [
    'read:dashboard',
    'read:transactions',
    'read:accounts',
    'read:contacts',
    'read:transfers',
    'read:categories',
    'read:reports',
  ],
  finance: [
    'read:dashboard',
    'read:transactions',
    'create:transactions',
    'edit:transactions',
    'delete:transactions',
    'create:settlements',
    'read:accounts',
    'read:contacts',
    'read:transfers',
    'read:categories',
    'read:reports',
    'create:transfers',
    'delete:transfers',
  ],
  manager: [
    'read:dashboard',
    'read:transactions',
    'create:transactions',
    'edit:transactions',
    'delete:transactions',
    'create:settlements',
    'read:accounts',
    'read:contacts',
    'read:transfers',
    'read:categories',
    'read:reports',
    'create:transfers',
    'delete:transfers',
    'export:reports',
  ],
  admin: [
    'read:dashboard',
    'read:transactions',
    'create:transactions',
    'edit:transactions',
    'delete:transactions',
    'create:settlements',
    'read:accounts',
    'create:accounts',
    'edit:accounts',
    'read:contacts',
    'create:contacts',
    'edit:contacts',
    'delete:contacts',
    'read:transfers',
    'delete:transfers',
    'read:categories',
    'create:categories',
    'edit:categories',
    'delete:categories',
    'read:reports',
    'create:transfers',
    'export:reports',
    'manage:users',
    'read:settings',
    'edit:settings',
  ],
  owner: [
    'read:dashboard',
    'read:transactions',
    'create:transactions',
    'edit:transactions',
    'delete:transactions',
    'create:settlements',
    'read:accounts',
    'create:accounts',
    'edit:accounts',
    'delete:accounts',
    'read:contacts',
    'create:contacts',
    'edit:contacts',
    'delete:contacts',
    'read:transfers',
    'delete:transfers',
    'read:categories',
    'create:categories',
    'edit:categories',
    'delete:categories',
    'read:reports',
    'create:transfers',
    'export:reports',
    'manage:users',
    'delete:users',
    'read:settings',
    'edit:settings',
    'delete:company',
  ],
}

export const ROLE_LABELS: Record<CompanyRole, string> = {
  owner:   'Proprietário',
  admin:   'Administrador',
  finance: 'Financeiro',
  manager: 'Gerente',
  viewer:  'Visualizador',
}

export const ROLE_COLORS: Record<CompanyRole, string> = {
  owner:   'bg-rose-100 text-rose-700',
  admin:   'bg-purple-100 text-purple-700',
  finance: 'bg-blue-100 text-blue-700',
  manager: 'bg-amber-100 text-amber-700',
  viewer:  'bg-stone-100 text-stone-600',
}
