// src/pages/api/auth/register.js
import { getDb } from '../../../lib/db'
import { signToken } from '../../../lib/auth'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password, name } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    const sql = getDb()
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existing.length) return res.status(400).json({ error: 'Email already registered' })

    const hash = await bcrypt.hash(password, 10)
    const [user] = await sql`
      INSERT INTO users (email, password_hash, name) VALUES (${email}, ${hash}, ${name||null})
      RETURNING id, email, name
    `
    const token = signToken({ id: user.id, email: user.email })
    res.json({ user, token })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
}
