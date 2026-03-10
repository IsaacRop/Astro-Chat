# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server at localhost:3000
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

Requires `.env.local`:
```
OPENAI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # only needed for deleteAccount()
```

## Architecture

Next.js 16 App Router application called "Astro" / "Otto" — a Portuguese-language (pt-BR) educational AI assistant. All UI text and AI prompts are in Brazilian Portuguese.

### Storage: Supabase is the single source of truth

All data lives in Supabase. There is no localStorage data layer. The Supabase tables are: `chats`, `messages`, `notes`, `tasks`, `ideas`, `bookmarks`, `calendar_events`, `feedbacks`, `profiles`.

- `utils/supabase/server.ts` — server-side client (used in Server Components, server actions, route handlers)
- `utils/supabase/client.ts` — browser client (used in Client Components)
- Both throw a descriptive error if env vars are missing rather than using `!` assertions.

`middleware.ts` runs on `/dashboard/*`, `/cadernos/*`, and `/api/**` to refresh Supabase session tokens on every request. **Do not remove the `supabase.auth.getUser()` call from middleware** — it is what keeps sessions alive server-side.

### Authentication — Interaction Gate

Auth uses a **lazy/interaction-gate** model: unauthenticated users can see all dashboard UI, but any interaction triggers a login modal.

- `components/auth/auth-modal-provider.tsx` — Client Component context provider wrapping the entire app (in `app/layout.tsx`). Exposes `useAuthModal()` with:
  - `isAuthenticated: boolean` — real-time Supabase session state
  - `requireAuth(callback?)` — executes callback if authenticated, opens login modal if not
  - `openModal()` — imperative open
- `app/layout.tsx` passes `initialIsAuthenticated={!!user}` (server-resolved) to the provider to eliminate client-side flash for logged-in users.
- `components/auth/auth-guard.tsx` — legacy hard-wall guard; **currently unused**, kept for reference.
- Server actions independently call `supabase.auth.getUser()` — they do not rely on the client-side auth context.

### Server Actions (`app/actions/`)

| File | Responsibility |
|---|---|
| `chat.ts` | `getChatMessages`, `getUserChats` |
| `dashboard.ts` | `createNewChat` |
| `study.ts` | Knowledge graph (`getKnowledgeGraph`, `getChatById`), notes CRUD, `deleteChat` |
| `productivity.ts` | Tasks, ideas, bookmarks, calendar events |
| `profile.ts` | `updateProfile`, `deleteAccount`, `signOut` |
| `submit-feedback.ts` | `submitFeedback` |

All delete operations in `study.ts` and `chat.ts` perform an ownership check (`.eq("user_id", user.id)`) **before** deleting child records, to prevent cross-user data deletion.

### Knowledge Graph Pipeline

`/cadernos` visualises a force-directed graph of the user's chats. The data flow:

1. When an AI response is saved, `POST /api/chat/save` calls `gpt-4o-mini` to generate a short Portuguese topic label, then `text-embedding-3-small` to embed it, and stores both in `chats.title` and `chats.embedding`.
2. `getKnowledgeGraph()` in `app/actions/study.ts` fetches chat nodes from Supabase and calls the `get_chat_similarity_edges` pgvector RPC to produce semantic edges.
3. `components/GraphVisualization.tsx` renders the result using `react-force-graph-2d`. Node size scales with message count (`val`).
4. Clicking a node opens `components/NodeSlideOver.tsx`. Notes written there are saved to the Supabase `notes` table via `createNote`/`saveNote` from `app/actions/study.ts`. A lightweight localStorage pointer (`teo-caderno-note-{chatId}`) tracks which note UUID belongs to which chat node — only the UUID is stored locally, never content.

### AI Chat (`/dashboard/chat`)

`POST /api/chat` streams responses via Vercel AI SDK (`streamText`, `gpt-4o-mini`). Context is capped at the last 6 messages; output at 500 tokens. `POST /api/chat/save` persists messages to Supabase and triggers auto-title + embedding generation on the first assistant reply.

`components/chat-interface.tsx` handles lazy chat creation: the Supabase `chats` row is only inserted when the user sends their first message (`POST /api/chat/create`), not on page load.

### Freemium Paywall

Free-tier users are limited to **10 AI messages per day**. The gate is enforced server-side in `POST /api/chat`.

**Database columns on `profiles`** (run `supabase/migrations/20260309_add_paywall_columns.sql`):
- `plan_tier` (text, default `'free'`) — `'free'` or `'pro'`
- `daily_message_count` (integer, default `0`) — resets each day
- `last_message_date` (date) — tracks which calendar day the counter belongs to

