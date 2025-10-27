import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface IncomeDistribution {
  expenseCategoryId: string
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
        monthYear_expenseCategoryId_userId: {
          monthYear,
          expenseCategoryId: category.id,
          userId,
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
          monthYear_expenseCategoryId_userId: {
            monthYear: previousMonthYear,
            expenseCategoryId: category.id,
            userId,
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
 */
export async function recordExpense(
  userId: string,
  expenseCategoryId: string,
  expenseAmount: Decimal,
  expenseDate: Date
): Promise<void> {
  const monthYear = formatMonthYear(expenseDate)

  // Find or create monthly balance
  const existingBalance = await prisma.monthlyBalance.findUnique({
    where: {
      monthYear_expenseCategoryId_userId: {
        monthYear,
        expenseCategoryId,
        userId,
      },
    },
  })

  if (existingBalance) {
    // Update existing balance
    const newTotalWithdrawals = existingBalance.totalWithdrawals.add(expenseAmount)
    const newClosingBalance = existingBalance.openingBalance
      .add(existingBalance.totalDeposits)
      .sub(newTotalWithdrawals)

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
        monthYear_expenseCategoryId_userId: {
          monthYear: previousMonthYear,
          expenseCategoryId,
          userId,
        },
      },
    })

    const openingBalance = previousBalance?.closingBalance || new Decimal(0)
    const closingBalance = openingBalance.sub(expenseAmount)

    // Create new monthly balance
    await prisma.monthlyBalance.create({
      data: {
        monthYear,
        expenseCategoryId,
        userId,
        openingBalance,
        totalDeposits: new Decimal(0),
        totalWithdrawals: expenseAmount,
        closingBalance,
      },
    })
  }
}

/**
 * Format date as YYYY-MM
 */
function formatMonthYear(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
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
