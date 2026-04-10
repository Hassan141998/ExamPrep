// src/pages/api/quiz/attempt.js
import { getDb } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { question_id, subject_id, user_answer, is_correct, time_taken } = req.body

  try {
    const sql = getDb()
    await sql`
      INSERT INTO quiz_attempts (user_id, subject_id, question_id, user_answer, is_correct, time_taken)
      VALUES (${user.id}, ${subject_id}, ${question_id}, ${user_answer}, ${is_correct}, ${time_taken || null})
    `

    // Log study session
    await sql`
      INSERT INTO study_sessions (user_id, subject_id, duration_minutes, session_date)
      VALUES (${user.id}, ${subject_id}, 1, CURRENT_DATE)
      ON CONFLICT DO NOTHING
    `

    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
}
