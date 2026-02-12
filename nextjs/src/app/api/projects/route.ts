import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { detail: 'Not authenticated' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const skip = Math.max(0, parseInt(searchParams.get('skip') || '0', 10))
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100', 10)))

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    include: {
      results: {
        select: { id: true },
        take: 1,
      },
    },
  })

  const result = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    status: p.status,
    created_at: p.createdAt.toISOString(),
    has_results: p.results.length > 0,
  }))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { detail: 'Not authenticated' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { name, description, project_data } = body

    if (!name || name.length === 0) {
      return NextResponse.json(
        { detail: 'Project name is required' },
        { status: 400 }
      )
    }

    // Check credits
    if (user.credits < 1) {
      return NextResponse.json(
        { detail: 'Insufficient credits' },
        { status: 402 }
      )
    }

    // Create project and deduct credit in a transaction
    const [project] = await prisma.$transaction([
      prisma.project.create({
        data: {
          userId: user.id,
          name,
          description: description || '',
          projectData: project_data || {},
          status: 'pending',
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
      }),
    ])

    return NextResponse.json({
      id: project.id,
      name: project.name,
      status: project.status,
      created_at: project.createdAt.toISOString(),
      credits_remaining: user.credits - 1,
    })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json(
      { detail: 'Failed to create project' },
      { status: 500 }
    )
  }
}
