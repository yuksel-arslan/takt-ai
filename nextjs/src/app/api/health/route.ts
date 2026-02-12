import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    service: 'TAKT AI',
    status: 'operational',
    database: 'not-checked',
    environment: process.env.NODE_ENV || 'development',
    timestamp: Date.now() / 1000,
  })
}
