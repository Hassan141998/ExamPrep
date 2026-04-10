// src/pages/index.js
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  useEffect(() => {
    router.replace(user ? '/dashboard' : '/login')
  }, [user])
  return null
}
