# Contexto e Requisitos do Aplicativo ZeroPapel

*(Esse arquivo foi atualizado para conter o briefing direto e centralizado do status de consistência financeira do SaaS, atendendo ao perfil Sênior Fullstack de performance e auditoria).*

## Status Atual: Módulo Financeiro Completamente Integrado (Não-Mockado)

Anteriormente, as telas de **Visão Geral (Dashboard)** e de **Lançamentos** operavam com constantes chamadas `MOCK_SUMMARY` e `MOCK_DATA`, o que gerava a severa disparidade arquitetural citada nos diagnósticos. Além disso, o banco não possuía a tabela fundamental de transações.

### A. O Banco de Dados ("A Única Fonte da Verdade")
1. Foi criada a tabela oficial **`transactions`** integrando `companies` via `ON DELETE CASCADE`.
2. Para resolver a performance (Problema de Agregações Duplicadas em Frontend), o banco de dados agora possui uma View agregadora compilada: **`company_financial_summary`**. 
   - A View sumariza Receitas, Despesas, Pendências e o Balanço total usando o motor otimizado do PostgreSQL direto no servidor (`sum() filter(...)`).
3. As devidas **Políticas de RLS e Triggers** (`update_updated_at`) foram garantidas para barrar acessos sujos de outras empresas.

### B. Integração do Frontend (Eliminando Over-Fetching)
1. **`DashboardPage.tsx`**: Agora efetua o preloading direto de `company_financial_summary` baseado no seu `activeCompany.id`.
   - Lançamentos recentes agora saem direto da tabela ordenada por `created_at` (limite de 5).
   - O botão **Novo Lançamento** navega apropriadamente para `/lancamentos`, onde a criação inline oficial de alta produtividade já reside.
2. **`TransactionsPage.tsx`**: Substituiu-se 100% da matriz isolada. A tela se alimenta da query direta à `transactions` mantendo o cache e dados limpos.
   - O modal de "Novo Lançamento" envia explicitamente o `insert` seguido de um `.select()` com verificação de erros no banco. Todo evento de erro na mutation não fecha mais silenciosamente.

---

# 🤖 Claude, se eu te enviar um novo prompt no futuro, lembre-se:
* O sistema possui uma área administrativa e uma área inquilina. Os acessos rodam através das tabelas de `company_members` e `platform_admins`.
* Sempre respeite o uso do `useAuth()` para obter a `activeCompany` antes de executar inserts ou fetches para `transactions`.
* Em caso de novas visões financeiras, priorize incluir regras no `company_financial_summary` SQL ao invés de reduzir a CPU do cliente do zero. Lógica e matemática pesada descem para o Backend através de Views e RPCs!
