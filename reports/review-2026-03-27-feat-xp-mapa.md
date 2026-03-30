# Peer Review Report — `feat/xp-mapa`
**Data:** 2026-03-27  
**Workflow:** `/review-code`  
**Feature:** Sistema de XP e Mapa de Progresso do Aluno  

---

## Step 1 — @engineer: Change Brief

**Problema resolvido:** Alunos não tinham nenhuma visualização de progresso nem incentivo gamificado para continuar estudando. A feature adiciona XP, níveis e um mapa visual das competências ENEM.

**Arquivos/módulos tocados:**
- `lib/xp/constants.ts` — definição de fontes de XP, áreas, níveis (1–10), tipos TypeScript
- `lib/xp/actions.ts` — Server Actions: `addXP()` (via RPC `add_xp`) e `getUserXP()`
- `hooks/useXP.ts` — hook client-side com Supabase Realtime (Postgres Changes) na tabela `user_xp`
- `components/mapa/` — 5 componentes: `XPBar`, `HexGrid`, `AreaCard`, `LevelUpModal`, `MapaTutorial`, `PaywallOverlay`
- `app/mapa/MapaClient.tsx` — page client com compositor dos componentes acima
- `app/api/chat/route.ts:48` — fire-and-forget `addXP('chat_message')` por mensagem no chat

**Fluxo happy-path:**
Usuário envia mensagem → `route.ts` chama `addXP()` fire-and-forget → RPC `add_xp` no Supabase atualiza `user_xp` → Realtime dispara UPDATE → `useXP` detecta level-up → `LevelUpModal` exibe animação

**Novas tabelas/RPCs:** `user_xp` (tabela) + `add_xp` (RPC) — **sem migration SQL presente no repositório.**

**Riscos conhecidos:**
- `add_xp` RPC existe no Supabase mas não há migration em `supabase/migrations/` — não auditável.
- Fire-and-forget sem `areaSlug` no chat — todo XP vai sem área associada.
- `useXP.ts` abre canal Realtime mas usa `xp?.nivel_global` como dependência do `useEffect` de subscribe, podendo causar re-subscrição.

---

## Step 2 — @security-expert: Hostile Review

> *"Se um atacante pode controlar um parâmetro, ele vai controlar. Minha função é encontrar isso antes de você."*

### Varredura de Segurança

| # | Check | Arquivo:Linha | Status | Detalhe |
|---|---|---|---|---|
| 1 | **Auth em `addXP`** | `lib/xp/actions.ts:13` | ✅ PASS | `supabase.auth.getUser()` é a primeira chamada. Retorna `null` se `!user`. |
| 2 | **Auth em `getUserXP`** | `lib/xp/actions.ts:35-37` | ✅ PASS | Idem — `getUser()` → early return. |
| 3 | **IDOR em `getUserXP`** | `lib/xp/actions.ts:42` | ✅ PASS | `.eq('user_id', user.id)` presente. |
| 4 | **IDOR via RPC `add_xp`** | `lib/xp/actions.ts:18-24` | ⚠️ **HIGH** | `p_user_id: user.id` é passado como parâmetro explícito ao RPC. A segurança depende inteiramente da RLS/lógica dentro da função `add_xp` no Supabase. **Sem a migration auditável, é impossível confirmar que a função não pode ser explorada para escrever XP em outro `user_id`.** |
| 5 | **SQL Injection** | `lib/xp/` inteiro | ✅ PASS | 100% SDK — nenhuma template literal próxima de SQL. |
| 6 | **Env leak em Client Components** | `hooks/useXP.ts`, `components/mapa/*` | ✅ PASS | Nenhum `process.env` em arquivos client. |
| 7 | **XSS** | `components/mapa/*` | ✅ PASS | Nenhum `dangerouslySetInnerHTML`. Outputs via JSX padrão. |
| 8 | **Rate limiting no chat** | `app/api/chat/route.ts:48` | ⚠️ **MEDIUM** | O freemium limit (rolling 5h) existe, mas não há rate limiter por minuto (Upstash/Redis) conforme exigido em `cybersecurity_hardening.md §3`. Um usuário Pro pode disparar `addXP` N vezes/min sem throttle. |
| 9 | **Payload size** | `app/api/chat/route.ts` | ⚠️ **MEDIUM** | Nenhum limite de 4KB explícito no corpo do POST — pré-existente, mas não sanado nesta PR. |
| 10 | **Body-trusted userId** | Todos os arquivos novos | ✅ PASS | Nenhuma leitura de `body.user_id`. |
| 11 | **`console.log` em server route** | `app/api/chat/route.ts:20,54,58,80,93,102` | ⚠️ **LOW** | 6 `console.log` ativos em produção — vazamento de informações de contexto. |

### Veredito Provisório: **NO-GO (HIGH)**

