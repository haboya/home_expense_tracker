import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { ensureActivePeriod } from './period-helpers'

export interface IncomeDistribution {
  expenseCategoryId: number
  categoryName: string
  amount: Decimal
  monthYear: string
}

/**
 * Distributes income among expense categories based on their percentage share
 * and updates the monthly balances accordingly
 */
export async function distributeIncome(
  userId: string,
  incomeAmount: Decimal,
  incomeDate: Date
): Promise<IncomeDistribution[]> {
  // Get active period
  const activePeriod = await ensureActivePeriod(userId)
  // Get all expense categories for the user
  const expenseCategories = await prisma.expenseCategory.findMany({
    where: { userId },
  })

  if (expenseCategories.length === 0) {
    throw new Error('No expense categories found. Please create expense categories first.')
  }

  // Validate that total percentage share equals 100
  const totalPercentage = expenseCategories.reduce(
    (sum, cat) => sum.add(cat.percentageShare),
    new Decimal(0)
  )

  if (!totalPercentage.equals(100)) {
    throw new Error(
      `Total percentage share must equal 100%. Current total: ${totalPercentage}%`
    )
  }

  const monthYear = formatMonthYear(incomeDate)
  const distributions: IncomeDistribution[] = []

  // Distribute income to each category
  for (const category of expenseCategories) {
    const distributionAmount = incomeAmount
      .mul(category.percentageShare)
      .div(100)

    // Find or create monthly balance for this category and month
    const existingBalance = await prisma.monthlyBalance.findUnique({
      where: {
        monthYear_expenseCategoryId_userId_periodId: {
          monthYear,
          expenseCategoryId: category.id,
          userId,
          periodId: activePeriod.id,
        },
      },
    })

    if (existingBalance) {
      // Update existing balance
      const newTotalDeposits = existingBalance.totalDeposits.add(distributionAmount)
      const newClosingBalance = existingBalance.openingBalance
        .add(newTotalDeposits)
        .sub(existingBalance.totalWithdrawals)

      await prisma.monthlyBalance.update({
        where: { id: existingBalance.id },
        data: {
          totalDeposits: newTotalDeposits,
          closingBalance: newClosingBalance,
        },
      })
    } else {
      // Get previous month's closing balance
      const previousMonthYear = getPreviousMonthYear(incomeDate)
      const previousBalance = await prisma.monthlyBalance.findUnique({
        where: {
          monthYear_expenseCategoryId_userId_periodId: {
            monthYear: previousMonthYear,
            expenseCategoryId: category.id,
            userId,
            periodId: activePeriod.id,
          },
        },
      })

      const openingBalance = previousBalance?.closingBalance || new Decimal(0)
      const closingBalance = openingBalance.add(distributionAmount)

      // Create new monthly balance
      await prisma.monthlyBalance.create({
        data: {
          monthYear,
          expenseCategoryId: category.id,
          userId,
          periodId: activePeriod.id,
          openingBalance,
          totalDeposits: distributionAmount,
          totalWithdrawals: new Decimal(0),
          closingBalance,
        },
      })
    }

    distributions.push({
      expenseCategoryId: category.id,
      categoryName: category.name,
      amount: distributionAmount,
      monthYear,
    })
  }

  return distributions
}

/**
 * Updates monthly balance when an expense is recorded
 * Throws an error if the expense would result in a negative balance
 */
export async function recordExpense(
  userId: string,
  expenseCategoryId: string,
  expenseAmount: Decimal,
  expenseDate: Date
): Promise<void> {
  // Get active period
  const activePeriod = await ensureActivePeriod(userId)
  const monthYear = formatMonthYear(expenseDate)

  // Find or create monthly balance
  const existingBalance = await prisma.monthlyBalance.findUnique({
    where: {
      monthYear_expenseCategoryId_userId_periodId: {
        monthYear,
        expenseCategoryId: Number(expenseCategoryId),
        userId,
        periodId: activePeriod.id,
      },
    },
  })

  if (existingBalance) {
    // Update existing balance
    const newTotalWithdrawals = existingBalance.totalWithdrawals.add(expenseAmount)
    const newClosingBalance = existingBalance.openingBalance
      .add(existingBalance.totalDeposits)
      .sub(newTotalWithdrawals)

    // Check if balance would be negative
    if (newClosingBalance.lessThan(0)) {
      const category = await prisma.expenseCategory.findUnique({
        where: { id: Number(expenseCategoryId) },
        select: { name: true },
      })
      throw new Error(
        `Insufficient funds in ${category?.name || 'category'}. Available balance: ${existingBalance.closingBalance.toFixed(2)}, Expense amount: ${expenseAmount.toFixed(2)}`
      )
    }

    await prisma.monthlyBalance.update({
      where: { id: existingBalance.id },
      data: {
        totalWithdrawals: newTotalWithdrawals,
        closingBalance: newClosingBalance,
      },
    })
  } else {
    // Get previous month's closing balance
    const previousMonthYear = getPreviousMonthYear(expenseDate)
    const previousBalance = await prisma.monthlyBalance.findUnique({
      where: {
        monthYear_expenseCategoryId_userId_periodId: {
          monthYear: previousMonthYear,
          expenseCategoryId: Number(expenseCategoryId),
          userId,
          periodId: activePeriod.id,
        },
      },
    })

    const openingBalance = previousBalance?.closingBalance || new Decimal(0)
    const closingBalance = openingBalance.sub(expenseAmount)

    // Check if balance would be negative
    if (closingBalance.lessThan(0)) {
      const category = await prisma.expenseCategory.findUnique({
        where: { id: Number(expenseCategoryId) },
        select: { name: true },
      })
      throw new Error(
        `Insufficient funds in ${category?.name || 'category'}. Available balance: ${openingBalance.toFixed(2)}, Expense amount: ${expenseAmount.toFixed(2)}`
      )
    }

    // Create new monthly balance
    await prisma.monthlyBalance.create({
      data: {
        monthYear,
        expenseCategoryId: Number(expenseCategoryId),
        userId,
        periodId: activePeriod.id,
        openingBalance,
        totalDeposits: new Decimal(0),
        totalWithdrawals: expenseAmount,
        closingBalance,
      },
    })
  }
}

/**
 * Get available balance for an expense category in a specific month
 */
export async function getAvailableBalance(
  userId: string,
  expenseCategoryId: number,
  date: Date = new Date()
): Promise<Decimal> {
  // Get active period
  const activePeriod = await ensureActivePeriod(userId)
  const monthYear = formatMonthYear(date)

  // Find monthly balance
  const existingBalance = await prisma.monthlyBalance.findUnique({
    where: {
      monthYear_expenseCategoryId_userId_periodId: {
        monthYear,
        expenseCategoryId,
        userId,
        periodId: activePeriod.id,
      },
    },
  })

  if (existingBalance) {
    return existingBalance.closingBalance
  }

  // Get previous month's closing balance
  const previousMonthYear = getPreviousMonthYear(date)
  const previousBalance = await prisma.monthlyBalance.findUnique({
    where: {
      monthYear_expenseCategoryId_userId_periodId: {
        monthYear: previousMonthYear,
        expenseCategoryId,
        userId,
        periodId: activePeriod.id,
      },
    },
  })

  return previousBalance?.closingBalance || new Decimal(0)
}

/**
 * Format date as YYYY-MM
 */
function formatMonthYear(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Get previous month in YYYY-MM format
 */
function getPreviousMonthYear(date: Date): string {
  const d = new Date(date)
  d.setMonth(d.getMonth() - 1)
  return formatMonthYear(d)
}
