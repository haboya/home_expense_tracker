import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserFilter } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { distributeIncome } from '@/lib/income-distribution'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const incomeSchema = z.object({
  date: z.string(),
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

    const filter = getUserFilter(session)
    const where: any = { ...filter }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const incomes = await prisma.income.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
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

    // Create income entry
    const income = await prisma.income.create({
      data: {
        date: new Date(validatedData.date),
        amount: new Decimal(validatedData.amount),
        categoryId: validatedData.categoryId,
        details: validatedData.details,
        userId: session.user.id,
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
        new Date(validatedData.date)
      )

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