> **Finding #4 (HIGH):** Sem a migration SQL de `add_xp` no repo, não é possível auditar se a RPC aplica `auth.uid() = p_user_id` check interno. Se a função aceitar qualquer `p_user_id` sem validação, um usuário autenticado pode gravar XP na conta de outro usuário (IDOR via RPC).

**Ação requerida antes do merge:**
1. Adicionar `supabase/migrations/<timestamp>_add_xp_system.sql` contendo a DDL completa da `user_xp` + função `add_xp`.
2. A função DEVE conter: `IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;` ou lógica equivalente.

---

## Step 3 — @tutor: Domain Integrity Review

> *Referência: `skills/enem_domain_rules.md`*

| # | Check | Arquivo | Status | Detalhe |
|---|---|---|---|---|
| 1 | **`lib/prompts/otto-system.ts` não tocado** | — | ✅ PASS | Nenhuma alteração no sistema de prompts. |
| 2 | **Todo texto de UI em pt-BR** | `components/mapa/*`, `MapaClient.tsx` | ✅ PASS | "Calouro", "Nível", "Ganhe XP", "Próximo", "Começar a explorar" — tudo em pt-BR. |
| 3 | **Áreas mapeadas corretamente ao ENEM** | `lib/xp/constants.ts:11-16` | ✅ PASS | `lc` = Linguagens, `ch` = Ciências Humanas, `cn` = Ciências da Natureza, `mt` = Matemática. Nomenclatura correta do ENEM. |
| 4 | **Redação ausente** | `lib/xp/constants.ts` | ⚠️ **FAIL** | A área `Redação` existe no ENEM mas **não está no `AREAS` dict**. Alunos que estudam Redação não acumulam XP por área. Isso quebra a grade ENEM (5 áreas) e pode fazer o aluno sentir que Redação "não conta". |
| 5 | **Competências no `HexGrid`** | `components/mapa/HexGrid.tsx:124-127` | ⚠️ **FAIL** | Threshold de desbloqueio é `idx * 20` XP — lógica hardcoded sem vínculo com a taxonomia ENEM (habilidades H1–H30). Competências deveriam ser desbloqueadas por progresso na área correspondente, não por índice posicional arbitrário. |
| 6 | **Feedback 200 palavras** | — | ✅ N/A | Não alterado nesta PR. |
| 7 | **Inglês em literais AI-facing** | `lib/prompts/`, `app/api/exams/` | ✅ PASS | Nenhum novo literal em inglês nas rotas pedagógicas. |

### Veredito: **Domain Integrity: FAIL (2 itens)**

---

## Step 4 — @qa: Vibe & Polish Review

> *Referência: `skills/coding_standards.md`*

| # | Check | Arquivo | Status | Detalhe |
|---|---|---|---|---|
| 1 | **Shadcn/ui primitives** | `components/mapa/*` | ⚠️ NEEDS WORK | Botões em `MapaTutorial.tsx:65` e `PaywallOverlay.tsx:38` são `<button>` e `<Link>` raw sem o componente `<Button>` do Shadcn. Cria inconsistência visual com o resto do app. |
| 2 | **Framer Motion para animações complexas** | `components/mapa/*` | ✅ PASS | `motion.*` usado extensivamente — `AnimatePresence`, `spring`, confetti com `motion.div`. |
| 3 | **Mobile-first / breakpoints** | `MapaClient.tsx`, `MapaTutorial.tsx` | ✅ PASS | `max-w-xl`, `mx-auto`, `w-full`, `max-w-sm`. `MapaTutorial` usa `rounded-t-3xl sm:rounded-3xl` — bottom-sheet em mobile, card em sm+. |
| 4 | **Dark mode — variáveis semânticas** | `components/mapa/*` | ✅ PASS | `bg-card`, `text-muted-foreground`, `border-border`, `bg-muted` em todo lugar. Sem hex hardcoded exceto nas cores de confetti e das áreas (que são brand-colors armazenadas em constantes, aceitável). |
| 5 | **Loading state** | `MapaClient.tsx:76-82` | ✅ PASS | `!loading` condicional presente. Empty-state textual exibido se não há XP ainda. **Melhoria sugerida:** substituir texto simples por skeleton card animado. |
| 6 | **Error state** | `hooks/useXP.ts`, `lib/xp/actions.ts` | ⚠️ NEEDS WORK | Erros do Supabase são silenciados com `return null` — sem feedback visual ao usuário se o carregamento de XP falhar. |
| 7 | **Acessibilidade** | `components/mapa/HexGrid.tsx:131` | ✅ PASS | SVG tem `aria-label="Mapa de Desenvolvimento"`. `HexCell` tem `cursor: pointer/default` e foco gerenciado via `onClick`. **Melhoria sugerida:** `role="button"` e `tabIndex={0}` nas células clicáveis do SVG. |
| 8 | **Console noise em client** | `hooks/useXP.ts` | ✅ PASS | Sem `console.log` em client components. |
| 9 | **Touch targets** | `components/mapa/HexGrid.tsx` | ⚠️ NEEDS WORK | `COMP_SIZE = 28` — hexágonos de competência têm ~56px de diâmetro no SVG escalado, mas em mobile pode ficar abaixo de 44px dependendo da viewport. Verificar em iPhone SE (375px). |
| 10 | **`localStorage` key prefix** | `MapaClient.tsx:18` | ⚠️ NEEDS WORK | Key `'otto_mapa_tutorial_done'` usa prefixo `otto_` mas o padrão do projeto é `teo-*` (ver `coding_standards.md`). Inconsistência. |

