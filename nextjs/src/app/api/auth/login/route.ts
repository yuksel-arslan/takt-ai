import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { detail: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { detail: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const valid = await verifyPassword(password, user.hashedPassword)
    if (!valid) {
      return NextResponse.json(
        { detail: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = await createToken(user.email)

    const responseBody = {
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
      },
    }

    const response = NextResponse.json(responseBody, { status: 200 })

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { detail: 'Login failed' },
      { status: 500 }
    )
  }
}
