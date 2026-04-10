// src/lib/ai.js
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateQuestions(pdfText, subjectName, count = 10, chapter = '') {
  const chapterCtx = chapter ? `Focus on: ${chapter}.` : ''
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You are an expert exam question creator for "${subjectName}". ${chapterCtx}
      
Based on this course material, generate ${count} exam questions.
Return ONLY valid JSON, no markdown, no extra text.

Format:
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct_answer": "A",
    "explanation": "...",
    "difficulty": "easy|medium|hard",
    "chapter": "..."
  }
]

Course material (excerpt):
${pdfText.slice(0, 8000)}`
    }]
  })
  
  const text = message.content[0].text.trim()
  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

export async function generateFlashcards(pdfText, subjectName, count = 20) {
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Create ${count} flashcards for "${subjectName}" exam prep.
Return ONLY valid JSON array, no markdown.

Format:
[{"front": "Question/term", "back": "Answer/definition"}]

Material:
${pdfText.slice(0, 8000)}`
    }]
  })
  
  const text = message.content[0].text.trim()
  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

export async function explainTopic(pdfText, subjectName, question) {
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a tutor for ${subjectName}. Answer this question using the course material below.
Be concise, exam-focused, and use examples.

Question: ${question}

Course material:
${pdfText.slice(0, 6000)}`
    }]
  })
  return message.content[0].text
}

export async function generateSummary(pdfText, subjectName) {
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Create a concise exam-prep summary for "${subjectName}".
Include: key concepts, important definitions, common exam topics.
Return as JSON: {"chapters": [{"title": "...", "keyPoints": ["..."]}]}.
No markdown.

Material:
${pdfText.slice(0, 8000)}`
    }]
  })
  const text = message.content[0].text.trim()
  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}
