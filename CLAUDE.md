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

All data lives in Supabase. There is no localStorage data layer. The Supabase tables are: `chats`, `messages`, `notes`, `tasks`, `ideas`, `bookmarks`, `calendar_events`, `feedbacks`, `profiles`, `exams`, `exam_questions`, `flashcard_decks`, `flashcard_cards`, `enem_questions`, `usage_limits`.

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
| `exams.ts` | `getUserExams`, `getExamWithQuestions`, `generateExam`, `submitAnswer`, `finishExam` |
| `usage.ts` | `getUserPlan`, `getUserUsage`, `checkCanUse`, `incrementUsage` — freemium usage tracking |

All delete operations in `study.ts` and `chat.ts` perform an ownership check (`.eq("user_id", user.id)`) **before** deleting child records, to prevent cross-user data deletion.

### Knowledge Graph Pipeline

`/cadernos` visualises a force-directed graph of the user's chats. The data flow:

1. When an AI response is saved, `POST /api/chat/save` calls `gpt-4o-mini` to generate a short Portuguese topic label, then `text-embedding-3-small` to embed it, and stores both in `chats.title` and `chats.embedding`.
2. `getKnowledgeGraph()` in `app/actions/study.ts` fetches chat nodes from Supabase and calls the `get_chat_similarity_edges` pgvector RPC to produce semantic edges.
3. `components/GraphVisualization.tsx` renders the result using `react-force-graph-2d`. Node size scales with message count (`val`).
4. Clicking a node opens `components/NodeSlideOver.tsx`. Notes written there are saved to the Supabase `notes` table via `createNote`/`saveNote` from `app/actions/study.ts`. A lightweight localStorage pointer (`teo-caderno-note-{chatId}`) tracks which note UUID belongs to which chat node — only the UUID is stored locally, never content.

### AI Chat (`/dashboard/chat`)

`POST /api/chat` streams responses via Vercel AI SDK (`streamText`, `gpt-4o-mini`). Context is capped at the last 6 messages; output at 500 tokens. The system prompt is now **dynamically built** by `buildSystemPrompt()` from `lib/prompts/otto-system.ts` — it detects ENEM-related keywords in the user's message and injects subject-specific context blocks (Linguagens, Humanas, Natureza, Matemática, Redação) on top of the base Otto prompt. `POST /api/chat/save` persists messages to Supabase and triggers auto-title + embedding generation on the first assistant reply.

`components/chat-interface.tsx` handles lazy chat creation: the Supabase `chats` row is only inserted when the user sends their first message (`POST /api/chat/create`), not on page load.

### Freemium Usage System

Usage is tracked per-resource with a **rolling 5-hour window** via `app/actions/usage.ts` and the `usage_limits` table.

**Free-tier limits:**
| Resource | Limit | Window |
|---|---|---|
| Chat messages | 10 | 5 hours |
| Exams | 3 | 5 hours |
| Flashcard decks | 3 | 5 hours |

Pro users have unlimited access. The `usage_limits` table stores `(user_id, resource_type, usage_count, reset_at)`. When `now > reset_at`, the counter auto-resets.

**Chat paywall** (`app/api/chat/route.ts`):
- Authenticates via Supabase; returns 401 if no session.
- If free-tier and limit reached, returns **HTTP 403** `{ error: "PAYWALL_LIMIT_REACHED" }`.
- Frontend (`components/chat-interface.tsx`): `useChat` `onError` detects the error and shows `<PaywallModal>`.

**Exam/Flashcard gates**: `checkCanUse("exam")` / `checkCanUse("flashcard")` is called at the start of their respective `/api/` routes. Returns 403 with usage info if exceeded.

### Route Structure

- `/` — Landing page with OctopusMascot
- `/chat` — Redirects authenticated users to `/dashboard/chat`, unauthenticated to home
- `/cadernos` — Knowledge graph; `/cadernos/[nodeId]` shows node detail + Supabase-backed notes editor
- `/dashboard` — Auth-protected shell; contains `/dashboard/chat/[id]`, `/dashboard/notes/[id]`, `/dashboard/provas`, `/dashboard/flashcards`, tasks, calendar, ideas, favorites, settings

### UI Conventions

- Tailwind CSS v4 (PostCSS plugin — no `tailwind.config.js`)
- `components/ui/` — shadcn/ui-style components using `class-variance-authority` + `clsx`/`tailwind-merge`
- Animations: Framer Motion
- Icons: Lucide React
- Toasts: Sonner (`<Toaster>` in root layout)
- Fonts: `Inter` (sans, `--font-sans`) and `Playfair Display` (serif, `--font-serif`) via CSS variables

### Dynamic System Prompts (`lib/prompts/otto-system.ts`)

Layered prompt system that injects ENEM-specific context into Otto's responses based on user queries.

- `BASE_SYSTEM_PROMPT` — Defines Otto as an ENEM specialist (~800 tokens)
- `CONTEXT_LINGUAGENS`, `CONTEXT_HUMANAS`, `CONTEXT_NATUREZA`, `CONTEXT_MATEMATICA`, `CONTEXT_REDACAO` — Subject-specific context blocks (~500 tokens each)
- `getContextForMessage(userMessage)` — Keyword matcher that selects relevant context blocks
- `buildSystemPrompt(userMessage)` — Combines base prompt + matched context blocks

