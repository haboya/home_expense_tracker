import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePeriodSchema = z.object({
  name: z.string().min(1).optional(),
  endDate: z.string().datetime().nullable().optional(),
})

// GET specific period
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const period = await prisma.budgetPeriod.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            incomes: true,
            expenses: true,
            monthlyBalances: true,
          },
        },
      },
    })

    if (!period) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ period })
  } catch (error) {
    console.error('Error fetching period:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH update period
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updatePeriodSchema.parse(body)

    // Check if period exists and belongs to user
    const existingPeriod = await prisma.budgetPeriod.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingPeriod) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    if (existingPeriod.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Cannot update a closed period' },
        { status: 400 }
      )
    }

    const updatedPeriod = await prisma.budgetPeriod.update({
      where: { id: params.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.endDate !== undefined && {
          endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        }),
      },
    })

    return NextResponse.json({ period: updatedPeriod })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating period:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE period (only if no data)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if period exists and belongs to user
    const period = await prisma.budgetPeriod.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            incomes: true,
            expenses: true,
          },
        },
      },
    })

    if (!period) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    // Prevent deletion if period has data
    if (period._count.incomes > 0 || period._count.expenses > 0) {
      return NextResponse.json(
        { error: 'Cannot delete period with existing incomes or expenses. Archive it instead.' },
        { status: 400 }
      )
    }

    await prisma.budgetPeriod.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Period deleted successfully' })
  } catch (error) {
    console.error('Error deleting period:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
