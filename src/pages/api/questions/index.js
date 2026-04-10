// src/pages/api/questions/index.js
import { getDb } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { subject_id, limit = 10, difficulty } = req.query
  if (!subject_id) return res.status(400).json({ error: 'subject_id required' })

  try {
    const sql = getDb()

    // Verify subject ownership
    const [subject] = await sql`SELECT id FROM subjects WHERE id = ${subject_id} AND user_id = ${user.id}`
    if (!subject) return res.status(403).json({ error: 'Forbidden' })

    let questions
    if (difficulty) {
      questions = await sql`
        SELECT * FROM questions
        WHERE subject_id = ${subject_id} AND difficulty = ${difficulty}
        ORDER BY RANDOM() LIMIT ${parseInt(limit)}
      `
    } else {
      questions = await sql`
        SELECT * FROM questions
        WHERE subject_id = ${subject_id}
        ORDER BY RANDOM() LIMIT ${parseInt(limit)}
      `
    }

    // Parse options JSON
    const parsed = questions.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }))

    res.json({ questions: parsed })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
}
