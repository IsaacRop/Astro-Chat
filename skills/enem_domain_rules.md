---
name: enem_domain_rules
description: All ENEM pedagogy logic, knowledge mapping, RAG pipeline, exam/flashcard generation rules, and exam-specific constraints. Used by @tutor agents.
---

# ENEM Domain Rules

## Context

**ENEM** (Exame Nacional do Ensino Médio) is Brazil's national high-school exit exam. All features in Otto are oriented around helping students prepare for ENEM. **All UI text and AI output must remain in Brazilian Portuguese (pt-BR).**

## Subject Areas

| Area code | Full name |
|-----------|-----------|
| `linguagens` | Linguagens, Códigos e suas Tecnologias |
| `humanas` | Ciências Humanas e suas Tecnologias |
| `natureza` | Ciências da Natureza e suas Tecnologias |
| `matematica` | Matemática e suas Tecnologias |
| `redacao` | Redação |

## ENEM RAG Pipeline (`lib/rag/enem-retriever.ts`)

Retrieves real ENEM questions from Supabase using pgvector semantic search.

### `retrieveEnemQuestions({ query, area?, yearMin?, matchCount? })`

1. Embeds `query` via OpenAI `text-embedding-3-small`
2. Calls `match_enem_questions()` RPC (cosine similarity on pgvector)
3. Fetches 4× the requested pool, shuffles for **year diversity**, returns deduplicated results

### `enem_questions` Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `source` | text | `enem_challenge` or `maritaca` |
| `exam_year` | int | Year of the original exam |
| `question_number` | int | Question number within exam |
| `area` | text | One of the 4 area codes above |
| `question` | text | Full question text (pt-BR) |
| `choices` | jsonb | Multiple-choice options |
| `answer` | text | Correct answer key |
| `has_image` | bool | Whether question requires image |
| `image_url` | text | URL if image is present |
| `image_description` | text | Alt description of image |
| `embedding` | vector(1536) | OpenAI `text-embedding-3-small` embedding |

- **HNSW index** on `embedding` for fast ANN search
- **RPC:** `match_enem_questions(query_embedding, match_count, filter_area, filter_year_min)`
- **RLS:** authenticated users have read-only access

### Data Sources

| Dataset | Years | Size | Notes |
|---------|-------|------|-------|
| `eduagarcia/enem_challenge` | 2009–2017 | ~9k questions | Text-only |
| `maritaca-ai/enem` | 2022–2024 | ~3k questions | Includes images |

## Dynamic System Prompts

Otto's system prompt is layered: `BASE_SYSTEM_PROMPT` defines the Otto identity (~800 tokens). Subject-specific context blocks (~500 tokens each) are injected based on **keyword detection** in the user's message:

- `CONTEXT_LINGUAGENS` — injected when Linguagens/Português/Literatura keywords detected
- `CONTEXT_HUMANAS` — injected when História/Geografia/Filosofia/Sociologia keywords detected  
- `CONTEXT_NATUREZA` — injected when Física/Química/Biologia keywords detected
- `CONTEXT_MATEMATICA` — injected when Matemática keywords detected
- `CONTEXT_REDACAO` — injected when Redação/Dissertação/Texto keywords detected

`getContextForMessage(userMessage)` → `buildSystemPrompt(userMessage)` in `lib/prompts/otto-system.ts`.

## Exam Generation (`/api/exams/generate`)

### Question Types
- Multiple choice
- True/false

### Count options
5, 10, 15, 20, 30, 45 questions

### Generation Modes

| Mode | Condition | Source tag |
|------|-----------|------------|
| **Direct mode** | Multiple-choice AND enough real ENEM questions found via RAG | `"enem_real"` |
| **AI generation mode** | Fallback when real questions insufficient | `"ai_generated"` |

In AI generation mode, GPT-4o-mini generates **ENEM-style questions** with RAG context as reference.  
Each question row tracks `source: "enem_real" | "ai_generated"` and optional `exam_year`.

### Exam Pipeline

1. `POST /api/exams/generate` → freemium check → RAG retrieval → direct real questions OR AI generation → creates `exams` + `exam_questions` rows → returns `{ examId }`
2. `POST /api/exams/[examId]/answer` → validates ownership → compares answer → updates `exam_questions` → returns `{ isCorrect, correctAnswer, explanation }`
3. `POST /api/exams/[examId]/finish` → computes score → GPT-4o-mini feedback (**max 200 words, pt-BR**) → updates exam status to `completed` → returns `{ exam, questions }`

### User Flow (UI `/dashboard/provas`)

1. **Setup:** pick question type, topic, count; shows past exams list + usage bar for free users
2. **Loading:** calls `POST /api/exams/generate`
3. **Exam screen:** one question at a time, progress bar, question navigator dots, prev/next navigation; Confirm locks answer
4. **Results:** animated score %, correct/total badge, AI feedback (pt-BR), expandable answer key, retake/new exam buttons

## Flashcard Generation (`/api/flashcards/generate`)

Body: `{ topic, cardCount }` → returns `{ deckId }`

### Card Format

- **Front:** question or concept at **ENEM cognitive level**
- **Back:** answer with reasoning, grounded in real ENEM content via RAG

Card counts: 5, 10, 15, 20

### Flashcard Pipeline

1. Freemium check
2. RAG retrieval from `enem_questions`
3. GPT-4o-mini generates ENEM-style flashcards
4. Creates `flashcard_decks` + `flashcard_cards` rows

### User Flow (UI `/dashboard/flashcards`)

1. Setup → pick topic and card count
2. Loading → calls `POST /api/flashcards/generate`
3. Review → card with front/back, flip on tap
4. After flip → "Sei" / "Não sei" buttons
5. Results → stats + AI feedback

## Knowledge Mapping Rules

- Embeddings use **OpenAI `text-embedding-3-small`** (1536 dimensions)
- Semantic similarity edges computed via `get_chat_similarity_edges` pgvector RPC
- Chat nodes are labeled with auto-generated **Portuguese topic labels** (via `gpt-4o-mini`)
- Node size in graph = message count (`val`)
- Notes are linked to chat nodes via localStorage UUID pointer only (never content)

## Pedagogical Constraints

- All AI output **must be in Brazilian Portuguese (pt-BR)**
- Otto is defined as an **ENEM specialist** in the base system prompt
- AI-generated questions must match **ENEM cognitive level and style**
- Exam feedback generated by GPT-4o-mini must be **max 200 words**, in pt-BR
- Chat context capped at **last 6 messages**; output capped at **500 tokens**
