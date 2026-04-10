// src/pages/api/flashcards/index.js
import { getDb } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { subject_id, due } = req.query
  if (!subject_id) return res.status(400).json({ error: 'subject_id required' })

  try {
    const sql = getDb()
    const [subject] = await sql`SELECT id FROM subjects WHERE id = ${subject_id} AND user_id = ${user.id}`
    if (!subject) return res.status(403).json({ error: 'Forbidden' })

    let cards
    if (due === 'true') {
      cards = await sql`
        SELECT * FROM flashcards
        WHERE subject_id = ${subject_id} AND next_review <= CURRENT_DATE
        ORDER BY next_review ASC LIMIT 30
      `
    } else {
      cards = await sql`
        SELECT * FROM flashcards
        WHERE subject_id = ${subject_id}
        ORDER BY created_at DESC
      `
    }

    res.json({ cards })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
}
