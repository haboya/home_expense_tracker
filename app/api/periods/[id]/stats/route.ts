import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// GET detailed statistics for a specific period
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
    })

    if (!period) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    // Get income statistics by category
    const incomesByCategory = await prisma.income.groupBy({
      by: ['categoryId'],
      where: {
        userId: session.user.id,
        periodId: params.id,
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    const incomeCategoriesData = await Promise.all(
      incomesByCategory.map(async (item) => {
        const category = await prisma.incomeCategory.findUnique({
          where: { id: item.categoryId },
        })
        return {
          categoryId: item.categoryId,
          categoryName: category?.name || 'Unknown',
          total: item._sum.amount?.toString() || '0',
          count: item._count,
        }
      })
    )

    // Get expense statistics by category
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        userId: session.user.id,
        periodId: params.id,
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    const expenseCategoriesData = await Promise.all(
      expensesByCategory.map(async (item) => {
        const category = await prisma.expenseCategory.findUnique({
          where: { id: item.categoryId },
        })
        return {
          categoryId: item.categoryId,
          categoryName: category?.name || 'Unknown',
          total: item._sum.amount?.toString() || '0',
          count: item._count,
        }
      })
    )

    // Get monthly income trend
    const incomes = await prisma.income.findMany({
      where: {
        userId: session.user.id,
        periodId: params.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const incomesByMonth: Record<string, number> = {}
    incomes.forEach((income) => {
      const monthYear = `${income.createdAt.getFullYear()}-${String(income.createdAt.getMonth() + 1).padStart(2, '0')}`
      const amount = income.amount instanceof Decimal ? parseFloat(income.amount.toString()) : parseFloat(String(income.amount))
      incomesByMonth[monthYear] = (incomesByMonth[monthYear] || 0) + amount
    })

    // Get monthly expense trend
    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        periodId: params.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const expensesByMonth: Record<string, number> = {}
    expenses.forEach((expense) => {
      const monthYear = `${expense.createdAt.getFullYear()}-${String(expense.createdAt.getMonth() + 1).padStart(2, '0')}`
      const amount = expense.amount instanceof Decimal ? parseFloat(expense.amount.toString()) : parseFloat(String(expense.amount))
      expensesByMonth[monthYear] = (expensesByMonth[monthYear] || 0) + amount
    })

    // Calculate totals
    const totalIncome = incomeCategoriesData.reduce((sum, item) => sum + parseFloat(item.total), 0)
    const totalExpenses = expenseCategoriesData.reduce((sum, item) => sum + parseFloat(item.total), 0)
    const netBalance = totalIncome - totalExpenses

    // Get current balances
    const latestBalances = await prisma.monthlyBalance.findMany({
      where: {
        userId: session.user.id,
        periodId: params.id,
      },
      include: {
        expenseCategory: true,
      },
      orderBy: {
        monthYear: 'desc',
      },
    })

    // Group by category and get the latest month for each
    const balancesByCategory = latestBalances.reduce((acc, balance) => {
      if (!acc[balance.expenseCategoryId] || balance.monthYear > acc[balance.expenseCategoryId].monthYear) {
        acc[balance.expenseCategoryId] = balance
      }
      return acc
    }, {} as Record<number, any>)

    const currentBalances = Object.values(balancesByCategory).map((balance) => ({
      categoryId: balance.expenseCategoryId,
      categoryName: balance.expenseCategory.name,
      closingBalance: balance.closingBalance.toString(),
      monthYear: balance.monthYear,
    }))

    return NextResponse.json({
      period,
      summary: {
        totalIncome: totalIncome.toString(),
        totalExpenses: totalExpenses.toString(),
        netBalance: netBalance.toString(),
        incomeCount: incomes.length,
        expenseCount: expenses.length,
      },
      incomesByCategory: incomeCategoriesData,
      expensesByCategory: expenseCategoriesData,
      monthlyTrends: {
        income: incomesByMonth,
        expenses: expensesByMonth,
      },
      currentBalances,
    })
  } catch (error) {
    console.error('Error fetching period stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
