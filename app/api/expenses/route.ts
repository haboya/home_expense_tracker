import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserFilter } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { recordExpense } from '@/lib/income-distribution'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const expenseSchema = z.object({
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
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
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
    const validatedData = expenseSchema.parse(body)

    // Update monthly balance first to check for insufficient funds
    // before creating the expense record
    try {
      await recordExpense(
        session.user.id,
        validatedData.categoryId,
        new Decimal(validatedData.amount),
        new Date(validatedData.date)
      )
    } catch (balanceError: any) {
      // If it's an insufficient funds error, return it to the user
      if (balanceError.message?.includes('Insufficient funds')) {
        return NextResponse.json(
          { error: balanceError.message },
          { status: 400 }
        )
      }
      throw balanceError
    }

    // Create expense entry only after balance update succeeds
    const expense = await prisma.expense.create({
      data: {
        amount: new Decimal(validatedData.amount),
        categoryId: Number(validatedData.categoryId),
        details: validatedData.details,
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(
      { expense, message: 'Expense recorded successfully' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
