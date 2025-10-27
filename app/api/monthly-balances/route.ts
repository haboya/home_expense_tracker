import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserFilter } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get('monthYear')

    const filter = getUserFilter(session)
    const where: any = { ...filter }

    if (monthYear) {
      where.monthYear = monthYear
    }

    const balances = await prisma.monthlyBalance.findMany({
      where,
      include: {
        expenseCategory: true,
      },
      orderBy: [{ monthYear: 'desc' }, { expenseCategory: { name: 'asc' } }],
    })

    return NextResponse.json(balances)
  } catch (error) {
    console.error('Error fetching monthly balances:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
