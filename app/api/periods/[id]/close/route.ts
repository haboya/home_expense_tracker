import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const closePeriodSchema = z.object({
  transferBalances: z.boolean().default(false),
  newPeriodName: z.string().min(1, 'New period name is required'),
  newPeriodStartDate: z.string().datetime(),
})

// POST close a period and optionally create a new one
export async function POST(
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
    const validatedData = closePeriodSchema.parse(body)

    // Check if period exists and belongs to user
    const period = await prisma.budgetPeriod.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!period) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    if (period.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Period is already closed' },
        { status: 400 }
      )
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Close the current period
      const closedPeriod = await tx.budgetPeriod.update({
        where: { id: params.id },
        data: {
          status: 'CLOSED',
          isActive: false,
          endDate: new Date().toISOString(),
        },
      })

      // Create new period
      const newPeriod = await tx.budgetPeriod.create({
        data: {
          userId: session.user.id!,
          name: validatedData.newPeriodName,
          startDate: new Date(validatedData.newPeriodStartDate),
          isActive: true,
          status: 'ACTIVE',
        },
      })

      // Transfer balances if requested
      if (validatedData.transferBalances) {
        // Get all current month balances from the closed period
        const currentBalances = await tx.monthlyBalance.findMany({
          where: {
            periodId: params.id,
            userId: session.user.id,
          },
        })

        // Create new balances in the new period with the closing balances as opening balances
        const newBalances = currentBalances.map((balance) => ({
          userId: session.user.id!,
          periodId: newPeriod.id,
          expenseCategoryId: balance.expenseCategoryId,
          monthYear: new Date(validatedData.newPeriodStartDate)
            .toISOString()
            .slice(0, 7), // Format: YYYY-MM
          openingBalance: balance.closingBalance,
          totalDeposits: 0,
          totalWithdrawals: 0,
          closingBalance: balance.closingBalance,
        }))

        if (newBalances.length > 0) {
          await tx.monthlyBalance.createMany({
            data: newBalances,
          })
        }
      }

      return { closedPeriod, newPeriod }
    })

    return NextResponse.json({
      message: 'Period closed successfully',
      closedPeriod: result.closedPeriod,
      newPeriod: result.newPeriod,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error closing period:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
