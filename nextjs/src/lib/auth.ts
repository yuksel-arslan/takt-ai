import { SignJWT, jwtVerify } from 'jose'
import { hash, compare } from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './db'

const secret = new TextEncoder().encode(process.env.SECRET_KEY || 'fallback-secret-change-me')
const ALGORITHM = 'HS256'
const TOKEN_EXPIRY = '24h'

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed)
}

export async function createToken(email: string): Promise<string> {
  return new SignJWT({ sub: email })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload?.sub) return null

  const user = await prisma.user.findUnique({
    where: { email: payload.sub as string },
  })
  return user
}
