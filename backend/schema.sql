-- schema.sql — KGP Catalyst NeonDB schema
-- Run once to set up. Safe to re-run (all statements use IF NOT EXISTS / IF EXISTS).

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- for gen_random_uuid()

-- ─── RAG knowledge store ──────────────────────────────────────────────────────
-- Drop and recreate only if you need to change vector dimensions.
-- embedding: 1536 dims → gemini-embedding-001 via @google/genai
CREATE TABLE IF NOT EXISTS campus_knowledge (
  id         BIGSERIAL    PRIMARY KEY,
  content    TEXT         NOT NULL,
  metadata   JSONB        NOT NULL DEFAULT '{}',
  embedding  VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campus_knowledge_embedding_idx
  ON campus_knowledge
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS campus_knowledge_content_idx
  ON campus_knowledge USING gin(to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS campus_knowledge_metadata_idx
  ON campus_knowledge USING gin(metadata);

-- ─── Chat sessions ────────────────────────────────────────────────────────────
-- device_id identifies a browser (generated once in localStorage, no auth needed).
CREATE TABLE IF NOT EXISTS chat_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  TEXT        NOT NULL,
  title      TEXT        NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_sessions_device_idx
  ON chat_sessions (device_id, updated_at DESC);

-- ─── Chat messages ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT        NOT NULL,
  sources    JSONB       NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_session_idx
  ON chat_messages (session_id, created_at ASC);
