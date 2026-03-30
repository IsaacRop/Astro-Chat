-- ============================================
-- ENEM Questions: RAG-Powered Exam Practice
-- ============================================
-- Stores ENEM exam questions with pgvector embeddings
-- for semantic similarity search. Questions are retrieved
-- via match_enem_questions() using cosine distance.
--
-- Uses pgvector's <=> (cosine distance) operator.
-- Similarity = 1 - distance. Higher = more similar.
-- ============================================

create table if not exists enem_questions (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('enem_challenge', 'maritaca')),
  exam_year integer not null,
  question_number integer not null,
  area text check (area is null or area in ('linguagens', 'humanas', 'natureza', 'matematica')),
  question text not null,
  choices jsonb not null,
  answer text not null check (answer in ('A', 'B', 'C', 'D', 'E')),
  has_image boolean not null default false,
  image_url text,
  image_description text,
  embedding vector(1536) not null
);

-- Unique constraint for upsert deduplication (source + exam_year + question_number)
create unique index on enem_questions (source, exam_year, question_number);

-- HNSW index for fast approximate nearest-neighbor search (cosine distance)
create index on enem_questions using hnsw (embedding vector_cosine_ops);

-- Index for filtering by area
create index on enem_questions (area);

-- Index for filtering by exam year
create index on enem_questions (exam_year);

-- Enable RLS
alter table enem_questions enable row level security;

-- Allow authenticated users to read questions
create policy "Authenticated users can read enem_questions"
  on enem_questions for select
  to authenticated
  using (true);

-- ============================================
-- Match ENEM Questions: Semantic Similarity Search
-- ============================================
-- Returns the top N most similar questions to a given
-- query embedding, with optional area and minimum year filters.
--
-- Uses pgvector's <=> (cosine distance) operator.
-- Similarity = 1 - distance. Higher = more similar.
-- ============================================

CREATE OR REPLACE FUNCTION match_enem_questions(
  query_embedding vector(1536),
  match_count int,
  filter_area text DEFAULT NULL,
  filter_year_min int DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  source text,
  exam_year integer,
  question_number integer,
  area text,
  question text,
  choices jsonb,
  answer text,
  has_image boolean,
  image_url text,
  image_description text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    eq.id,
    eq.source,
    eq.exam_year,
    eq.question_number,
    eq.area,
    eq.question,
    eq.choices,
    eq.answer,
    eq.has_image,
    eq.image_url,
    eq.image_description,
    (1 - (eq.embedding <=> query_embedding))::float AS similarity
  FROM enem_questions eq
  WHERE (filter_area IS NULL OR eq.area = filter_area)
    AND (filter_year_min IS NULL OR eq.exam_year >= filter_year_min)
  ORDER BY eq.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;
