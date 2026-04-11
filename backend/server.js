import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pg from 'pg'
import axios from 'axios'
import { embed } from './services/embeddings.js'

dotenv.config()

const PORT = parseInt(process.env.PORT || '5000', 10)

const app = express()

// ─── CORS ──────────────────────────────────────────────────────────────────────
// Allow Vite dev server (5173/5174) and same-host production deployments
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  `http://localhost:${PORT}`,
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
]

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    return cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.use(express.json({ limit: '4mb' }))

// Simple request logger for dev
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  }
  next()
})

// ─── NeonDB Connection Pool ────────────────────────────────────────────────────
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
})


// ─── API Clients & Constants ──────────────────────────────────────────────────
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DS_BASE          = 'https://api.deepseek.com'
const CHAT_MODEL       = 'deepseek-chat'         // DeepSeek for chat
const TOP_K            = 5                       // Context chunks to retrieve

// embed() is imported from ./services/embeddings.js — same client used by ingest

// ─── pgvector similarity search ───────────────────────────────────────────────
async function retrieveContext(queryEmbedding, topK = TOP_K) {
  const vectorStr = `[${queryEmbedding.join(',')}]`
  const result = await pool.query(
    `SELECT content, metadata,
            1 - (embedding <=> $1::vector) AS similarity
     FROM campus_knowledge
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vectorStr, topK]
  )
  return result.rows
}

// ─── Build the Socratic system prompt ─────────────────────────────────────────
function buildSystemPrompt(contextChunks) {
  // Format context — show type and topic only, no author/URL attribution
  const contextText = contextChunks
    .map((c, i) => {
      const meta = c.metadata || {}
      const label = [
        meta.type === 'comment' ? 'Comment' : 'Post',
        meta.post_title ? `on "${meta.post_title}"` : null,
        meta.subreddit  ? `(r/${meta.subreddit})`  : null,
      ].filter(Boolean).join(' ')
      return `[Source ${i + 1} — ${label}]\n${c.content}`
    })
    .join('\n\n---\n\n')

  return `You are **KGP Catalyst** — a thoughtful, empathetic Socratic companion for students at IIT Kharagpur (KGP). You are built on **Transformative Learning Theory**: rather than giving flat answers, you help students examine their assumptions, habits, and values through reflective dialogue.

## Your Persona
- You are NOT a search engine. You are a warm, trusted guide — like a senior student who genuinely cares.
- You ground your responses in real campus experiences, referencing the student voices provided below.
- You gently challenge assumptions and invite reflection without being preachy or moralistic.

## Retrieved Campus Context (RAG)
The following are real posts and comments from IIT KGP students on Reddit. Use them as authentic evidence for your response:

${contextText || 'No specific context retrieved — draw on general IIT KGP knowledge.'}

## Response Style
1. **Answer** the user's question concisely, grounded in the retrieved campus voices above.
2. **Reflect** — end with one gentle Socratic question that invites the user to examine their own habits or assumptions.
3. **Format** — use markdown (bold, lists) when it aids clarity. Keep responses under 300 words unless depth is genuinely needed.

## Content Safety (MANDATORY)
This tool is used in an **academic setting and will be reviewed by faculty**. You MUST:
- **Rephrase or omit** any profanity, crude slang, or vulgar language found in the source material — convey the meaning professionally instead.
- **Never reproduce** personally identifying information (usernames, account names, specific personal details).
- **Do not amplify** rants, hate speech, politically inflammatory content, or content that demeans individuals or groups.
- If a retrieved context contains inappropriate material, extract the **underlying theme or concern** and discuss that constructively instead.
- Maintain a respectful, constructive, and academically appropriate tone at all times.

## MIND-SAFE Framework (Psychological Safety)
- **M**eet the user where they are — don't assume their stance.
- **I**nvite reflection, don't demand change.
- **N**ormalise struggle — stress and confusion are valid.
- **D**on't catastrophise — reframe challenges as growth opportunities.
- **S**upport autonomy — the user's choices are theirs to make.
- **A**cknowledge emotions before pivoting to analysis.
- **F**ocus on curiosity, not judgment.
- **E**nd with an opening, not a conclusion.`
}

// ─── Session routes ────────────────────────────────────────────────────────────

// GET /api/sessions?device_id=xxx  — list sessions (newest first)
app.get('/api/sessions', async (req, res) => {
  const { device_id } = req.query
  if (!device_id) return res.status(400).json({ error: 'device_id required' })
  try {
    const { rows } = await pool.query(
      `SELECT id, title, created_at, updated_at
       FROM chat_sessions
       WHERE device_id = $1
       ORDER BY updated_at DESC
       LIMIT 50`,
      [device_id]
    )
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/sessions  — create session
app.post('/api/sessions', async (req, res) => {
  const { device_id, title = 'New conversation' } = req.body
  if (!device_id) return res.status(400).json({ error: 'device_id required' })
  try {
    const { rows } = await pool.query(
      `INSERT INTO chat_sessions (device_id, title)
       VALUES ($1, $2) RETURNING id, title, created_at, updated_at`,
      [device_id, title]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PATCH /api/sessions/:id  — update title
app.patch('/api/sessions/:id', async (req, res) => {
  const { title } = req.body
  try {
    await pool.query(
      `UPDATE chat_sessions SET title = $1, updated_at = NOW() WHERE id = $2`,
      [title, req.params.id]
    )
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/sessions/:id  — delete session + all its messages (CASCADE)
app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM chat_sessions WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/sessions/:id/messages  — load message history
app.get('/api/sessions/:id/messages', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, role, content, sources, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    )
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})


// ─── /api/chat — SSE streaming endpoint ──────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history = [], session_id } = req.body

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' })
  }

  // ── SSE headers ───────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`)
  const done  = ()       => { res.write('data: [DONE]\n\n'); res.end() }

  try {
    // 1. Save user message to DB (fire-and-forget, don't block stream)
    if (session_id) {
      pool.query(
        `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
        [session_id, message]
      ).catch(e => console.error('[db] save user msg:', e.message))
    }

    // 2. Embed + retrieve context
    const queryEmbedding = await embed(message)
    const contextChunks  = await retrieveContext(queryEmbedding)
    const systemPrompt   = buildSystemPrompt(contextChunks)
    const sources        = [...new Set(contextChunks.map(c => c.metadata?.subreddit).filter(Boolean))]

    // 3. Stream from DeepSeek
    const upstream = await axios.post(
      `${DS_BASE}/v1/chat/completions`,
      {
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message },
        ],
        temperature: 0.72,
        max_tokens: 1024,
        stream: true,
      },
      {
        headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
        responseType: 'stream',
      }
    )

    let buf = '', fullContent = ''

    upstream.data.on('data', (chunk) => {
      buf += chunk.toString()
      const lines = buf.split('\n')
      buf = lines.pop()
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const raw = trimmed.slice(5).trim()
        if (raw === '[DONE]') continue
        try {
          const content = JSON.parse(raw).choices?.[0]?.delta?.content
          if (content) { fullContent += content; send({ type: 'token', content }) }
        } catch { /* ignore malformed */ }
      }
    })

    upstream.data.on('end', () => {
      // 4. Save completed AI message to DB
      if (session_id && fullContent) {
        pool.query(
          `INSERT INTO chat_messages (session_id, role, content, sources) VALUES ($1, 'assistant', $2, $3)
           ON CONFLICT DO NOTHING`,
          [session_id, fullContent, JSON.stringify(sources)]
        ).then(() =>
          pool.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [session_id])
        ).catch(e => console.error('[db] save ai msg:', e.message))
      }
      send({ type: 'sources', sources })
      done()
    })

    upstream.data.on('error', (err) => {
      console.error('[stream error]', err.message)
      send({ type: 'error', error: 'Stream interrupted' })
      done()
    })

    req.on('close', () => upstream.data.destroy())

  } catch (err) {
    console.error('[/api/chat] Error:', err?.response?.data ?? err.message)
    send({ type: 'error', error: err?.response?.data?.error?.message ?? 'Internal server error' })
    done()
  }
})

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    return res.json({ status: 'ok', db: 'connected' })
  } catch (e) {
    return res.status(500).json({ status: 'error', db: e.message })
  }
})

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 KGP Catalyst backend on http://localhost:${PORT}`))

// Note: no pool.end() signal handlers.
// node --watch sends SIGTERM on file-change restarts; calling pool.end() there
// kills in-flight requests. NeonDB is serverless — idle connections close
// automatically via idleTimeoutMillis. Production containers (Render/Railway)
// just SIGKILL after SIGTERM anyway.


