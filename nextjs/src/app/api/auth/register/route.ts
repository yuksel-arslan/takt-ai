import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, company, password } = body

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { detail: 'Email, name, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { detail: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { detail: 'Email already registered' },
        { status: 400 }
      )
    }

    // Create user
    const hashedPw = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        company: company || '',
        hashedPassword: hashedPw,
        credits: 10,
      },
    })

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
    console.error('Register error:', error)
    return NextResponse.json(
      { detail: 'Registration failed' },
      { status: 500 }
    )
  }
}
