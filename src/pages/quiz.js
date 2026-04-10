// src/pages/quiz.js
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useAuth } from './_app'

export default function Quiz() {
  const { user, authHeader } = useAuth()
  const router = useRouter()
  const { subject } = router.query
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(subject || '')
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600)
  const [loading, setLoading] = useState(false)
  const [aiExplain, setAiExplain] = useState('')
  const [explaining, setExplaining] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetch('/api/subjects', { headers: authHeader() })
      .then(r => r.json()).then(d => setSubjects(d.subjects || []))
  }, [user])

  useEffect(() => {
    if (subject) setSelectedSubject(subject)
  }, [subject])

  const startQuiz = async () => {
    if (!selectedSubject) return
    setLoading(true)
    const res = await fetch(`/api/questions?subject_id=${selectedSubject}&limit=10`, { headers: authHeader() })
    const data = await res.json()
    if (data.questions?.length) {
      setQuestions(data.questions)
      setCurrent(0); setSelected(null); setRevealed(false)
      setScore(0); setFinished(false); setAiExplain('')
      setTimeLeft(data.questions.length * 60)
      timerRef.current = setInterval(() => setTimeLeft(t => { if(t<=1){clearInterval(timerRef.current);setFinished(true);return 0} return t-1 }), 1000)
    }
    setLoading(false)
  }

  const answer = async (opt) => {
    if (revealed) return
    setSelected(opt)
    setRevealed(true)
    const q = questions[current]
    const correct = opt === q.correct_answer
    if (correct) setScore(s => s+1)
    await fetch('/api/quiz/attempt', {
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({ question_id: q.id, subject_id: selectedSubject, user_answer: opt, is_correct: correct })
    })
  }

  const next = () => {
    if (current+1 >= questions.length) { clearInterval(timerRef.current); setFinished(true); return }
    setCurrent(c => c+1); setSelected(null); setRevealed(false); setAiExplain('')
  }

  const askAI = async () => {
    setExplaining(true)
    const q = questions[current]
    const res = await fetch('/api/ai/explain', {
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({ question: q.question, subject_id: selectedSubject })
    })
    const data = await res.json()
    setAiExplain(data.explanation || '')
    setExplaining(false)
  }

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  if (!user) return null

  return (
    <Layout>
      <div className="fade-up" style={{ maxWidth: 700, margin:'0 auto' }}>
        <h1 className="font-display" style={{ fontSize:32, marginBottom:'1.5rem' }}>Quiz</h1>

        {/* Setup */}
        {questions.length === 0 && !loading && (
          <div className="card" style={{ padding:'2rem' }}>
            <p style={{ fontWeight:500, marginBottom:12 }}>Select subject</p>
            <select value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)} style={{ marginBottom:16 }}>
              <option value="">— choose a subject —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {subjects.length === 0 && <p style={{ color:'var(--muted)', fontSize:13, marginBottom:16 }}>No subjects yet. <a href="/subjects" style={{color:'#a899ff'}}>Add subjects first →</a></p>}
            <button className="btn btn-primary" onClick={startQuiz} disabled={!selectedSubject}>Start quiz →</button>
          </div>
        )}

        {loading && (
          <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--muted)' }}>
            <div className="spinner"></div> Loading questions...
          </div>
        )}

        {/* Finished */}
        {finished && (
          <div className="card" style={{ textAlign:'center', padding:'3rem' }}>
            <p className="font-display" style={{ fontSize:48, color:'#7c6af5', marginBottom:8 }}>{score}/{questions.length}</p>
            <p style={{ fontSize:18, marginBottom:4 }}>{score/questions.length >= 0.8 ? '🎉 Excellent!' : score/questions.length >= 0.6 ? '👍 Good work!' : '📚 Keep studying!'}</p>
            <p style={{ color:'var(--muted)', fontSize:13, marginBottom:24 }}>
              Accuracy: {Math.round(score/questions.length*100)}%
            </p>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button className="btn btn-primary" onClick={startQuiz}>Retry →</button>
              <button className="btn" onClick={() => { setQuestions([]); setFinished(false) }}>New quiz</button>
            </div>
          </div>
        )}

        {/* Active quiz */}
        {questions.length > 0 && !finished && (
          <>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontSize:13, color:'var(--muted)' }}>Q {current+1}/{questions.length}</span>
              <span style={{
                fontSize:13, color: timeLeft < 60 ? '#ff6b6b' : 'var(--muted)',
                fontFamily:'JetBrains Mono,monospace'
              }}>{fmt(timeLeft)}</span>
              <span className={`badge ${questions[current].difficulty==='easy'?'badge-green':questions[current].difficulty==='hard'?'badge-red':'badge-amber'}`}>
                {questions[current].difficulty}
              </span>
            </div>

            <div className="progress-track" style={{ marginBottom:24 }}>
              <div className="progress-fill" style={{ width:`${((current+1)/questions.length)*100}%`, background:'#7c6af5' }}></div>
            </div>

            <div className="card" style={{ marginBottom:16 }}>
              <p style={{ fontSize:16, lineHeight:1.7, margin:'0 0 20px' }}>{questions[current].question}</p>

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {(questions[current].options || []).map((opt, i) => {
                  let cls = 'quiz-option'
                  if (revealed && opt.startsWith(questions[current].correct_answer)) cls += ' correct'
                  else if (revealed && opt === selected) cls += ' wrong'
                  else if (!revealed && opt === selected) cls += ' selected'
                  return (
                    <div key={i} className={cls} onClick={() => answer(opt)}>
                      {opt}
                    </div>
                  )
                })}
              </div>

              {revealed && questions[current].explanation && (
                <div style={{
                  marginTop:16, padding:'10px 14px',
                  background:'rgba(124,106,245,0.08)', borderRadius:8,
                  border:'1px solid rgba(124,106,245,0.2)', fontSize:13, lineHeight:1.6
                }}>
                  <span style={{ color:'#a899ff', fontWeight:500 }}>Explanation: </span>
                  {questions[current].explanation}
                </div>
              )}

              {aiExplain && (
                <div style={{
                  marginTop:10, padding:'10px 14px',
                  background:'rgba(78,205,196,0.08)', borderRadius:8,
                  border:'1px solid rgba(78,205,196,0.2)', fontSize:13, lineHeight:1.6
                }}>
                  <span style={{ color:'#4ecdc4', fontWeight:500 }}>AI Tutor: </span>
                  {aiExplain}
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:8 }}>
              {revealed && <button className="btn btn-primary" onClick={next}>{current+1>=questions.length ? 'Finish' : 'Next →'}</button>}
              <button className="btn" onClick={askAI} disabled={explaining}>
                {explaining ? <><span className="spinner"></span> Asking AI...</> : '⬡ Ask AI tutor'}
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
