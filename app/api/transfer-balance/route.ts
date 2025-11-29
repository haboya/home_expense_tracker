import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fromCategoryId, toCategoryId, amount, monthYear } = await request.json()

    // Validate inputs
    if (!fromCategoryId || !toCategoryId || !amount || !monthYear) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (fromCategoryId === toCategoryId) {
      return NextResponse.json({ error: 'Cannot transfer to the same category' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 })
    }

    // Get the active period for the user
    const period = await prisma.budgetPeriod.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
    })

    if (!period) {
      return NextResponse.json({ error: 'No active budget period found' }, { status: 400 })
    }

    // Get the source balance
    const fromBalance = await prisma.monthlyBalance.findFirst({
      where: {
        expenseCategoryId: Number(fromCategoryId),
        monthYear,
        periodId: period.id,
      },
    })

    if (!fromBalance) {
      return NextResponse.json({ error: 'Source category balance not found' }, { status: 404 })
    }

    const availableBalance = fromBalance.closingBalance
    
    if (availableBalance < amount) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: ${availableBalance}` },
        { status: 400 }
      )
    }

    // Get or create the destination balance
    let toBalance = await prisma.monthlyBalance.findFirst({
      where: {
        expenseCategoryId: Number(toCategoryId),
        monthYear,
        periodId: period.id,
      },
    })

    if (!toBalance) {
      toBalance = await prisma.monthlyBalance.create({
        data: {
          expenseCategoryId: Number(toCategoryId),
          monthYear,
          periodId: period.id,
          openingBalance: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          closingBalance: 0,
          userId: session.user.id,
        },
      })
    }

    // Perform the transfer
    await prisma.$transaction([
      // Deduct from source category
      prisma.monthlyBalance.update({
        where: { id: fromBalance.id },
        data: {
          totalWithdrawals: {
            increment: amount,
          },
          closingBalance: {
            decrement: amount,
          },
        },
      }),
      // Add to destination category
      prisma.monthlyBalance.update({
        where: { id: toBalance.id },
        data: {
          totalDeposits: {
            increment: amount,
          },
          closingBalance: {
            increment: amount,
          },
        },
      }),
    ])

    return NextResponse.json({ 
      success: true,
      message: 'Transfer completed successfully' 
    })
  } catch (error) {
    console.error('Transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to complete transfer' },
      { status: 500 }
    )
  }
}
