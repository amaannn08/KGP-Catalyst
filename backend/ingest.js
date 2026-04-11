/**
 * ingest.js — KGP Catalyst Data Ingestion Pipeline
 *
 * Modes:
 *   node ingest.js          → one-shot: process entire file
 *   node ingest.js --watch  → continuous: tail new lines as scraper appends them
 *
 * State file: .ingest_state.json  (tracks byte offset so we never re-embed)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import { embedBatch, DIMENSIONS } from './services/embeddings.js'
import dotenv from 'dotenv'

dotenv.config()

// ─── Config ───────────────────────────────────────────────────────────────────
const JSONL_PATH    = process.env.JSONL_PATH || './iitkgp.jsonl'
const STATE_FILE    = path.join(path.dirname(fileURLToPath(import.meta.url)), '.ingest_state.json')
const EMBED_MODEL   = 'text-embedding-004'   // 768 dims
const CHUNK_MAX     = 1800
const OVERLAP       = 150
const MIN_CHUNK_LEN = 40
const BATCH_SIZE    = 100   // chunk accumulation size before flushing to DB
const POLL_INTERVAL = 10_000                 // ms between file checks in watch mode

const WATCH_MODE = process.argv.includes('--watch')

// embedBatch() imported from services/embeddings.js

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

// ─── State persistence (tracks byte offset) ───────────────────────────────────
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  } catch {
    return { offset: 0, total: 0 }
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

// ─── Text helpers ─────────────────────────────────────────────────────────────
function extractSubreddit(permalink = '') {
  const m = permalink.match(/^\/r\/([^/]+)/)
  return m ? m[1] : 'iitkgp'
}

function chunkText(text) {
  const chunks = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + CHUNK_MAX, text.length)
    const chunk = text.slice(start, end).trim()
    if (chunk.length >= MIN_CHUNK_LEN) chunks.push(chunk)
    if (end === text.length) break
    start = end - OVERLAP
  }
  return chunks
}

function extractChunks(post) {
  const subreddit = extractSubreddit(post.permalink)
  const units = []

  // ── Post body ──────────────────────────────────────────────────────────────
  const postBody = [
    post.title           ? `[Post] ${post.title}` : null,
    post.link_flair_text ? `[Flair] ${post.link_flair_text}` : null,
    post.selftext?.trim() || null,
  ].filter(Boolean).join('\n\n')

  if (postBody.length >= MIN_CHUNK_LEN) {
    for (const chunk of chunkText(postBody)) {
      units.push({
        text: chunk,
        meta: { type: 'post', post_title: post.title, subreddit, score: post.score, flair: post.link_flair_text },
      })
    }
  }

  // ── Nested comments ────────────────────────────────────────────────────────
  for (const comment of (post.comments ?? [])) {
    const body = comment.body?.trim()
    if (!body || body.length < MIN_CHUNK_LEN) continue
    if (body === '[deleted]' || body === '[removed]') continue

    const commentText = `[Thread: ${post.title}]\n\n${body}`
    for (const chunk of chunkText(commentText)) {
      units.push({
        text: chunk,
        meta: { type: 'comment', post_title: post.title, subreddit, score: comment.score },
      })
    }
  }

  return units
}

// ─── DB insert ────────────────────────────────────────────────────────────────
async function insertRow(content, metadata, embedding) {
  await pool.query(
    `INSERT INTO campus_knowledge (content, metadata, embedding)
     VALUES ($1, $2, $3::vector)
     ON CONFLICT DO NOTHING`,
    [content, JSON.stringify(metadata), `[${embedding.join(',')}]`]
  )
}

// ─── Process a list of {text, meta} units → embed + store ────────────────────
async function processBatch(queue) {
  if (queue.length === 0) return 0
  const texts = queue.map(q => q.text)
  const metas = queue.map(q => q.meta)

  process.stdout.write(`  ⚡ Embedding ${texts.length} chunks (${DIMENSIONS}d)…`)
  const embeddings = await embedBatch(texts)   // uses services/embeddings.js

  const CONCURRENCY = 5
  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, texts.length - i) }, (_, j) =>
        insertRow(texts[i + j], metas[i + j], embeddings[i + j])
      )
    )
  }
  console.log(` ✓`)
  return texts.length
}

// ─── Read NEW lines from file starting at `fromOffset` ───────────────────────
async function readNewLines(filePath, fromOffset) {
  const stat = fs.statSync(filePath)
  if (stat.size <= fromOffset) return { lines: [], newOffset: fromOffset }

  const buf = Buffer.alloc(stat.size - fromOffset)
  const fd  = fs.openSync(filePath, 'r')
  fs.readSync(fd, buf, 0, buf.length, fromOffset)
  fs.closeSync(fd)

  const raw   = buf.toString('utf8')
  const lines = raw.split('\n').filter(l => l.trim())
  return { lines, newOffset: stat.size }
}

// ─── Process a set of raw JSONL lines into the DB ─────────────────────────────
async function processLines(lines) {
  let queue   = []
  let total   = 0
  let skipped = 0

  for (const line of lines) {
    let post
    try { post = JSON.parse(line) } catch { skipped++; continue }

    if (post.type && post.type !== 'post') { skipped++; continue }
    if (!post.title && !post.selftext)     { skipped++; continue }

    const units = extractChunks(post)
    if (units.length === 0) { skipped++; continue }

    queue.push(...units)

    if (queue.length >= BATCH_SIZE) {
      total += await processBatch(queue.splice(0, BATCH_SIZE))
    }
  }

  total += await processBatch(queue)
  return { total, skipped }
}

// ─── One-shot mode ────────────────────────────────────────────────────────────
async function runOnce() {
  console.log('\n🌱 KGP Catalyst — One-shot Ingestion')
  console.log(`📂 File : ${JSONL_PATH}\n`)

  if (!fs.existsSync(JSONL_PATH)) {
    console.error(`❌ File not found: ${JSONL_PATH}`); process.exit(1)
  }

  const state = loadState()
  const { lines, newOffset } = await readNewLines(JSONL_PATH, state.offset)

  if (lines.length === 0) {
    console.log('✅ No new lines to process.')
    await pool.end(); return
  }

  console.log(`📄 Found ${lines.length} new lines (from byte ${state.offset} → ${newOffset})\n`)
  const { total, skipped } = await processLines(lines)

  state.offset  = newOffset
  state.total  += total
  saveState(state)

  console.log(`\n✅ Done!  +${total} chunks stored (${skipped} skipped) | Total ever: ${state.total}`)
  await pool.end()
}

// ─── Watch mode ───────────────────────────────────────────────────────────────
async function runWatch() {
  console.log('\n👁️  KGP Catalyst — Watch Mode (Ctrl+C to stop)')
  console.log(`📂 File : ${JSONL_PATH}`)
  console.log(`🕐 Poll : every ${POLL_INTERVAL / 1000}s\n`)

  if (!fs.existsSync(JSONL_PATH)) {
    console.log(`⏳ Waiting for file to appear: ${JSONL_PATH}`)
  }

  const tick = async () => {
    if (!fs.existsSync(JSONL_PATH)) return

    const state = loadState()
    const { lines, newOffset } = await readNewLines(JSONL_PATH, state.offset)

    if (lines.length === 0) {
      process.stdout.write(`\r⏳ ${new Date().toLocaleTimeString()} — watching for new data…   `)
      return
    }

    console.log(`\n📥 ${new Date().toLocaleTimeString()} — ${lines.length} new lines detected`)
    const { total, skipped } = await processLines(lines)

    state.offset  = newOffset
    state.total  += total
    saveState(state)

    console.log(`   ✅ +${total} chunks | ${skipped} skipped | Total ever: ${state.total}\n`)
  }

  // Run immediately then on interval
  await tick()
  setInterval(tick, POLL_INTERVAL)

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Watch stopped.')
    await pool.end()
    process.exit(0)
  })
}

// ─── Entry ────────────────────────────────────────────────────────────────────
if (WATCH_MODE) {
  runWatch().catch(err => { console.error('Fatal:', err.message); process.exit(1) })
} else {
  runOnce().catch(err => { console.error('Fatal:', err.message); process.exit(1) })
}
