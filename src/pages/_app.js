// src/pages/_app.js
import '../styles/globals.css'
import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/router'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('examprep_user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('examprep_user', JSON.stringify(userData))
    localStorage.setItem('examprep_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('examprep_user')
    localStorage.removeItem('examprep_token')
    setUser(null)
    router.push('/login')
  }

  const authHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('examprep_token')}`,
    'Content-Type': 'application/json'
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0f' }}>
      <div className="spinner" style={{ width: 32, height: 32 }}></div>
    </div>
  )

  return (
    <AuthContext.Provider value={{ user, login, logout, authHeader }}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  )
}
