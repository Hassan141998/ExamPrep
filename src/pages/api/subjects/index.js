// src/pages/api/subjects/index.js
import { getDb } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'

export default async function handler(req, res) {
  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const sql = getDb()

  if (req.method === 'GET') {
    try {
      const subjects = await sql`
        SELECT s.*,
          (SELECT COUNT(*) FROM questions q WHERE q.subject_id = s.id) as question_count,
          (SELECT COUNT(*) FROM flashcards f WHERE f.subject_id = s.id) as flashcard_count,
          (s.pdf_text IS NOT NULL AND s.pdf_text != '') as has_pdf,
          COALESCE((
            SELECT ROUND(AVG(CASE WHEN qa.is_correct THEN 100 ELSE 0 END))
            FROM quiz_attempts qa WHERE qa.subject_id = s.id AND qa.user_id = ${user.id}
          ), 0) as accuracy
        FROM subjects s
        WHERE s.user_id = ${user.id}
        ORDER BY s.created_at ASC
      `
      res.json({ subjects })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  }

  else if (req.method === 'POST') {
    const { name, exam_date } = req.body
    if (!name) return res.status(400).json({ error: 'Name required' })
    try {
      const [subject] = await sql`
        INSERT INTO subjects (user_id, name, exam_date)
        VALUES (${user.id}, ${name}, ${exam_date || null})
        RETURNING *
      `
      res.json({ subject })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  }

  else res.status(405).end()
}
