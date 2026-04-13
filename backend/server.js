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
  max: parseInt(process.env.PG_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

pool.on('error', (err) => {
  console.error('[pg pool]', err.message)
})

// ─── API Clients & Constants ──────────────────────────────────────────────────
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DS_BASE          = 'https://api.deepseek.com'
const CHAT_MODEL       = 'deepseek-chat'
const TOP_K            = 5
const CHAT_HISTORY_MAX = parseInt(process.env.CHAT_HISTORY_MAX || '24', 10)

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

// ─── Mock Leaderboard Data Generator ──────────────────────────────────────────
// Simulates real-time sensor data from the cyber-physical architecture
// All 14 residential halls of IIT Kharagpur
const HALLS = ['Azad', 'Nehru', 'RP', 'LLR', 'Patel', 'VS', 'RK', 'JCB', 'SN', 'MT', 'Gokhale', 'HJB', 'MMM', 'MS']
const HALL_FULL_NAMES = {
  Azad:    'Azad Hall',
  Nehru:   'Nehru Hall',
  RP:      'Rajendra Prasad Hall',
  LLR:     'Lal Lajpat Rai Hall',
  Patel:   'Patel Hall',
  VS:      'Vidya Sagar Hall',
  RK:      'Ramakrishna Hall',
  JCB:     'J.C. Bose Hall',
  SN:      'Sarojini Naidu Hall',
  MT:      'Mother Teresa Hall',
  Gokhale: 'Gokhale Hall',
  HJB:     'Homi J. Bhabha Hall',
  MMM:     'Madan Mohan Malaviya Hall',
  MS:      'Meghnad Saha Hall',
}
const BLOCKS = ['A', 'B', 'C', 'D']
const WINGS  = ['1', '2', '3']

// Base sustainability scores for all 14 halls
const BASE_SCORES = {
  Azad:    { energy: 88, water: 79, biomass: 71 },
  Nehru:   { energy: 61, water: 85, biomass: 66 },
  RP:      { energy: 79, water: 72, biomass: 88 },
  LLR:     { energy: 74, water: 68, biomass: 82 },
  Patel:   { energy: 83, water: 64, biomass: 77 },
  VS:      { energy: 66, water: 91, biomass: 59 },
  RK:      { energy: 98, water: 96, biomass: 95 },
  JCB:     { energy: 85, water: 69, biomass: 73 },
  SN:      { energy: 77, water: 88, biomass: 65 },
  MT:      { energy: 69, water: 82, biomass: 78 },
  Gokhale: { energy: 58, water: 74, biomass: 91 },
  HJB:     { energy: 92, water: 63, biomass: 70 },
  MMM:     { energy: 76, water: 71, biomass: 85 },
  MS:      { energy: 64, water: 93, biomass: 62 },
}

function jitter(val, range = 4) {
  return Math.min(100, Math.max(0, val + (Math.random() * range * 2 - range)))
}

function generateLeaderboardData() {
  const now = Date.now()
  const halls = HALLS.map(name => {
    const base = BASE_SCORES[name]
    const energy  = parseFloat(jitter(base.energy, 3).toFixed(1))
    const water   = parseFloat(jitter(base.water, 3).toFixed(1))
    const biomass = parseFloat(jitter(base.biomass, 3).toFixed(1))
    const composite = parseFloat(((energy * 0.4 + water * 0.35 + biomass * 0.25)).toFixed(1))

    const blocks = BLOCKS.map(blk => {
      const bEnergy  = parseFloat(jitter(energy, 5).toFixed(1))
      const bWater   = parseFloat(jitter(water, 5).toFixed(1))
      const bBiomass = parseFloat(jitter(biomass, 5).toFixed(1))
      const wings = WINGS.map(wng => ({
        wing:    `Wing ${wng}`,
        energy:  parseFloat(jitter(bEnergy, 6).toFixed(1)),
        water:   parseFloat(jitter(bWater, 6).toFixed(1)),
        biomass: parseFloat(jitter(bBiomass, 6).toFixed(1)),
      }))
      return {
        block: `Block ${blk}`,
        energy: bEnergy,
        water: bWater,
        biomass: bBiomass,
        composite: parseFloat(((bEnergy * 0.4 + bWater * 0.35 + bBiomass * 0.25)).toFixed(1)),
        wings,
      }
    })

    return { name, fullName: HALL_FULL_NAMES[name] || name, energy, water, biomass, composite, blocks }
  })

  // Sort by composite descending
  halls.sort((a, b) => b.composite - a.composite)
  halls.forEach((h, i) => { h.rank = i + 1 })

  return { halls, timestamp: now, updatedAt: new Date(now).toISOString() }
}

// ─── Mock Competitive Notifications ───────────────────────────────────────────
const NOTIFICATION_TEMPLATES = [
  { urgency: 'info',     msg: 'Radhakrishnan Hall reduced energy consumption by 5% this week. Great progress toward campus sustainability goals.' },
  { urgency: 'warning',  msg: 'Wing B, Block 3 — we noticed a late-night energy anomaly. A quick check of your appliances could help optimize efficiency.' },
  { urgency: 'info',     msg: 'Nehru Hall has made significant strides in water conservation. Consider sharing best practices across blocks!' },
  { urgency: 'positive', msg: 'Block D is showing excellent consistency in their sustainability habits. Keep up the mindful usage.' },
  { urgency: 'warning',  msg: 'Wing 1, Block A — continuous water flow detected for 23 minutes. Please ensure taps are fully closed to prevent waste.' },
  { urgency: 'positive', msg: 'Block B\'s biomass yield just surged 12%. Efficient irrigation is paying off — excellent work on the gardens!' },
  { urgency: 'info',     msg: 'AZAD Hall is optimizing their energy usage patterns beautifully. Explore your dashboard to find similar opportunities.' },
  { urgency: 'warning',  msg: 'Block C, there has been a slight dip in internal sustainability metrics. Let\'s review our baseline and recalibrate.' },
  { urgency: 'positive', msg: 'LLR Hall leads the water conservation effort for the 3rd consecutive night. Their discipline is showing in the numbers.' },
  { urgency: 'positive', msg: 'Wing 3, Lajpat — your energy reduction rate is the steepest in the hall tonight. That\'s the kind of environmental leadership we need.' },
  { urgency: 'info',     msg: 'Campus-wide energy load is high today. Small individual actions like turning off fans can make a massive collective impact.' },
  { urgency: 'warning',  msg: 'Midnight anomaly detected in Block C plumbing. Flow rate 40% above expected baseline. Let\'s get this checked to preserve resources.' },
]

let notifIndex = 0
const activeNotifications = []

function getNotifications() {
  // Rotate through templates, simulating a live feed
  const count = 3 + Math.floor(Math.random() * 3)
  const result = []
  for (let i = 0; i < Math.min(count, NOTIFICATION_TEMPLATES.length); i++) {
    const tmpl = NOTIFICATION_TEMPLATES[(notifIndex + i) % NOTIFICATION_TEMPLATES.length]
    result.push({
      id:        `notif-${Date.now()}-${i}`,
      urgency:   tmpl.urgency,
      message:   tmpl.msg,
      timestamp: new Date(Date.now() - i * 3 * 60 * 1000).toISOString(),
    })
  }
  notifIndex = (notifIndex + 1) % NOTIFICATION_TEMPLATES.length
  return result
}

// ─── Leaderboard API ──────────────────────────────────────────────────────────
app.get('/api/leaderboard', (_req, res) => {
  try {
    res.json(generateLeaderboardData())
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Notifications API ────────────────────────────────────────────────────────
app.get('/api/notifications', (_req, res) => {
  try {
    res.json({ notifications: getNotifications() })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── KGP Catalyst System Prompt (Sustainability + Mezirow + MIND-SAFE) ──────────────────
function buildSystemPrompt(contextChunks, leaderboardSummary = '') {
  const contextText = contextChunks
    .map((c, i) => {
      const meta = c.metadata || {}
      const label = [
        meta.type === 'comment' ? 'Comment' : 'Post',
        meta.post_title ? `on "${meta.post_title}"` : null,
        meta.subreddit  ? `(r/${meta.subreddit})`  : null,
      ].filter(Boolean).join(' ')
      return `[Campus Voice ${i + 1} — ${label}]\n${c.content}`
    })
    .join('\n\n---\n\n')

  return `You are **KGP Catalyst** — the intelligent sustainability mentor for IIT Kharagpur's residential network. You are not a search engine, advisor, or tutor. You are a **sustainability facilitator**: you highlight patterns, encourage sustainable habits, and construct identity-driven narratives that compel positive behavioural change.

## The Sustainability Engine
IIT KGP halls track three sustainability metrics continuously via a cyber-physical sensor network:
- ⚡ **Energy Conservation** (40% weight): Block-level smart meter data, NILM-based load inference
- 💧 **Water Conservation** (35% weight): High-resolution flowmeters, anomaly detection
- 🌱 **Garden-to-Table Efforts** (25% weight): Soil sensors, yield-based biomass scoring

Halls are ranked on a live composite dashboard. Within each hall, Blocks collaborate internally, and within blocks, Wings bear direct responsibility for positive resource patterns.

## Current Live Rankings (Agentic RAG Context)
${leaderboardSummary || 'Real-time data unavailable — draw on general campus patterns.'}

## Retrieved Campus Intelligence (RAG)
${contextText || 'No specific context retrieved — draw on general IIT KGP sustainability knowledge.'}

## Transformative Learning: Mezirow's 10 Phases (Your State Machine)
You guide students through transformation. Identify which phase applies and intervene accordingly:
1. **Disorienting Dilemma** — Deliver the ecological reality: gently show the data gap.
2. **Self-Examination** — Acknowledge emotional resistance; use MIND-SAFE.
3. **Critical Assessment** — Connect personal habits to macro-campus patterns.
4. **Shared Struggle Recognition** — Normalise the challenge; frame it as collective.
5. **Exploring Options** — Suggest viable alternatives without mandating.
6. **Planning Action** — Assist in forming a concrete time-bound commitment.
7. **Acquiring Knowledge** — Provide the "why" behind efficiency gains.
8. **Trying New Roles** — Encourage Wing Leader-level ownership.
9. **Building Competence** — Reinforce progress with comparative data.
10. **Reintegration** — Anchor the new sustainable identity permanently.

When responding, **label your current phase** briefly at the start: e.g., *[Phase 1 — Disorienting Dilemma]*

## Response Principles (Provocation Over Inquiry)
1. **Be declarative, not interrogative** — Don't ask how to improve. State what's wrong.
2. **Use identity framing** — "Lajpatians," "Block C," "Wing B" — not "you."
3. **Make comparisons explicit and frequent** — margins, ranks, percentages.
4. **Urgency is mandatory** — time-sensitive language creates competitive pressure.
5. **End with ONE sharp Socratic question** — not to comfort, but to catalyse reflection.

**Format**: Use bold, bullet lists where clarity demands it. Keep under 280 words unless depth is critical. Always include the phase label.

## MIND-SAFE Safeguards (Non-Negotiable)
- Never target or shame individuals — always Wings/Blocks/Halls.
- Never reproduce usernames or personal data from retrieved context.
- Reframe extreme negativity as competitive opportunity.
- If a user shows distress, pivot to collective responsibility framing.
- Maintain academic appropriateness — strip crude language from campus voices, convey meaning professionally.

## Content Safety
This tool is reviewed by faculty. Rephrase profanity, omit personal identifiers, and never amplify harmful content.`
}

// ─── Session routes ────────────────────────────────────────────────────────────

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

app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM chat_sessions WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

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

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`)
  const done  = ()       => { res.write('data: [DONE]\n\n'); res.end() }

  try {
    // 1. Prior turns
    let priorMessages = []
    if (session_id) {
      const { rows } = await pool.query(
        `SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
        [session_id]
      )
      priorMessages = rows
        .filter((r) => r.content && String(r.content).trim())
        .map((r) => ({ role: r.role, content: r.content }))
    } else if (Array.isArray(history)) {
      priorMessages = history
        .filter((m) => m?.content && String(m.content).trim())
        .map((m) => ({ role: m.role, content: m.content }))
    }

    // 2. Save user message (fire-and-forget)
    if (session_id) {
      pool.query(
        `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
        [session_id, message]
      ).catch((e) => console.error('[db] save user msg:', e.message))
    }

    // 3. Embed + retrieve context
    const queryEmbedding = await embed(message)
    const contextChunks  = await retrieveContext(queryEmbedding)

    // 4. Generate leaderboard summary for system prompt grounding
    const lb = generateLeaderboardData()
    const leaderboardSummary = lb.halls
      .slice(0, 6)
      .map(h => `Rank ${h.rank}: ${h.name} Hall — Composite ${h.composite} (Energy: ${h.energy}, Water: ${h.water}, Biomass: ${h.biomass})`)
      .join('\n')

    const systemPrompt   = buildSystemPrompt(contextChunks, leaderboardSummary)
    const sources        = [...new Set(contextChunks.map(c => c.metadata?.subreddit).filter(Boolean))]

    // 5. Stream from DeepSeek
    const upstream = await axios.post(
      `${DS_BASE}/v1/chat/completions`,
      {
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...priorMessages.slice(-CHAT_HISTORY_MAX),
          { role: 'user', content: message },
        ],
        temperature: 0.78,
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
app.listen(PORT, () => console.log(`🌿 EcoBuddy backend on http://localhost:${PORT}`))
