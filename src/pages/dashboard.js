// src/pages/dashboard.js
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useAuth } from './_app'
import Link from 'next/link'

const SUBJECT_COLORS = ['#7c6af5','#4ecdc4','#ff6b6b','#f0a500']

export default function Dashboard() {
  const { user, authHeader } = useAuth()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetch('/api/dashboard', { headers: authHeader() })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  if (!user) return null
  if (loading) return (
    <Layout>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'60vh' }}>
        <div className="spinner" style={{width:32,height:32}}></div>
      </div>
    </Layout>
  )

  const stats = data?.stats || { topics: 0, accuracy: 0, flashcards: 0, streak: 0 }
  const subjects = data?.subjects || []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <Layout>
      <div className="fade-up">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="font-display" style={{ fontSize: 32, margin: '0 0 4px' }}>
            {greeting}, {user.name || 'Student'} ↗
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            {subjects.length === 0
              ? 'Start by adding your subjects and uploading your PDFs →'
              : `${subjects.length} subject${subjects.length>1?'s':''} loaded · Keep studying!`}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:'2rem' }}>
          {[
            { label: 'Topics covered', value: `${stats.accuracy || 0}%`, color: '#7c6af5' },
            { label: 'Quiz accuracy',  value: `${stats.quiz_accuracy || 0}%`, color: '#4ecdc4' },
            { label: 'Cards due',      value: stats.flashcards_due || 0, color: '#ff6b6b' },
            { label: 'Study streak',   value: `${stats.streak || 0}d`, color: '#f0a500' },
          ].map((s,i) => (
            <div key={i} style={{
              background:'var(--bg2)', border:'1px solid var(--border)',
              borderRadius:10, padding:'14px 16px'
            }}>
              <p style={{ fontSize:11, color:'var(--muted)', margin:'0 0 6px' }}>{s.label}</p>
              <p style={{ fontSize:28, fontWeight:500, margin:0, color:s.color, fontFamily:'DM Serif Display,serif' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Subjects progress */}
        {subjects.length > 0 ? (
          <div style={{ marginBottom:'2rem' }}>
            <h2 style={{ fontSize:14, color:'var(--muted)', marginBottom:12, fontWeight:400 }}>// subject_progress</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
              {subjects.map((s, i) => (
                <div key={s.id} className="card" style={{ cursor:'pointer' }} onClick={() => router.push(`/subjects/${s.id}`)}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <p style={{ fontWeight:500, margin:'0 0 2px', fontSize:14 }}>{s.name}</p>
                      <p style={{ fontSize:12, color:'var(--muted)', margin:0 }}>{s.question_count || 0} questions · {s.flashcard_count || 0} cards</p>
                    </div>
                    <span className="badge badge-purple">{s.accuracy || 0}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width:`${s.accuracy||0}%`, background: SUBJECT_COLORS[i%4] }}></div>
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:10 }}>
                    <Link href={`/quiz?subject=${s.id}`} className="btn btn-sm" onClick={e=>e.stopPropagation()}>Quiz</Link>
                    <Link href={`/flashcards?subject=${s.id}`} className="btn btn-sm" onClick={e=>e.stopPropagation()}>Cards</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign:'center', padding:'3rem', marginBottom:'2rem' }}>
            <p style={{ fontSize:32, marginBottom:12 }}>⬡</p>
            <p className="font-display" style={{ fontSize:20, marginBottom:8 }}>No subjects yet</p>
            <p style={{ color:'var(--muted)', fontSize:13, marginBottom:16 }}>
              Add your 4 subjects (Data Mining, ML, OOSE, IT Project Management) and upload their PDFs
            </p>
            <Link href="/subjects" className="btn btn-primary">Add subjects →</Link>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 style={{ fontSize:14, color:'var(--muted)', marginBottom:12, fontWeight:400 }}>// quick_actions</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { icon:'◎', label:'Start quiz', desc:'Test your knowledge', href:'/quiz', color:'#7c6af5' },
              { icon:'⟁', label:'Review cards', desc:'Spaced repetition', href:'/flashcards', color:'#4ecdc4' },
              { icon:'∿', label:'View progress', desc:'Analytics & weak topics', href:'/progress', color:'#f0a500' },
            ].map((a,i) => (
              <Link key={i} href={a.href} style={{ textDecoration:'none' }}>
                <div className="card" style={{ display:'flex', gap:12, alignItems:'flex-start', cursor:'pointer' }}>
                  <div style={{
                    width:36, height:36, borderRadius:8,
                    background:`${a.color}20`, border:`1px solid ${a.color}40`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:18, color:a.color, flexShrink:0
                  }}>{a.icon}</div>
                  <div>
                    <p style={{ fontWeight:500, margin:'0 0 2px', fontSize:13 }}>{a.label}</p>
                    <p style={{ fontSize:12, color:'var(--muted)', margin:0 }}>{a.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
