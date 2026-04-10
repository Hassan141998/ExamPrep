// src/components/Layout.js
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../pages/_app'

const navItems = [
  { href: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { href: '/subjects',  icon: '◈', label: 'Subjects' },
  { href: '/quiz',      icon: '◎', label: 'Quiz' },
  { href: '/flashcards',icon: '⟁', label: 'Flashcards' },
  { href: '/notes',     icon: '≡', label: 'Notes' },
  { href: '/progress',  icon: '∿', label: 'Progress' },
]

export default function Layout({ children }) {
  const router = useRouter()
  const { user, logout } = useAuth()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '1.5rem 1rem',
        position: 'sticky', top: 0, height: '100vh'
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(124,106,245,0.2)',
              border: '1px solid rgba(124,106,245,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#a899ff'
            }}>⬡</div>
            <span className="font-display" style={{ fontSize: 18, color: 'var(--text)' }}>ExamPrep</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', paddingLeft: 42 }}>AI-powered study tool</p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={`sidebar-link ${router.pathname === item.href ? 'active' : ''}`}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(124,106,245,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#a899ff', fontWeight: 500
              }}>
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text)', margin: 0 }}>{user.name || 'Student'}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>{user.email}</p>
              </div>
            </div>
            <button onClick={logout} className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        {children}
      </main>
    </div>
  )
}
