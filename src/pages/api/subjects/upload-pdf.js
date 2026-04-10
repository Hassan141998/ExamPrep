// src/pages/api/subjects/upload-pdf.js
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { getDb } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'

export const config = { api: { bodyParser: false } }

async function extractPdfText(filepath) {
  const buffer = fs.readFileSync(filepath)
  try {
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js')
    const data = await pdfParse(buffer)
    return data.text || ''
  } catch {
    try {
      const { default: pdfParse } = await import('pdf-parse')
      const data = await pdfParse(buffer)
      return data.text || ''
    } catch (e) {
      console.error('PDF parse failed:', e.message)
      return ''
    }
  }
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const form = formidable({ maxFileSize: 25 * 1024 * 1024, keepExtensions: true })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err)
      return res.status(400).json({ error: 'Upload failed: ' + err.message })
    }

    const subject_id = Array.isArray(fields.subject_id) ? fields.subject_id[0] : fields.subject_id
    const pdfFile = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf

    if (!pdfFile) return res.status(400).json({ error: 'No PDF file received' })
    if (!subject_id) return res.status(400).json({ error: 'No subject_id received' })

    try {
      const sql = getDb()
      const [subject] = await sql`
        SELECT id FROM subjects WHERE id = ${subject_id} AND user_id = ${user.id}
      `
      if (!subject) return res.status(403).json({ error: 'Forbidden' })

      const text = await extractPdfText(pdfFile.filepath)
      try { fs.unlinkSync(pdfFile.filepath) } catch {}

      if (!text || text.trim().length < 50) {
        return res.status(400).json({
          error: 'Could not extract text from this PDF. Make sure it is a text-based PDF (not a scanned image). Try selecting and copying text from it in a PDF viewer to confirm.'
        })
      }

      const truncated = text.slice(0, 500000)
      await sql`UPDATE subjects SET pdf_text = ${truncated} WHERE id = ${subject_id}`

      return res.status(200).json({
        success: true,
        chars: truncated.length,
        preview: truncated.slice(0, 200).replace(/\n/g, ' ')
      })
    } catch (e) {
      console.error('Upload error:', e)
      return res.status(500).json({ error: 'Server error: ' + e.message })
    }
  })
}
