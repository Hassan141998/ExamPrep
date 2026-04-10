// src/pages/api/subjects/generate.js
import { getDb } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'
import { generateQuestions, generateFlashcards } from '../../../lib/ai'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { subject_id } = req.body
  if (!subject_id) return res.status(400).json({ error: 'subject_id required' })

  try {
    const sql = getDb()
    const [subject] = await sql`
      SELECT * FROM subjects WHERE id = ${subject_id} AND user_id = ${user.id}
    `
    if (!subject) return res.status(403).json({ error: 'Forbidden' })
    if (!subject.pdf_text) return res.status(400).json({ error: 'Upload a PDF first' })

    // Generate questions
    const rawQs = await generateQuestions(subject.pdf_text, subject.name, 15)
    let qCount = 0
    for (const q of rawQs) {
      try {
        await sql`
          INSERT INTO questions (subject_id, question, options, correct_answer, explanation, difficulty, chapter)
          VALUES (
            ${subject_id},
            ${q.question},
            ${JSON.stringify(q.options || [])},
            ${q.correct_answer},
            ${q.explanation || ''},
            ${q.difficulty || 'medium'},
            ${q.chapter || ''}
          )
        `
        qCount++
      } catch {}
    }

    // Generate flashcards
    const rawCards = await generateFlashcards(subject.pdf_text, subject.name, 20)
    let cCount = 0
    for (const c of rawCards) {
      try {
        await sql`
          INSERT INTO flashcards (subject_id, front, back)
          VALUES (${subject_id}, ${c.front}, ${c.back})
        `
        cCount++
      } catch {}
    }

    res.json({ questions: qCount, flashcards: cCount })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'AI generation failed. Check your ANTHROPIC_API_KEY.' })
  }
}
