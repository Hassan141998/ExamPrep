// src/pages/notes.js
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useAuth } from './_app'

export default function Notes() {
  const { user, authHeader } = useAuth()
  const router = useRouter()
  const { subject } = router.query
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(subject || '')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetch('/api/subjects', { headers: authHeader() })
      .then(r=>r.json()).then(d=>setSubjects(d.subjects||[]))
  }, [user])

  useEffect(() => { if (subject) setSelectedSubject(subject) }, [subject])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim() || !selectedSubject) return
    const userMsg = { role:'user', content:input }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    const res = await fetch('/api/ai/chat', {
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({ question: input, subject_id: selectedSubject, history: messages.slice(-6) })
    })
    const data = await res.json()
    setMessages(m => [...m, { role:'assistant', content: data.answer || 'Sorry, I could not answer that.' }])
    setLoading(false)
  }

  const starters = [
    'Summarize the key concepts of this subject',
    'What are the most likely exam topics?',
    'Explain the difference between clustering and classification',
    'Create a study plan for me'
  ]

  if (!user) return null

  return (
    <Layout>
      <div className="fade-up" style={{ maxWidth:700, margin:'0 auto', height:'calc(100vh - 4rem)', display:'flex', flexDirection:'column' }}>
        <div style={{ marginBottom:'1rem' }}>
          <h1 className="font-display" style={{ fontSize:32, margin:'0 0 4px' }}>AI Tutor</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <p style={{ color:'var(--muted)', fontSize:13, margin:0 }}>Chat with AI about your subject material</p>
            <select value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)} style={{ width:'auto', padding:'4px 8px', fontSize:12 }}>
              <option value="">— select subject —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12, marginBottom:12 }}>
          {messages.length === 0 && (
            <div>
              <div className="card" style={{ textAlign:'center', padding:'2rem', marginBottom:16 }}>
                <p style={{ fontSize:24, marginBottom:8 }}>⬡</p>
                <p className="font-display" style={{ fontSize:18, marginBottom:4 }}>AI Tutor ready</p>
                <p style={{ color:'var(--muted)', fontSize:13 }}>
                  {selectedSubject ? 'Ask anything about your course material' : 'Select a subject to get started'}
                </p>
              </div>
              {selectedSubject && (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {starters.map((s,i) => (
                    <button key={i} className="btn" style={{ textAlign:'left', justifyContent:'flex-start', fontSize:13 }}
                      onClick={() => setInput(s)}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{
              display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth:'80%', padding:'10px 14px', borderRadius:10,
                background: m.role==='user' ? 'rgba(124,106,245,0.2)' : 'var(--bg2)',
                border: `1px solid ${m.role==='user' ? 'rgba(124,106,245,0.3)' : 'var(--border)'}`,
                fontSize:13, lineHeight:1.7,
                whiteSpace:'pre-wrap'
              }}>
                {m.role==='assistant' && (
                  <span style={{ fontSize:11, color:'#a899ff', display:'block', marginBottom:4 }}>AI Tutor</span>
                )}
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display:'flex', gap:6, alignItems:'center', color:'var(--muted)', fontSize:13 }}>
              <div className="spinner"></div> Thinking...
            </div>
          )}
          <div ref={bottomRef}></div>
        </div>

        {/* Input */}
        <form onSubmit={send} style={{ display:'flex', gap:8 }}>
          <input
            value={input}
            onChange={e=>setInput(e.target.value)}
            placeholder={selectedSubject ? 'Ask anything about your course...' : 'Select a subject first'}
            disabled={!selectedSubject || loading}
          />
          <button type="submit" className="btn btn-primary" disabled={!input.trim() || !selectedSubject || loading}>
            Send →
          </button>
        </form>
      </div>
    </Layout>
  )
}
