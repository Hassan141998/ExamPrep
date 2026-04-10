// src/pages/progress.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useAuth } from './_app'

export default function Progress() {
  const { user, authHeader } = useAuth()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetch('/api/progress', { headers: authHeader() })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [user])

  if (!user) return null
  const COLORS = ['#7c6af5','#4ecdc4','#ff6b6b','#f0a500']

  return (
    <Layout>
      <div className="fade-up">
        <h1 className="font-display" style={{ fontSize:32, marginBottom:'1.5rem' }}>Progress</h1>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
            <div className="spinner" style={{width:32,height:32}}></div>
          </div>
        ) : (
          <>
            {/* Overall stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:'2rem' }}>
              {[
                { label:'Total questions attempted', value: data?.total_attempted || 0 },
                { label:'Overall accuracy', value: `${data?.overall_accuracy || 0}%` },
                { label:'Flashcards reviewed', value: data?.cards_reviewed || 0 },
                { label:'Study sessions', value: data?.study_sessions || 0 },
              ].map((s,i) => (
                <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
                  <p style={{ fontSize:11, color:'var(--muted)', margin:'0 0 6px' }}>{s.label}</p>
                  <p style={{ fontSize:26, fontWeight:500, margin:0, color:COLORS[i], fontFamily:'DM Serif Display,serif' }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:'2rem' }}>
              {/* Subject breakdown */}
              <div className="card">
                <p style={{ fontWeight:500, marginBottom:14 }}>Subject accuracy</p>
                {(data?.subjects || []).length === 0 ? (
                  <p style={{ color:'var(--muted)', fontSize:13 }}>No data yet. Complete some quizzes!</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {(data?.subjects || []).map((s,i) => (
                      <div key={s.id}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:13 }}>{s.name}</span>
                          <span style={{ fontSize:13, color: COLORS[i%4] }}>{s.accuracy}%</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width:`${s.accuracy}%`, background:COLORS[i%4] }}></div>
                        </div>
                        <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{s.attempted} attempts</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weak topics */}
              <div className="card">
                <p style={{ fontWeight:500, marginBottom:14 }}>Weak topics — needs review</p>
                {(data?.weak_topics || []).length === 0 ? (
                  <p style={{ color:'var(--muted)', fontSize:13 }}>No weak topics identified yet.</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {(data?.weak_topics || []).map((t,i) => (
                      <div key={i} style={{
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                        padding:'8px 10px', background:'var(--bg3)', borderRadius:8
                      }}>
                        <div>
                          <p style={{ fontSize:13, margin:0 }}>{t.chapter || 'General'}</p>
                          <p style={{ fontSize:11, color:'var(--muted)', margin:0 }}>{t.subject_name}</p>
                        </div>
                        <span className={`badge ${t.accuracy < 40 ? 'badge-red' : 'badge-amber'}`}>{t.accuracy}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Weekly chart */}
            <div className="card">
              <p style={{ fontWeight:500, marginBottom:16 }}>This week — questions attempted</p>
              {(data?.weekly || []).length === 0 ? (
                <p style={{ color:'var(--muted)', fontSize:13 }}>No activity this week yet.</p>
              ) : (
                <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:100 }}>
                  {(data?.weekly || []).map((d,i) => (
                    <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1 }}>
                      <span style={{ fontSize:10, color:'var(--muted)' }}>{d.count}</span>
                      <div style={{
                        width:'100%', borderRadius:'4px 4px 0 0',
                        background: d.count > 0 ? '#7c6af5' : 'var(--bg3)',
                        height: d.count > 0 ? `${Math.max(8, (d.count / Math.max(...data.weekly.map(x=>x.count),1)) * 80)}px` : '8px'
                      }}></div>
                      <span style={{ fontSize:10, color:'var(--muted)' }}>{d.day}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
