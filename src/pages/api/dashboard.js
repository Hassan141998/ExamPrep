// src/pages/api/dashboard.js
import { getDb } from '../../lib/db'
import { getUserFromRequest } from '../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const sql = getDb()

    const subjects = await sql`
      SELECT s.*,
        (SELECT COUNT(*) FROM questions q WHERE q.subject_id = s.id) as question_count,
        (SELECT COUNT(*) FROM flashcards f WHERE f.subject_id = s.id) as flashcard_count,
        COALESCE((
          SELECT ROUND(AVG(CASE WHEN qa.is_correct THEN 100 ELSE 0 END))
          FROM quiz_attempts qa WHERE qa.subject_id = s.id AND qa.user_id = ${user.id}
        ), 0) as accuracy
      FROM subjects s
      WHERE s.user_id = ${user.id}
      ORDER BY s.created_at ASC
    `

    const [quizStats] = await sql`
      SELECT
        COUNT(*) as total_attempted,
        COALESCE(ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END)), 0) as quiz_accuracy
      FROM quiz_attempts WHERE user_id = ${user.id}
    `

    const [cardsDue] = await sql`
      SELECT COUNT(*) as count
      FROM flashcards f
      JOIN subjects s ON s.id = f.subject_id
      WHERE s.user_id = ${user.id} AND f.next_review <= CURRENT_DATE
    `

    // Streak: count consecutive days with study sessions
    const recentSessions = await sql`
      SELECT DISTINCT session_date FROM study_sessions
      WHERE user_id = ${user.id}
      ORDER BY session_date DESC LIMIT 30
    `
    let streak = 0
    const today = new Date()
    for (let i = 0; i < recentSessions.length; i++) {
      const d = new Date(recentSessions[i].session_date)
      const diff = Math.floor((today - d) / (1000*60*60*24))
      if (diff === i) streak++
      else break
    }

    res.json({
      subjects,
      stats: {
        quiz_accuracy: quizStats?.quiz_accuracy || 0,
        flashcards_due: cardsDue?.count || 0,
        streak
      }
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
}
