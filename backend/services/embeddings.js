/**
 * services/embeddings.js
 *
 * Single source of truth for all embeddings in this project.
 * Uses @google/genai + gemini-embedding-001 (1536 dims).
 *
 * Usage:
 *   import { embed, embedBatch } from './services/embeddings.js'
 *
 *   const vec  = await embed('some text')           // float[1536]
 *   const vecs = await embedBatch(['a', 'b', 'c'])  // float[1536][]
 */

import { GoogleGenAI } from '@google/genai'

const ai         = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const MODEL      = 'gemini-embedding-001'
export const DIMENSIONS = 1536

/**
 * Embed a single string → float[1536]
 */
export async function embed(text) {
  if (!text || !text.trim()) throw new Error('embed() requires non-empty text')

  const response = await ai.models.embedContent({
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
 * Embed an array of strings in parallel, with a concurrency cap to
 * respect Gemini rate limits.  Returns float[1536][] in the same order.
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
