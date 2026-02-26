-- ============================================
-- Knowledge Graph: Semantic Similarity Edges
-- ============================================
-- This function computes cosine similarity between all pairs of
-- chat embeddings for a given user, returning edges above a threshold.
--
-- Uses pgvector's <=> (cosine distance) operator.
-- Similarity = 1 - distance. Higher = more similar.
--
-- Run this in the Supabase SQL Editor.
-- ============================================

CREATE OR REPLACE FUNCTION get_chat_similarity_edges(
  p_user_id UUID,
  similarity_threshold FLOAT DEFAULT 0.45
)
RETURNS TABLE(source UUID, target UUID, value FLOAT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS source,
    b.id AS target,
    (1 - (a.embedding <=> b.embedding))::FLOAT AS value
  FROM chats a
  JOIN chats b
    ON a.user_id = b.user_id
    AND a.id < b.id          -- prevents duplicates (A-B only, not B-A) and self-loops
  WHERE a.user_id = p_user_id
    AND a.embedding IS NOT NULL
    AND b.embedding IS NOT NULL
    AND (1 - (a.embedding <=> b.embedding)) >= similarity_threshold;
END;
$$ LANGUAGE plpgsql STABLE;
