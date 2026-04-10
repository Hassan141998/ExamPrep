// src/pages/subjects/index.js
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { useAuth } from '../_app'
import Link from 'next/link'

const PRESET_SUBJECTS = [
  'Data Mining & Warehouse',
  'Machine Learning',
  'OOSE',
  'IT Project Management'
]

export default function Subjects() {
  const { user, authHeader } = useAuth()
  const router = useRouter()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', exam_date: '' })
  const [uploading, setUploading] = useState({})
  const [generating, setGenerating] = useState({})
  const fileRefs = useRef({})

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    loadSubjects()
  }, [user])

  const loadSubjects = async () => {
    const res = await fetch('/api/subjects', { headers: authHeader() })
    const data = await res.json()
    setSubjects(data.subjects || [])
    setLoading(false)
  }

  const addSubject = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/subjects', {
      method: 'POST', headers: authHeader(),
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) { setSubjects([...subjects, data.subject]); setAdding(false); setForm({ name:'', exam_date:'' }) }
  }

  const uploadPDF = async (subjectId, file) => {
    setUploading(p => ({ ...p, [subjectId]: true }))
    const fd = new FormData()
    fd.append('pdf', file)
    fd.append('subject_id', subjectId)
    const token = localStorage.getItem('examprep_token')
    const res = await fetch('/api/subjects/upload-pdf', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd
    })
    const data = await res.json()
    setUploading(p => ({ ...p, [subjectId]: false }))
    if (res.ok) loadSubjects()
    else alert(data.error || 'Upload failed')
  }

  const generateContent = async (subjectId) => {
    setGenerating(p => ({ ...p, [subjectId]: true }))
    const res = await fetch('/api/subjects/generate', {
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({ subject_id: subjectId })
    })
    const data = await res.json()
    setGenerating(p => ({ ...p, [subjectId]: false }))
    if (res.ok) { alert(`✅ Generated ${data.questions} questions & ${data.flashcards} flashcards!`); loadSubjects() }
    else alert(data.error || 'Generation failed')
  }

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject and all its content?')) return
    await fetch(`/api/subjects/${id}`, { method: 'DELETE', headers: authHeader() })
    setSubjects(subjects.filter(s => s.id !== id))
  }

  const COLORS = ['#7c6af5','#4ecdc4','#ff6b6b','#f0a500']

  if (!user) return null

  return (
    <Layout>
      <div className="fade-up">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem' }}>
          <div>
            <h1 className="font-display" style={{ fontSize:32, margin:'0 0 4px' }}>Subjects</h1>
            <p style={{ color:'var(--muted)', fontSize:13 }}>Manage your subjects · Upload PDFs · Generate AI content</p>
          </div>
          <button className="btn btn-primary" onClick={() => setAdding(!adding)}>
            {adding ? '✕ Cancel' : '+ Add subject'}
          </button>
        </div>

        {/* Add form */}
        {adding && (
          <div className="card" style={{ marginBottom:'1.5rem', borderColor:'rgba(124,106,245,0.3)' }}>
            <p style={{ fontWeight:500, marginBottom:12 }}>New subject</p>
            <form onSubmit={addSubject} style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:4 }}>Subject name</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Data Mining & Warehouse" required />
                <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                  {PRESET_SUBJECTS.map(p => (
                    <button key={p} type="button" className="btn btn-sm" onClick={()=>setForm({...form,name:p})}
                      style={{ fontSize:11 }}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:4 }}>Exam date (optional)</label>
                <input type="date" value={form.exam_date} onChange={e=>setForm({...form,exam_date:e.target.value})} style={{ width:200 }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'fit-content' }}>Create subject →</button>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}><div className="spinner" style={{width:32,height:32}}></div></div>
        ) : subjects.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'3rem' }}>
            <p style={{ fontSize:32, marginBottom:8 }}>◈</p>
            <p className="font-display" style={{ fontSize:20 }}>No subjects yet</p>
            <p style={{ color:'var(--muted)', fontSize:13 }}>Click "Add subject" to get started</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
            {subjects.map((s, i) => (
              <div key={s.id} className="card" style={{ borderLeft:`3px solid ${COLORS[i%4]}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <h3 style={{ fontWeight:500, fontSize:15, margin:'0 0 2px' }}>{s.name}</h3>
                    <p style={{ fontSize:12, color:'var(--muted)', margin:0 }}>
                      {s.exam_date ? `Exam: ${new Date(s.exam_date).toLocaleDateString()}` : 'No exam date set'}
                    </p>
                  </div>
                  <button onClick={() => deleteSubject(s.id)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:16 }}>×</button>
                </div>

                {/* Stats */}
                <div style={{ display:'flex', gap:12, marginBottom:14 }}>
                  <span style={{ fontSize:12, color:'var(--muted)' }}>{s.question_count||0} questions</span>
                  <span style={{ fontSize:12, color:'var(--muted)' }}>{s.flashcard_count||0} cards</span>
                  <span style={{ fontSize:12, color: s.has_pdf ? '#52c77d' : 'var(--muted)' }}>
                    {s.has_pdf ? '● PDF loaded' : '○ No PDF'}
                  </span>
                </div>

                {/* PDF Upload */}
                <div style={{ marginBottom:12 }}>
                  <input
                    type="file" accept=".pdf"
                    ref={el => fileRefs.current[s.id] = el}
                    onChange={e => e.target.files[0] && uploadPDF(s.id, e.target.files[0])}
                    style={{ display:'none' }}
                  />
                  <button
                    className="btn btn-sm"
                    onClick={() => fileRefs.current[s.id]?.click()}
                    disabled={uploading[s.id]}
                    style={{ marginRight:6 }}
                  >
                    {uploading[s.id] ? <><span className="spinner"></span> Uploading...</> : '↑ Upload PDF'}
                  </button>

                  {s.has_pdf && (
                    <button
                      className="btn btn-sm"
                      onClick={() => generateContent(s.id)}
                      disabled={generating[s.id]}
                      style={{ background:'rgba(124,106,245,0.15)', borderColor:'rgba(124,106,245,0.3)', color:'#a899ff' }}
                    >
                      {generating[s.id] ? <><span className="spinner"></span> Generating AI content...</> : '⬡ Generate questions & cards'}
                    </button>
                  )}
                </div>

                {/* Action links */}
                <div style={{ display:'flex', gap:6, borderTop:'1px solid var(--border)', paddingTop:12 }}>
                  <Link href={`/quiz?subject=${s.id}`} className="btn btn-sm">Quiz →</Link>
                  <Link href={`/flashcards?subject=${s.id}`} className="btn btn-sm">Flashcards →</Link>
                  <Link href={`/notes?subject=${s.id}`} className="btn btn-sm">Notes →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
