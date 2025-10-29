import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAvailableBalance } from '@/lib/income-distribution'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const date = searchParams.get('date')

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    const balance = await getAvailableBalance(
      session.user.id,
      parseInt(categoryId),
      date ? new Date(date) : new Date()
    )

    return NextResponse.json({ 
      categoryId: parseInt(categoryId),
      availableBalance: balance.toString(),
      date: date || new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching available balance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
