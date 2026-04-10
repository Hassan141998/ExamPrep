// src/pages/login.js
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error || 'Something went wrong')
    login(data.user, data.token)
    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(var(--text) 1px,transparent 1px),linear-gradient(90deg,var(--text) 1px,transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>
      
      <div className="fade-up" style={{ width: '100%', maxWidth: 400, padding: '0 1rem', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(124,106,245,0.2)',
            border: '1px solid rgba(124,106,245,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 1rem'
          }}>⬡</div>
          <h1 className="font-display" style={{ fontSize: 32, margin: '0 0 4px' }}>ExamPrep</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>AI-powered exam preparation</p>
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex', background: 'var(--bg3)',
          borderRadius: 8, padding: 4, marginBottom: '1.5rem'
        }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '7px 0', borderRadius: 6, border: 'none',
              background: mode === m ? 'var(--bg2)' : 'transparent',
              color: mode === m ? 'var(--text)' : 'var(--muted)',
              fontFamily: 'var(--font-mono, monospace)', fontSize: 13,
              cursor: 'pointer', transition: 'all 0.15s',
              borderColor: mode === m ? 'var(--border)' : 'transparent',
              borderWidth: mode === m ? 1 : 0, borderStyle: 'solid'
            }}>
              {m === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="card" style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{
              background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
              borderRadius: 8, padding: '8px 12px', marginBottom: '1rem',
              fontSize: 13, color: '#ff8f8f'
            }}>{error}</div>
          )}
          
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Full name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ahmad Khan" required />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@university.edu" required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? <span className="spinner"></span> : mode === 'login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>
        </div>
        
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, marginTop: '1rem' }}>
          For your 4 subjects: Data Mining, ML, OOSE & IT Project Management
        </p>
      </div>
    </div>
  )
}
