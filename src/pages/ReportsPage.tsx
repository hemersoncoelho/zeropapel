import { Navigate } from 'react-router-dom'

// Dashboard e Relatórios foram unificados — redirect transparente
export function ReportsPage() {
  return <Navigate to="/dashboard" replace />
}
