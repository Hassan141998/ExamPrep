// src/pages/api/auth/login.js
import { getDb } from '../../../lib/db'
import { signToken } from '../../../lib/auth'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    const sql = getDb()
    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signToken({ id: user.id, email: user.email })
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
}
