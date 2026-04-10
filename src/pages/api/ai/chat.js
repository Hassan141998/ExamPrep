// src/pages/api/ai/chat.js
import { getDb } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { question, subject_id, history = [] } = req.body

  try {
    const sql = getDb()
    const [subject] = await sql`SELECT name, pdf_text FROM subjects WHERE id = ${subject_id} AND user_id = ${user.id}`
    if (!subject) return res.status(403).json({ error: 'Forbidden' })

    const systemPrompt = `You are an AI tutor helping a student prepare for their ${subject.name} final exam.
${subject.pdf_text ? `Use this course material as your primary reference:\n\n${subject.pdf_text.slice(0, 8000)}` : 'Answer based on standard curriculum for this subject.'}

Be concise, accurate, and exam-focused. Use examples where helpful. Format responses clearly.`

    const messages = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: question }
    ]

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1000,
      system: systemPrompt,
      messages
    })

    res.json({ answer: response.content[0].text })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'AI error. Check ANTHROPIC_API_KEY.' })
  }
}
