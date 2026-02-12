import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { detail: 'Not authenticated' },
      { status: 401 }
    )
  }

  const { projectId } = await params

  // Find project belonging to current user
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: user.id,
    },
  })

  if (!project) {
    return NextResponse.json(
      { detail: 'Project not found' },
      { status: 404 }
    )
  }

  // Get the most recent optimization result
  const result = await prisma.optimizationResult.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: 'desc' },
  })

  if (!result) {
    return NextResponse.json(
      { detail: 'No results found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      created_at: project.createdAt.toISOString(),
    },
    best_plan: result.bestPlan,
    scenarios: result.scenarios,
    evolution_history: result.evolutionHistory,
    statistics: {
      optimization_date: result.createdAt.toISOString(),
      duration_ms: result.durationMs,
      population_size: result.populationSize,
      generations: result.generations,
      total_simulations: result.totalSimulations,
    },
  })
}
