// src/pages/api/progress.js
import { getDb } from '../../lib/db'
import { getUserFromRequest } from '../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const sql = getDb()

    // Overall stats
    const [overall] = await sql`
      SELECT
        COUNT(*) as total_attempted,
        COALESCE(ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END)), 0) as overall_accuracy
      FROM quiz_attempts WHERE user_id = ${user.id}
    `

    const [cardsReviewed] = await sql`
      SELECT COUNT(*) as count FROM flashcards f
      JOIN subjects s ON s.id = f.subject_id
      WHERE s.user_id = ${user.id} AND f.repetitions > 0
    `

    const [studySessions] = await sql`
      SELECT COUNT(DISTINCT session_date) as count FROM study_sessions WHERE user_id = ${user.id}
    `

    // Per-subject accuracy
    const subjects = await sql`
      SELECT s.id, s.name,
        COALESCE(ROUND(AVG(CASE WHEN qa.is_correct THEN 100 ELSE 0 END)), 0) as accuracy,
        COUNT(qa.id) as attempted
      FROM subjects s
      LEFT JOIN quiz_attempts qa ON qa.subject_id = s.id AND qa.user_id = ${user.id}
      WHERE s.user_id = ${user.id}
      GROUP BY s.id, s.name
      ORDER BY accuracy ASC
    `

    // Weak topics (chapters with <60% accuracy, min 3 attempts)
    const weakTopics = await sql`
      SELECT q.chapter, s.name as subject_name,
        ROUND(AVG(CASE WHEN qa.is_correct THEN 100 ELSE 0 END)) as accuracy,
        COUNT(*) as attempts
      FROM quiz_attempts qa
      JOIN questions q ON q.id = qa.question_id
      JOIN subjects s ON s.id = qa.subject_id
      WHERE qa.user_id = ${user.id} AND q.chapter IS NOT NULL AND q.chapter != ''
      GROUP BY q.chapter, s.name
      HAVING COUNT(*) >= 2 AND AVG(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) < 0.6
      ORDER BY accuracy ASC LIMIT 6
    `

    // Weekly activity (last 7 days)
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const weekly = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const [row] = await sql`
        SELECT COUNT(*) as count FROM quiz_attempts
        WHERE user_id = ${user.id} AND DATE(attempted_at) = ${dateStr}
      `
      weekly.push({ day: days[d.getDay()], count: parseInt(row?.count || 0), date: dateStr })
    }

    res.json({
      total_attempted: overall?.total_attempted || 0,
      overall_accuracy: overall?.overall_accuracy || 0,
      cards_reviewed: cardsReviewed?.count || 0,
      study_sessions: studySessions?.count || 0,
      subjects,
      weak_topics: weakTopics,
      weekly
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
}
