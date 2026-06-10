# CLAUDE.md

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com o código deste repositório.

## Comandos

```bash
npm run dev        # Inicia o servidor de desenvolvimento Vite (http://localhost:5173)
npm run build      # Verifica tipos (tsc -b) e gera o build de produção
npm run lint       # Executa o ESLint em todo o projeto
npm run preview    # Pré-visualiza o build de produção localmente
```

Não há test runner configurado. Valide as alterações rodando o servidor de desenvolvimento e testando manualmente.

## Visão Geral da Arquitetura

ZeroPapel é um SaaS multi-tenant para gestão financeira. O stack é React 19 + TypeScript + Vite no frontend, com Supabase (PostgreSQL + Auth + RLS) como único backend.

### Multi-Tenancy e Autenticação

Dois sistemas de autenticação paralelos:
- **Usuários tenant**: Autenticados via Supabase Auth; vinculados a empresas pela tabela `company_members` (tabela de junção com enum `role`).
- **Admins de plataforma**: Super-admins armazenados na tabela `platform_admins`. O e-mail `hemersoncoelho21@gmail.com` recebe acesso admin automaticamente.

`AuthContext` gerencia todo o ciclo de sessão: restaura a sessão do Supabase, busca perfil do usuário + vínculos com empresas, e controla `activeCompany` (persistido no localStorage). `AdminContext` verifica o status de admin de plataforma.

Sempre use `useAuth()` para obter `activeCompany` antes de qualquer insert ou fetch de dados tenant no Supabase.

### Cadeia de Guards de Rota

```
ProtectedRoute → TenantRoute → RoleGuard (AdminRoute para /admin/*)
```

A rota raiz `/` redireciona com base em `sessionState` + `activeCompany` + `isAdmin`:
- Sem sessão → `/login`
- Sessão sem empresa → `/select-company`
- Admin → `/admin`
- Usuário com empresa → `/dashboard`

### Controle de Acesso Baseado em Papel (RBAC)

Cinco papéis: `owner`, `admin`, `finance`, `manager`, `viewer`. As permissões são definidas em `ROLE_PERMISSIONS` em `hooks/usePermission.ts`. As políticas RLS no banco de dados garantem o isolamento tenant — filtros apenas no cliente não são suficientes.

### Regras de Banco de Dados

- **Agregações pesadas pertencem ao banco de dados.** A view `company_financial_summary` realiza os cálculos de receita/despesa/saldo no PostgreSQL (`sum() filter(...)`). Não replique essa lógica no cliente.
- Para novas visões financeiras ou métricas, estenda `company_financial_summary` ou crie novas Views/RPCs em vez de agregar no React.
- `transactions.amount` é armazenado como `BIGINT` em centavos.
- Todas as tabelas têm RLS habilitado com a função auxiliar `is_member_of(company_id)` para verificações de política.
- Mutations devem usar `.select()` após `.insert()` para validação de erros — nunca feche modais silenciosamente em caso de erro.

### Mapa de Arquivos Principais

| Caminho | Finalidade |
|---|---|
| `src/contexts/AuthContext.tsx` | Auth, estado multi-tenant, `activeCompany` |
| `src/contexts/AdminContext.tsx` | Flag de admin de plataforma |
| `src/hooks/usePermission.ts` | Mapa `ROLE_PERMISSIONS` e hook `usePermission` |
| `src/types/database.ts` | Tipos TypeScript para todas as tabelas do banco |
| `src/types/finance.ts` | Tipos do domínio financeiro |
| `src/lib/supabase.ts` | Cliente Supabase (lê `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) |
| `src/lib/utils.ts` | `formatCurrency` e outros utilitários |
| `supabase/migrations/` | Arquivos SQL de migração com timestamp |

### Convenções de Nomenclatura

- Labels de UI e linguagem de domínio em **português** (`lançamentos`, `contas`, `contatos`).
- Identificadores de código (variáveis, funções, tipos) em **inglês**.

## Configuração do Ambiente

Crie o arquivo `.env.local`:

```bash
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[public-anon-key]
```

## Páginas em Desenvolvimento

Estas rotas exibem placeholders de "em desenvolvimento" e ainda não foram implementadas: `/accounts`, `/contacts`, `/transfers`, `/reports`, `/categories`, `/users`, `/settings`.
