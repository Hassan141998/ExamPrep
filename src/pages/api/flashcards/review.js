// src/pages/api/flashcards/review.js
import { getDb } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'

// SM-2 spaced repetition algorithm
function sm2(easeFactor, interval, repetitions, rating) {
  // rating: 'easy'=5, 'ok'=3, 'hard'=1
  const q = rating === 'easy' ? 5 : rating === 'ok' ? 3 : 1

  let newEF = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEF = Math.max(1.3, newEF)

  let newInterval, newReps
  if (q < 3) {
    newInterval = 1
    newReps = 0
  } else {
    newReps = repetitions + 1
    if (newReps === 1) newInterval = 1
    else if (newReps === 2) newInterval = 3
    else newInterval = Math.round(interval * newEF)
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)
  const nextReviewStr = nextReview.toISOString().split('T')[0]

  return { easeFactor: newEF, interval: newInterval, repetitions: newReps, nextReview: nextReviewStr }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { card_id, rating } = req.body
  if (!card_id || !rating) return res.status(400).json({ error: 'card_id and rating required' })

  try {
    const sql = getDb()

    // Get current card data - verify through subject ownership
    const [card] = await sql`
      SELECT f.* FROM flashcards f
      JOIN subjects s ON s.id = f.subject_id
      WHERE f.id = ${card_id} AND s.user_id = ${user.id}
    `
    if (!card) return res.status(403).json({ error: 'Forbidden' })

    const { easeFactor, interval, repetitions, nextReview } = sm2(
      card.ease_factor,
      card.interval,
      card.repetitions,
      rating
    )

    await sql`
      UPDATE flashcards
      SET ease_factor = ${easeFactor},
          interval = ${interval},
          repetitions = ${repetitions},
          next_review = ${nextReview}
      WHERE id = ${card_id}
    `

    res.json({ success: true, next_review: nextReview, interval })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
}
