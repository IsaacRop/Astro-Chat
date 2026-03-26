---
name: otto_architecture
description: Project structure, Knowledge Graph pipeline, storage layer, and core tech stack for Astro/Otto. Used by @graph-master agents.
---

# Otto Architecture

## Overview

**Astro / Otto** is a Next.js 16 App Router application — a **Portuguese-language (pt-BR) educational AI assistant** focused on ENEM exam preparation. All UI text and AI prompts are in **Brazilian Portuguese**.

## Tech Stack

| Layer        | Technology |
|--------------|------------|
| Framework    | Next.js 16 (App Router) |
| Styling      | Tailwind CSS v4 (PostCSS plugin — no `tailwind.config.js`) |
| Database     | Supabase (PostgreSQL + pgvector) |
| AI Models    | `gpt-4o-mini` (chat/generation), `text-embedding-3-small` (embeddings) |
| AI SDK       | Vercel AI SDK (`streamText`) |
| Component UI | shadcn/ui-style (`class-variance-authority` + `clsx`/`tailwind-merge`) |
| Animations   | Framer Motion |
| Icons        | Lucide React |
| Toasts       | Sonner |
| Graph render | `react-force-graph-2d` |
| Fonts        | Inter (`--font-sans`), Playfair Display (`--font-serif`) |

## Storage: Supabase (Single Source of Truth)

**No localStorage data layer.** All content lives in Supabase.

**Tables:** `chats`, `messages`, `notes`, `tasks`, `ideas`, `bookmarks`, `calendar_events`, `feedbacks`, `profiles`, `exams`, `exam_questions`, `flashcard_decks`, `flashcard_cards`, `enem_questions`, `usage_limits`

| Client file                       | Usage context |
|-----------------------------------|---------------|
| `utils/supabase/server.ts`        | Server Components, server actions, route handlers |
| `utils/supabase/client.ts`        | Client Components |

Both clients throw a descriptive error if env vars are missing (no `!` assertions).

## Route Structure

| Route | Description |
|-------|-------------|
| `/` | Landing page with OctopusMascot |
| `/chat` | Redirects authenticated → `/dashboard/chat`, unauthenticated → home |
| `/cadernos` | Knowledge graph; `/cadernos/[nodeId]` shows node detail + notes editor |
| `/dashboard` | Auth-protected shell: chat, notes, provas, flashcards, tasks, calendar, ideas, favorites, settings |

## Authentication — Interaction Gate

Lazy/interaction-gate model: **unauthenticated users see all UI**, but any interaction triggers a login modal.

- `components/auth/auth-modal-provider.tsx` — Client Component context provider in `app/layout.tsx`
  - `isAuthenticated: boolean` — real-time session state
  - `requireAuth(callback?)` — runs callback if authed, shows modal if not
  - `openModal()` — imperative open
- `app/layout.tsx` passes `initialIsAuthenticated={!!user}` (server-resolved) to eliminate client flash
- `components/auth/auth-guard.tsx` — legacy hard-wall guard; **currently unused**, kept for reference
- Server actions independently call `supabase.auth.getUser()` (do NOT rely on client-side auth context)

## Server Actions (`app/actions/`)

| File | Responsibility |
|------|----------------|
| `chat.ts` | `getChatMessages`, `getUserChats` |
| `dashboard.ts` | `createNewChat` |
| `study.ts` | Knowledge graph (`getKnowledgeGraph`, `getChatById`), notes CRUD, `deleteChat` |
| `productivity.ts` | Tasks, ideas, bookmarks, calendar events |
| `profile.ts` | `updateProfile`, `deleteAccount`, `signOut` |
| `submit-feedback.ts` | `submitFeedback` |
| `exams.ts` | `getUserExams`, `getExamWithQuestions`, `generateExam`, `submitAnswer`, `finishExam` |
| `usage.ts` | `getUserPlan`, `getUserUsage`, `checkCanUse`, `incrementUsage` |

All delete operations perform an ownership check (`.eq("user_id", user.id)`) **before** deleting child records.

## Knowledge Graph Pipeline (`/cadernos`)

Visualises a force-directed graph of the user's chats.

1. When an AI response is saved, `POST /api/chat/save` calls `gpt-4o-mini` to generate a short **Portuguese topic label**, then `text-embedding-3-small` to embed it → stored in `chats.title` and `chats.embedding`.
2. `getKnowledgeGraph()` in `app/actions/study.ts` fetches chat nodes and calls the `get_chat_similarity_edges` pgvector RPC to produce semantic edges.
3. `components/GraphVisualization.tsx` renders via `react-force-graph-2d`. Node size scales with message count (`val`).
4. Clicking a node opens `components/NodeSlideOver.tsx`. Notes are saved to the `notes` Supabase table. A lightweight localStorage pointer (`teo-caderno-note-{chatId}`) stores only the note UUID — **never note content**.

## AI Chat (`/dashboard/chat`)

- `POST /api/chat` — streams via Vercel AI SDK (`streamText`, `gpt-4o-mini`)
  - Context capped at **last 6 messages**; output capped at **500 tokens**
  - System prompt built dynamically by `buildSystemPrompt()` from `lib/prompts/otto-system.ts`
- `POST /api/chat/save` — persists messages and triggers auto-title + embedding on first assistant reply
- `POST /api/chat/create` — lazy chat creation: Supabase row inserted only on first user message, not on page load
- Managed by `components/chat-interface.tsx`

## Dynamic System Prompts (`lib/prompts/otto-system.ts`)

| Export | Description |
|--------|-------------|
| `BASE_SYSTEM_PROMPT` | Otto as ENEM specialist (~800 tokens) |
| `CONTEXT_LINGUAGENS` | Subject block for Linguagens (~500 tokens) |
| `CONTEXT_HUMANAS` | Subject block for Ciências Humanas |
| `CONTEXT_NATUREZA` | Subject block for Ciências da Natureza |
| `CONTEXT_MATEMATICA` | Subject block for Matemática |
| `CONTEXT_REDACAO` | Subject block for Redação |
| `getContextForMessage(userMessage)` | Keyword matcher → selects relevant blocks |
| `buildSystemPrompt(userMessage)` | Combines base + matched context blocks |

## Freemium Usage System

Tracked per-resource with a **rolling 5-hour window** via `app/actions/usage.ts` + `usage_limits` table.

- `usage_limits` columns: `(user_id, resource_type, usage_count, reset_at)`
- When `now > reset_at`, counter auto-resets
- **Chat paywall**: `GET /api/chat` returns HTTP **403** `{ error: "PAYWALL_LIMIT_REACHED" }` when limit hit; frontend shows `<PaywallModal>` via `useChat` `onError`
- **Exam/Flashcard gates**: `checkCanUse("exam")` / `checkCanUse("flashcard")` called at route start
