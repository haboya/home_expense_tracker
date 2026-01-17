import { TransactionType } from "@prisma/client"
import { prisma } from "./prisma"

export interface financialLog {
    categoryId: string
    amount: number
    increment: boolean
}

export async function logFinancial(
    newData: financialLog[],
    userId: string,
    refId: string,
    transaction: TransactionType,
    amount: number
) {
    // confirm we have financialLog data
    if(newData.length === 0) {
        // console.log('No data to adjust')
        return
    }
    // Get all expense categories for the user
    const expenseCategories = await prisma.expenseCategory.findMany({
        where: { userId },
        select: { id: true }
    })

    if(expenseCategories.length === 0) {
        // console.log('User has no expense categories')
        return
    }

    let existingBalances: Record<string, number> = {}
    // get the latest financial log for the user 
    const existingLog = await prisma.financialTransaction.findFirst({
        where: {userId},
        orderBy: {
            timestamp: 'desc'
        }
    })

    if(existingLog) {
        existingBalances = existingLog.balances as Record<string, number>
    }

    // capture any new categories
    expenseCategories.forEach((cat) => {
        let catFound = false
        for(const [ct, val] of Object.entries(existingBalances)) {
            if(cat.id.toString() == ct) {
                catFound = true
            }
        }
        if(!catFound) {
            existingBalances[cat.id] = 0
        }
    })

    // adjust the new balancs for the given categories
    newData.forEach((data) => {
        if(existingBalances[data.categoryId] >= 0) {
            if(data.increment) {
                existingBalances[data.categoryId] = existingBalances[data.categoryId] + data.amount
            } else {
                const newAmount = existingBalances[data.categoryId] - amount
                existingBalances[data.categoryId] = (newAmount>0) ? newAmount : 0
            }
        }
    })

    await prisma.financialTransaction.create({
        data: {
            transaction,
            refId,
            amount,
            balances: existingBalances,
            userId
        }
    })

    
}