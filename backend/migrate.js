/**
 * migrate.js — runs schema.sql against NeonDB.
 * Used as Render's Pre-Deploy Command: node migrate.js
 */
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg   from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const sql = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql'),
  'utf8'
)

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
console.log('🔧 Running migrations…')
await client.query(sql)
console.log('✅ Migration complete.')
await client.end()
