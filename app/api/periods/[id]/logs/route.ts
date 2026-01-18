import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";


export async function GET(
    request: Request,
    { params }: { params: { id: string } } 
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

        // Fetch expense categories for category name lookup
        const expenseCategories = await prisma.expenseCategory.findMany({
            where: { userId: session.user.id },
            select: { id: true, name: true }
        })
        const categoryMap = Object.fromEntries(
            expenseCategories.map(cat => [cat.id.toString(), cat.name])
        )

        const logs = await prisma.financialTransaction.findMany({
            where: {
                userId: session.user.id,
                timestamp: {
                    lte: new Date(period.endDate ? period.endDate.toISOString() : new Date()),
                    gte: new Date(period.startDate)
                }
            },
            orderBy: {
                timestamp: 'asc'
            }
        })

        return NextResponse.json({
            logs,
            categoryMap
        }, {
            status: 200
        })
    } catch(error) {
        console.error(error)
        return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
        )
    }
}