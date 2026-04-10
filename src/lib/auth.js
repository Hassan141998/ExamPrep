// src/lib/auth.js
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod'

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

export function getUserFromRequest(req) {
  const authHeader = req.headers.authorization
  const cookieToken = req.cookies?.token
  const token = authHeader?.replace('Bearer ', '') || cookieToken
  if (!token) return null
  return verifyToken(token)
}
