-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to chats table (1536 dimensions for text-embedding-3-small)
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Create HNSW Index to optimize searching
CREATE INDEX IF NOT EXISTS chats_embedding_idx ON public.chats USING hnsw (embedding vector_cosine_ops);

-- 4. Create Postgres Function for edge match distances
CREATE OR REPLACE FUNCTION match_chats (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM chats c
  WHERE c.user_id = p_user_id 
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
