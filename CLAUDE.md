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

All data lives in Supabase. There is no localStorage data layer. The Supabase tables are: `chats`, `messages`, `notes`, `tasks`, `ideas`, `bookmarks`, `calendar_events`, `feedbacks`.

- `utils/supabase/server.ts` — server-side client (used in Server Components, server actions, route handlers)
- `utils/supabase/client.ts` — browser client (used in Client Components)
- Both throw a descriptive error if env vars are missing rather than using `!` assertions.

`middleware.ts` runs on `/dashboard/*`, `/cadernos/*`, and `/api/**` to refresh Supabase session tokens on every request. **Do not remove the `supabase.auth.getUser()` call from middleware** — it is what keeps sessions alive server-side.

### Authentication

`components/auth/auth-guard.tsx` is a **Client Component** that checks auth client-side and shows a login modal overlay if unauthenticated. The `/dashboard` layout wraps all pages in it. Server actions independently call `supabase.auth.getUser()` — they do not rely on AuthGuard.

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
