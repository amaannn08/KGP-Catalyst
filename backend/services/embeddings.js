/**
 * services/embeddings.js
 *
 * Single source of truth for all embeddings.
 * Uses @google/genai + gemini-embedding-001 (1536 dims).
 *
 * The GoogleGenAI client is lazy-initialized so that dotenv.config()
 * in the caller runs before this module tries to read GEMINI_API_KEY.
 *
 * Usage:
 *   import { embed, embedBatch } from './services/embeddings.js'
 */

import { GoogleGenAI } from '@google/genai'

const MODEL      = 'gemini-embedding-001'
export const DIMENSIONS = 1536

let _ai = null
function client() {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY is not set in environment')
    _ai = new GoogleGenAI({ apiKey: key })
  }
  return _ai
}

/**
 * Embed a single string → float[1536]
 */
export async function embed(text) {
  if (!text || !text.trim()) throw new Error('embed() requires non-empty text')

  const response = await client().models.embedContent({
    model: MODEL,
    contents: text.trim(),
    config: { outputDimensionality: DIMENSIONS },
  })

  const embedding = response.embeddings?.[0]?.values
  if (!embedding || embedding.length !== DIMENSIONS) {
    throw new Error(`Unexpected embedding shape: ${embedding?.length ?? 0}`)
  }
  return embedding
}

/**
 * Embed an array of strings in parallel, capped at `concurrency`
 * simultaneous requests.  Returns float[1536][] in input order.
 */
export async function embedBatch(texts, { concurrency = 20 } = {}) {
  const results = new Array(texts.length)
  for (let i = 0; i < texts.length; i += concurrency) {
    const slice   = texts.slice(i, i + concurrency)
    const vectors = await Promise.all(slice.map(t => embed(t)))
    vectors.forEach((v, j) => { results[i + j] = v })
  }
  return results
}
