// src/pages/flashcards.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useAuth } from './_app'

export default function Flashcards() {
  const { user, authHeader } = useAuth()
  const router = useRouter()
  const { subject } = router.query
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(subject || '')
  const [cards, setCards] = useState([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ easy:0, ok:0, hard:0 })

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetch('/api/subjects', { headers: authHeader() })
      .then(r=>r.json()).then(d=>setSubjects(d.subjects||[]))
  }, [user])

  useEffect(() => { if (subject) setSelectedSubject(subject) }, [subject])

  const loadCards = async () => {
    setLoading(true)
    const res = await fetch(`/api/flashcards?subject_id=${selectedSubject}&due=true`, { headers: authHeader() })
    const data = await res.json()
    setCards(data.cards || [])
    setIdx(0); setFlipped(false); setDone(false)
    setStats({ easy:0, ok:0, hard:0 })
    setLoading(false)
  }

  const rate = async (rating) => {
    const card = cards[idx]
    await fetch('/api/flashcards/review', {
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({ card_id: card.id, rating })
    })
    setStats(s => ({ ...s, [rating]: s[rating]+1 }))
    if (idx+1 >= cards.length) setDone(true)
    else { setIdx(i=>i+1); setFlipped(false) }
  }

  if (!user) return null

  return (
    <Layout>
      <div className="fade-up" style={{ maxWidth:700, margin:'0 auto' }}>
        <h1 className="font-display" style={{ fontSize:32, marginBottom:'1.5rem' }}>Flashcards</h1>

        {cards.length === 0 && !loading && (
          <div className="card" style={{ padding:'2rem' }}>
            <p style={{ fontWeight:500, marginBottom:12 }}>Select subject</p>
            <select value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)} style={{ marginBottom:16 }}>
              <option value="">— choose a subject —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button className="btn btn-primary" onClick={loadCards} disabled={!selectedSubject}>Start reviewing →</button>
          </div>
        )}

        {loading && (
          <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--muted)' }}>
            <div className="spinner"></div> Loading cards...
          </div>
        )}

        {done && (
          <div className="card" style={{ textAlign:'center', padding:'3rem' }}>
            <p className="font-display" style={{ fontSize:36, marginBottom:12 }}>Session done! ⟁</p>
            <div style={{ display:'flex', justifyContent:'center', gap:20, marginBottom:24 }}>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:24, color:'#52c77d', fontFamily:'DM Serif Display,serif' }}>{stats.easy}</p>
                <p style={{ fontSize:12, color:'var(--muted)' }}>Easy</p>
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:24, color:'#f0a500', fontFamily:'DM Serif Display,serif' }}>{stats.ok}</p>
                <p style={{ fontSize:12, color:'var(--muted)' }}>Okay</p>
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:24, color:'#ff6b6b', fontFamily:'DM Serif Display,serif' }}>{stats.hard}</p>
                <p style={{ fontSize:12, color:'var(--muted)' }}>Hard</p>
              </div>
            </div>
            <p style={{ color:'var(--muted)', fontSize:13, marginBottom:20 }}>Cards rated "hard" will appear again tomorrow.</p>
            <button className="btn btn-primary" onClick={loadCards}>Review again</button>
          </div>
        )}

        {cards.length > 0 && !done && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontSize:13, color:'var(--muted)' }}>Card {idx+1} of {cards.length}</span>
              <span style={{ fontSize:13, color:'var(--muted)' }}>Tap to flip</span>
            </div>

            <div className="progress-track" style={{ marginBottom:24 }}>
              <div className="progress-fill" style={{ width:`${((idx)/cards.length)*100}%`, background:'#4ecdc4' }}></div>
            </div>

            <div className="flip-card" style={{ marginBottom:24 }} onClick={() => setFlipped(f=>!f)}>
              <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
                <div className="flip-front">
                  <span style={{ fontSize:11, color:'var(--muted)', marginBottom:12, display:'block' }}>QUESTION</span>
                  <p style={{ fontSize:16, lineHeight:1.7, textAlign:'center' }}>{cards[idx]?.front}</p>
                  <p style={{ fontSize:12, color:'var(--muted)', marginTop:16 }}>tap to see answer</p>
                </div>
                <div className="flip-back">
                  <span style={{ fontSize:11, color:'#a899ff', marginBottom:12, display:'block' }}>ANSWER</span>
                  <p style={{ fontSize:14, lineHeight:1.7, textAlign:'center' }}>{cards[idx]?.back}</p>
                </div>
              </div>
            </div>

            {flipped && (
              <div style={{ display:'flex', gap:8, justifyContent:'center' }} className="fade-up">
                <button className="btn" onClick={() => rate('hard')} style={{ flex:1, justifyContent:'center', color:'#ff8f8f', borderColor:'rgba(255,107,107,0.3)' }}>
                  Hard — tomorrow
                </button>
                <button className="btn" onClick={() => rate('ok')} style={{ flex:1, justifyContent:'center', color:'#ffc940', borderColor:'rgba(240,165,0,0.3)' }}>
                  Okay — 3 days
                </button>
                <button className="btn" onClick={() => rate('easy')} style={{ flex:1, justifyContent:'center', color:'#79e8a2', borderColor:'rgba(82,199,125,0.3)' }}>
                  Easy — 1 week
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