Used in `POST /api/chat` to adapt system prompt per message without massive token bloat.

### ENEM RAG Pipeline (`lib/rag/enem-retriever.ts`)

Retrieves real ENEM questions from Supabase using pgvector semantic search.

**`retrieveEnemQuestions({ query, area?, yearMin?, matchCount? })`**:
1. Embeds query via OpenAI `text-embedding-3-small`
2. Calls `match_enem_questions()` RPC (cosine similarity)
3. Fetches 4× pool, shuffles for year diversity, returns deduplicated results

**`enem_questions` table** (migration: `supabase/migrations/20260326_create_enem_questions.sql`):
- Columns: `id`, `source` (`enem_challenge` | `maritaca`), `exam_year`, `question_number`, `area` (linguagens/humanas/natureza/matematica), `question`, `choices` (jsonb), `answer`, `has_image`, `image_url`, `image_description`, `embedding` (vector 1536)
- HNSW index on embedding for fast ANN search
- RPC: `match_enem_questions(query_embedding, match_count, filter_area, filter_year_min)`
- RLS: authenticated read-only

Used by both exam generation and flashcard generation APIs as grounding context.

### ENEM Data Ingestion (`scripts/`)

`scripts/ingest_enem.py` — Python script to load ENEM questions from HuggingFace datasets, generate embeddings, and upsert into Supabase.

**Data sources:**
- `eduagarcia/enem_challenge` — 2009–2017 (~9k questions, text-only)
- `maritaca-ai/enem` — 2022–2024 (~3k questions, includes images)

**Dependencies:** `scripts/requirements.txt` (`datasets`, `openai`, `supabase`, `python-dotenv`)

### Exam API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/exams/generate` | POST | Generate exam via AI (with RAG). Body: `{ examType, topic, questionCount, subject? }`. Returns `{ examId }` |
| `/api/exams/[examId]/answer` | POST | Submit answer. Body: `{ questionId, answer }`. Returns `{ isCorrect, correctAnswer, explanation }` |
| `/api/exams/[examId]/finish` | POST | Finalize exam. Computes score, generates AI feedback. Returns `{ exam, questions }` |

**Exam generation modes:**
- **Direct mode**: If multiple-choice AND enough real ENEM questions found via RAG → uses real questions directly (`source: "enem_real"`)
- **AI generation mode**: Falls back to GPT-4o-mini with RAG context as reference (`source: "ai_generated"`)

### Flashcard API Route

| Endpoint | Method | Description |
|---|---|---|
| `/api/flashcards/generate` | POST | Generate flashcard deck. Body: `{ topic, cardCount }`. Returns `{ deckId }` |

Uses RAG retrieval for grounding, then GPT-4o-mini generates ENEM-style flashcards (front: question/concept, back: answer with reasoning). Stored in `flashcard_decks` + `flashcard_cards` tables.

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

### AI-Powered Exams
Route: `/dashboard/provas` — UI in `app/provas/page.tsx` (client component)

**User flow:**
1. **Setup screen** → pick question type (multiple choice / true-false), topic, count (5/10/15/20/30/45). Shows past exams list and usage bar for free users.
2. **Loading** → calls `POST /api/exams/generate` (RAG + AI generation)
3. **Exam screen** → one question at a time with progress bar, question navigator dots, prev/next navigation. Confirm locks answer via `POST /api/exams/[id]/answer`.
4. **Results screen** → animated score percentage, correct/total badge, AI-generated feedback, expandable answer key per question, retake/new exam buttons.

**Backend pipeline:**
- `POST /api/exams/generate` → freemium check → RAG retrieval → direct real questions OR AI generation → creates `exams` + `exam_questions` rows
- `POST /api/exams/[examId]/answer` → validates ownership → compares answer → updates `exam_questions`
- `POST /api/exams/[examId]/finish` → scores exam → GPT-4o-mini feedback (max 200 words, pt-BR) → updates exam status to `completed`

**Server actions** (`app/actions/exams.ts`): `getUserExams`, `getExamWithQuestions`, `generateExam`, `submitAnswer`, `finishExam`

**Question sources:** Real ENEM questions from `enem_questions` table (via RAG) or AI-generated with RAG context as reference. Each question row tracks `source: "enem_real" | "ai_generated"` and optional `exam_year`.

### AI-Powered Flashcards
Route: `/dashboard/flashcards`

**User flow:**
1. Setup screen → pick topic and card count (5/10/15/20)
2. Loading → calls `POST /api/flashcards/generate` (RAG + AI generation)
3. Review screen → card with front/back, flip on tap
4. After flip → "Sei" / "Não sei" buttons
5. Results screen → stats + AI feedback

**Backend:** `POST /api/flashcards/generate` → freemium check → RAG retrieval from `enem_questions` → GPT-4o-mini generates ENEM-style flashcards → creates `flashcard_decks` + `flashcard_cards` rows.

Card format: front (question/concept at ENEM cognitive level) + back (answer with reasoning). Grounded in real ENEM content via RAG.

All UI text must remain in Brazilian Portuguese (pt-BR).