import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createPeriodSchema = z.object({
  name: z.string().min(1, 'Period name is required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
})

// GET all periods for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const periods = await prisma.budgetPeriod.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            incomes: true,
            expenses: true,
          },
        },
      },
    })

    return NextResponse.json({ periods })
  } catch (error) {
    console.error('Error fetching periods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a new period
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createPeriodSchema.parse(body)

    // Check if user already has an active period
    const activePeriod = await prisma.budgetPeriod.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    })

    if (activePeriod) {
      return NextResponse.json(
        { error: 'You already have an active period. Please close it before creating a new one.' },
        { status: 400 }
      )
    }

    // Create the new period
    const newPeriod = await prisma.budgetPeriod.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        isActive: true,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ period: newPeriod }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating period:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
