// src/pages/api/subjects/[id].js
import { getDb } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'

export default async function handler(req, res) {
  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { id } = req.query
  const sql = getDb()

  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM subjects WHERE id = ${id} AND user_id = ${user.id}`
      res.json({ success: true })
    } catch (e) {
      res.status(500).json({ error: 'Server error' })
    }
  } else res.status(405).end()
}
