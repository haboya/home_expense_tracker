import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserFilter } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { distributeIncome } from '@/lib/income-distribution'
import { ensureActivePeriod } from '@/lib/period-helpers'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import { financialLog, logFinancial } from '@/lib/finanacials'

const incomeSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string(),
  details: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const periodId = searchParams.get('periodId')

    // Get active period or use provided periodId
    const activePeriod = await ensureActivePeriod(session.user.id)
    const targetPeriodId = periodId || activePeriod.id

    const filter = getUserFilter(session)
    const where: any = { 
      ...filter,
      periodId: targetPeriodId,
    }

    if (startDate || endDate) {
      where.createdAt = {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      }
    }

    const incomes = await prisma.income.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(incomes)
  } catch (error) {
    console.error('Error fetching incomes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = incomeSchema.parse(body)

    // Get active period
    const activePeriod = await ensureActivePeriod(session.user.id)

    // Create income entry
    const income = await prisma.income.create({
      data: {
        amount: new Decimal(validatedData.amount),
        categoryId: Number(validatedData.categoryId),
        details: validatedData.details,
        userId: session.user.id,
        periodId: activePeriod.id,
      },
      include: {
        category: true,
      },
    })

    // Distribute income to expense categories
    try {
      const distributions = await distributeIncome(
        session.user.id,
        new Decimal(validatedData.amount),
        new Date()
      )

      const logs: financialLog[] = distributions.map((dist) => {
        return {
          categoryId: dist.expenseCategoryId.toString(),
          amount: Number(dist.amount),
          increment: true
        }
      })

      await logFinancial( logs, income.userId, income.id.toString(), 'DEPOSIT', Number(income.amount))

      return NextResponse.json(
        {
          income,
          distributions,
          message: 'Income recorded and distributed successfully',
        },
        { status: 201 }
      )
    } catch (distributionError: any) {
      // If distribution fails, still return the income but with error message
      return NextResponse.json(
        {
          income,
          error: distributionError.message,
          message: 'Income recorded but distribution failed',
        },
        { status: 201 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(error.errors)
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating income:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