**Backend flow** (`app/api/chat/route.ts`):
1. Authenticate via Supabase; return 401 if no session.
2. Fetch `plan_tier`, `daily_message_count`, `last_message_date` from `profiles`.
3. If `last_message_date ≠ today`, reset counter to 0.
4. If `plan_tier === 'free'` and `count >= 10`, return **HTTP 403** `{ error: "PAYWALL_LIMIT_REACHED" }`.
5. Otherwise increment counter (fire-and-forget) and stream the AI response.

**Frontend** (`components/chat-interface.tsx`):
- `useChat` `onError` callback detects `PAYWALL_LIMIT_REACHED` and sets `showPaywall(true)`.
- `<PaywallModal>` renders with an upgrade CTA ("Fazer upgrade para o Otto Pro") and a dismiss option.
- Input is disabled (`isLoading || showPaywall`) while the paywall is active.

### Route Structure

- `/` — Landing page with OctopusMascot
- `/chat` — Redirects authenticated users to `/dashboard/chat`, unauthenticated to home
- `/cadernos` — Knowledge graph; `/cadernos/[nodeId]` shows node detail + Supabase-backed notes editor
- `/dashboard` — Auth-protected shell; contains `/dashboard/chat/[id]`, `/dashboard/notes/[id]`, tasks, calendar, ideas, favorites, settings

### UI Conventions

- Tailwind CSS v4 (PostCSS plugin — no `tailwind.config.js`)
- `components/ui/` — shadcn/ui-style components using `class-variance-authority` + `clsx`/`tailwind-merge`
- Animations: Framer Motion
- Icons: Lucide React
- Toasts: Sonner (`<Toaster>` in root layout)
- Fonts: `Inter` (sans, `--font-sans`) and `Playfair Display` (serif, `--font-serif`) via CSS variables



## Redesign V2 — Design System

### Rules
- NEVER change logic, server actions, APIs, routes, or state. Visual/CSS only.
- KEEP the existing fonts Inter (--font-sans) and Playfair Display (--font-serif). Do not replace them.
- KEEP shadcn/ui, Framer Motion, Lucide React. Do not swap libraries.
- Tailwind CSS v4 via PostCSS (no tailwind.config.js). Customization goes through CSS variables in globals.css.
- All 7 features must remain functional.
- All UI text stays in Brazilian Portuguese (pt-BR).

### New Layout
- Slim sidebar (68px): logo, search, notifications, help, settings, and profile avatar only
- Horizontal taskbar at the top: tab navigation for Chat, Cadernos, Notas, Ideias, Favoritos, Tarefas, Calendário
- Main area: active tab content

### Color Palette (CSS variables for globals.css)
--color-bg: #F5F9F6;
--color-surface: #FFFFFF;
--color-surface-alt: #EDF4EF;
--color-sidebar: #1E2E25;
--color-sidebar-hover: #2A3E32;
--color-sidebar-text: #D0E0D6;
--color-sidebar-muted: #6B8574;
--color-accent: #4A9E6B;
--color-accent-dark: #3B8558;
--color-accent-light: #DFF0E5;
--color-text: #1E2E25;
--color-text-sec: #5A7565;
--color-text-muted: #8BA698;
--color-border: #D0E0D6;
--color-border-light: #E2EDE6;

### Feature Colors
Chat: #4A9E6B / #DFF0E5
Cadernos: #5B9E9E / #DFF0F0
Notas: #6BBF8A / #E3F5EB
Ideias: #9B82B8 / #EDE3F5
Favoritos: #B89E6B / #F2ECD8
Tarefas: #C17D8A / #F5E3E7
Calendário: #6B9CC6 / #E0EBF5

### Spacing & Radius
Cards: rounded-2xl (18px)
Inputs: rounded-xl (14px)
Buttons: rounded-lg (10px)
Transitions: duration-150 to duration-250 ease

## Responsiveness Rules
- Mobile first: default styles target 320px–480px
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar: hidden on mobile, toggled via hamburger menu
- Top taskbar: scrollable horizontally on mobile, or collapsed into hamburger
- Cards grid: 1 column on mobile, 2 on sm/md, 3 on lg+
- Font sizes: reduce headings by 1 step on mobile (text-2xl → text-xl)
- Padding: p-4 on mobile, p-6 on md, p-8 on lg+
- Touch targets: minimum 44x44px for all interactive elements
- Test targets: iPhone SE (375px), iPhone 14 (390px), Android mid-range (360px), iPad (768px)
