// src/pages/api/subjects/upload-pdf.js
import formidable from 'formidable'
import fs from 'fs'
import { getDb } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'

export const config = { api: { bodyParser: false } }

async function extractPdfText(filepath) {
  try {
    // Dynamic import for pdf-parse
    const pdfParse = (await import('pdf-parse')).default
    const buffer = fs.readFileSync(filepath)
    const data = await pdfParse(buffer)
    return data.text
  } catch (e) {
    console.error('PDF parse error:', e)
    return ''
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const form = formidable({ maxFileSize: 20 * 1024 * 1024 })

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: 'Upload failed' })

    const subject_id = Array.isArray(fields.subject_id) ? fields.subject_id[0] : fields.subject_id
    const pdfFile = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf

    if (!pdfFile || !subject_id) return res.status(400).json({ error: 'Missing file or subject_id' })

    try {
      const sql = getDb()
      // Verify subject belongs to user
      const [subject] = await sql`SELECT id FROM subjects WHERE id = ${subject_id} AND user_id = ${user.id}`
      if (!subject) return res.status(403).json({ error: 'Forbidden' })

      const text = await extractPdfText(pdfFile.filepath)
      if (!text) return res.status(400).json({ error: 'Could not extract text from PDF. Make sure it is not a scanned image PDF.' })

      await sql`UPDATE subjects SET pdf_text = ${text} WHERE id = ${subject_id}`

      // Clean up temp file
      try { fs.unlinkSync(pdfFile.filepath) } catch {}

      res.json({ success: true, chars: text.length })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  })
}
