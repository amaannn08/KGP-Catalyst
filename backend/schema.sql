-- ──────────────────────────────────────────────────────────────────────────────
-- KGP Catalyst — NeonDB Schema Setup
-- Run these commands in the Neon SQL Editor or via psql.
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Enable the pgvector extension
--    (NeonDB has pgvector pre-installed; just needs enabling per DB)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the knowledge table
--    - content:   the raw text chunk from Reddit
--    - metadata:  JSONB with author, score, subreddit, post type, etc.
--    - embedding: 768-dimension vector (Gemini text-embedding-004 output dimension)
CREATE TABLE IF NOT EXISTS campus_knowledge (
    id        BIGSERIAL PRIMARY KEY,
    content   TEXT        NOT NULL,
    metadata  JSONB       DEFAULT '{}',
    embedding VECTOR(768)  NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create an IVFFlat index for fast approximate nearest-neighbour search.
--    Run AFTER bulk ingestion for best performance.
--    lists = SQRT(number_of_rows) is a good rule of thumb.
--    For ~10k rows use lists = 100; for ~100k rows use lists = 316.
CREATE INDEX IF NOT EXISTS campus_knowledge_embedding_idx
    ON campus_knowledge
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- 4. Optional: index on metadata fields for filtering
CREATE INDEX IF NOT EXISTS campus_knowledge_metadata_idx
    ON campus_knowledge USING GIN (metadata);

-- ──────────────────────────────────────────────────────────────────────────────
-- Helpful queries for debugging
-- ──────────────────────────────────────────────────────────────────────────────

-- Count total chunks:
-- SELECT COUNT(*) FROM campus_knowledge;

-- Inspect a sample:
-- SELECT id, LEFT(content, 100), metadata FROM campus_knowledge LIMIT 5;

-- Test cosine similarity search (replace the zeros with a real embedding):
-- SELECT content, 1 - (embedding <=> '[0,0,...0]'::vector) AS similarity
-- FROM campus_knowledge
-- ORDER BY embedding <=> '[0,0,...0]'::vector
-- LIMIT 5;
