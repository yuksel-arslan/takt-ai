import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { TaktGeneticAlgorithm, TaktConfig } from '@/lib/genetic-algorithm'

export async function POST(
  request: NextRequest,
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
  const startTime = Date.now()

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

  // Set project status to processing
  await prisma.project.update({
    where: { id: project.id },
    data: { status: 'processing' },
  })

  try {
    // Parse optional config from request body
    let config: TaktConfig | undefined
    try {
      const body = await request.json()
      if (body && Object.keys(body).length > 0) {
        config = {
          populationSize: body.population_size ?? 150,
          generations: body.generations ?? 80,
          mutationRate: body.mutation_rate ?? 0.12,
          crossoverRate: body.crossover_rate ?? 0.85,
          tournamentSize: 4,
          elitismCount: 2,
        }
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    const gaConfig: TaktConfig = config || {
      populationSize: 150,
      generations: 80,
      mutationRate: 0.12,
      crossoverRate: 0.85,
      tournamentSize: 4,
      elitismCount: 2,
    }

    const ga = new TaktGeneticAlgorithm(
      project.projectData as Record<string, unknown>,
      gaConfig
    )
    const result = ga.optimize()

    const optimizationTime = Date.now() - startTime
    const totalSimulations = gaConfig.populationSize * gaConfig.generations

    // Save optimization result
    const dbResult = await prisma.optimizationResult.create({
      data: {
        projectId: project.id,
        bestPlan: JSON.parse(JSON.stringify(result.best_plan)),
        scenarios: JSON.parse(JSON.stringify(result.scenarios)),
        evolutionHistory: JSON.parse(JSON.stringify(result.evolution_history)),
        durationMs: optimizationTime,
        populationSize: gaConfig.populationSize,
        generations: gaConfig.generations,
        totalSimulations: totalSimulations,
      },
    })

    // Update project status
    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'completed' },
    })

    return NextResponse.json({
      optimization_id: dbResult.id,
      project_id: project.id,
      best_plan: result.best_plan,
      scenarios: result.scenarios,
      statistics: {
        duration_days: result.best_plan.duration,
        cost_tl: result.best_plan.cost,
        fitness: result.best_plan.fitness,
        simulations: totalSimulations,
        optimization_time_ms: optimizationTime,
      },
    })
  } catch (error) {
    // Mark project as failed
    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'failed' },
    })

    console.error(`Optimization failed for project ${projectId}:`, error)
    return NextResponse.json(
      { detail: `Optimization failed: ${error}` },
      { status: 500 }
    )
  }
}
