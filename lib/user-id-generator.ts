import { prisma } from '@/lib/prisma'

/**
 * Generates a user ID in the format "YY-MM-XXX"
 * where YY is the current year, MM is the month, and XXX is a sequential number that resets monthly
 * 
 * @returns Promise<string> - The generated user ID (e.g., "25-10-001")
 */
export async function generateUserId(): Promise<string> {
  const now = new Date()
  const year = String(now.getUTCFullYear()).slice(-2) // Last 2 digits of year
  const month = String(now.getUTCMonth() + 1).padStart(2, '0') // Month with leading zero
  
  const prefix = `${year}-${month}-`
  
  // Find the highest user ID for the current month
  const users = await prisma.user.findMany({
    where: {
      id: {
        startsWith: prefix,
      },
    },
    select: {
      id: true,
    },
    orderBy: {
      id: 'desc',
    },
    take: 1,
  })
  
  let nextNumber = 1
  
  if (users.length > 0) {
    // Extract the number part from the last user ID
    const lastId = users[0].id
    const numberPart = lastId.split('-')[2]
    nextNumber = parseInt(numberPart, 10) + 1
  }
  
  // Format the number with leading zeros (e.g., 001, 002, ..., 999)
  const formattedNumber = String(nextNumber).padStart(3, '0')
  
  return `${prefix}${formattedNumber}`
}
