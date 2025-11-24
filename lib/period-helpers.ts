import { prisma } from './prisma'

export async function getActivePeriod(userId: string) {
  const activePeriod = await prisma.budgetPeriod.findFirst({
    where: {
      userId,
      isActive: true,
    },
  })

  return activePeriod
}

export async function ensureActivePeriod(userId: string) {
  let activePeriod = await getActivePeriod(userId)

  // If no active period exists, create a default one
  if (!activePeriod) {
    activePeriod = await prisma.budgetPeriod.create({
      data: {
        userId,
        name: 'Default Period',
        startDate: new Date(),
        isActive: true,
        status: 'ACTIVE',
      },
    })
  }

  return activePeriod
}
