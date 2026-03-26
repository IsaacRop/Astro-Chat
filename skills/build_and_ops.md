---
name: build_and_ops
description: Build, test, lint commands and environment setup for the Astro-Chat project. Used by @ops agents.
---

# Build & Operations

## Commands

```bash
pnpm dev          # Start dev server at localhost:3000
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Required Environment Variables

Create a `.env.local` file in the project root with the following:

```env
OPENAI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # only needed for deleteAccount()
```

## Python Data Ingestion (ENEM Dataset)

Located in `scripts/ingest_enem.py`. Loads ENEM questions from HuggingFace, generates OpenAI embeddings, and upserts into Supabase.

**Install Python deps first:**
```bash
pip install -r scripts/requirements.txt
# packages: datasets, openai, supabase, python-dotenv
```

**Data sources ingested:**
- `eduagarcia/enem_challenge` — 2009–2017 (~9k questions, text-only)
- `maritaca-ai/enem` — 2022–2024 (~3k questions, includes images)

## Supabase Migrations

All migrations live in `supabase/migrations/`. Apply with the Supabase CLI:

```bash
supabase db push
```

Key migration files:
- `20260322_usage_limits_5h_window.sql` — Freemium rolling-window usage table
- `20260326_create_enem_questions.sql` — ENEM questions table with pgvector HNSW index

## Middleware

`middleware.ts` runs on `/dashboard/*`, `/cadernos/*`, and `/api/**`.  
**Do NOT remove the `supabase.auth.getUser()` call** — it keeps server-side sessions alive.

## Freemium Usage Limits

| Resource        | Limit | Window   |
|-----------------|-------|----------|
| Chat messages   | 10    | 5 hours  |
| Exams           | 3     | 5 hours  |
| Flashcard decks | 3     | 5 hours  |

Pro users have unlimited access. Counter auto-resets when `now > reset_at`.
