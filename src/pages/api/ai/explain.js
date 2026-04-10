// src/pages/api/ai/explain.js
import { getDb } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'
import { explainTopic } from '../../../lib/ai'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { question, subject_id } = req.body
  if (!question || !subject_id) return res.status(400).json({ error: 'question and subject_id required' })

  try {
    const sql = getDb()
    const [subject] = await sql`SELECT name, pdf_text FROM subjects WHERE id = ${subject_id} AND user_id = ${user.id}`
    if (!subject) return res.status(403).json({ error: 'Forbidden' })

    const explanation = await explainTopic(subject.pdf_text || '', subject.name, question)
    res.json({ explanation })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'AI error' })
  }
}
