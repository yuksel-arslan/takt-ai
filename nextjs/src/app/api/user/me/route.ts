import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { detail: 'Not authenticated' },
      { status: 401 }
    )
  }

  // Count projects
  const totalProjects = await prisma.project.count({
    where: { userId: user.id },
  })

  const completedProjects = await prisma.project.count({
    where: {
      userId: user.id,
      status: 'completed',
    },
  })

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    company: user.company || '',
    credits: user.credits,
    created_at: user.createdAt.toISOString(),
    statistics: {
      total_projects: totalProjects,
      completed_projects: completedProjects,
    },
  })
}