### Veredito: **Vibe & Polish: NEEDS WORK (4 itens)**

---

## Step 5 — @engineer: Síntese & Go/No-Go

### Tabela de Findings Consolidados

| # | Agente | Severidade | Finding | Arquivo:Linha | Status |
|---|---|---|---|---|---|
| F-1 | @security-expert | **HIGH** | RPC `add_xp` sem migration auditável — possível IDOR via `p_user_id` | `lib/xp/actions.ts:19` | 🔴 Aberto |
| F-2 | @security-expert | **MEDIUM** | Rate limiter por minuto ausente no `/api/chat` | `app/api/chat/route.ts` | 🟡 Aberto |
| F-3 | @security-expert | **MEDIUM** | Sem limite de payload 4KB no POST `/api/chat` | `app/api/chat/route.ts` | 🟡 Aberto (pré-existente) |
| F-4 | @security-expert | **LOW** | 6 `console.log` ativos em `route.ts` | `app/api/chat/route.ts:20,54…` | 🟡 Aberto |
| F-5 | @tutor | **FAIL** | Área `Redação` ausente do sistema de XP | `lib/xp/constants.ts:11` | 🔴 Aberto |
| F-6 | @tutor | **FAIL** | Threshold de desbloqueio (`idx * 20`) sem vínculo com habilidades ENEM | `components/mapa/HexGrid.tsx:126` | 🔴 Aberto |
| F-7 | @qa | NEEDS WORK | Botões CTA sem `<Button>` Shadcn | `MapaTutorial.tsx:65`, `PaywallOverlay.tsx:38` | 🟡 Aberto |
| F-8 | @qa | NEEDS WORK | Sem feedback visual em caso de erro de XP | `hooks/useXP.ts`, `lib/xp/actions.ts` | 🟡 Aberto |
| F-9 | @qa | NEEDS WORK | Touch target das células SVG pode ser < 44px em mobile | `HexGrid.tsx:22` | 🟡 Aberto |
| F-10 | @qa | NEEDS WORK | Key localStorage com prefixo errado (`otto_` vs `teo-`) | `MapaClient.tsx:18` | 🟡 Aberto |

### Plano de Remediação Proposto

**F-1 (Blocker):**
```sql
-- supabase/migrations/<timestamp>_add_xp_system.sql
-- Adicionar check interno na função add_xp:
IF p_user_id != auth.uid() THEN
  RAISE EXCEPTION 'forbidden';
END IF;
```

**F-2 (MEDIUM):** Adicionar `@upstash/ratelimit` em `app/api/chat/route.ts` com `slidingWindow(20, "1 m")`.

**F-5 (FAIL — @tutor):**
```ts
// lib/xp/constants.ts
rd: { slug: 'rd', nome: 'Redação', cor: '#A78BFA', corDark: '#7C3AED', icone: '✍️' },
```

**F-6 (FAIL — @tutor):** Substituir `idx * 20` por threshold mapeado à ordem das habilidades ENEM (H1–H30) na tabela `competencias`.

**F-7:** Substituir `<button>` raw por `<Button variant="default">` do Shadcn.

**F-10:** Renomear `'otto_mapa_tutorial_done'` → `'teo-mapa-tutorial-done'`.

---

### @security-expert: Decisão Final

> **F-1 é um HIGH e torna o MERGE impossível sem a migration.**
> Nada mais na PR abre vetores de exploração direta além de F-1.
> Se o engenheiro adicionar a migration com o check `auth.uid() != p_user_id` e commitar o SQL de criação da `user_xp` com RLS habilitada, e resolver F-2 com rate limiter, posso dar **GO** na próxima rodada.

## Veredito Final: 🔴 MERGE BLOCKED

**Blockers:** F-1 (HIGH security), F-5 + F-6 (FAIL domain integrity)  
**Recomendação:** Aplicar patches F-1, F-5, F-6 e reabrir o `/review-code`.  
F-2, F-7, F-8, F-9, F-10 podem ser resolvidos na mesma PR ou rastreados no backlog.
