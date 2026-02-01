import { prisma } from './prisma'

export async function getActivePeriod(userId: string) {
  return prisma.budgetPeriod.findFirst({
    where: {
      userId,
      isActive: true,
      status: 'ACTIVE',
    },
  })
}

export async function ensureActivePeriod(userId: string) {
  // Fast path: return existing active period if present
  const existing = await getActivePeriod(userId)
  if (existing) return existing

  // Deterministic ID so competing creations collide and only one succeeds
  const defaultId = `${userId}-default`

  try {
    const created = await prisma.budgetPeriod.create({
      data: {
        id: defaultId, // deterministic to enforce single creation
        userId,
        name: 'Default Period',
        startDate: new Date().toISOString(),
        isActive: true,
        status: 'ACTIVE',
      },
    })
    return created
  } catch (err: any) {
    // If another request created it simultaneously, fetch and return it
    const active = await getActivePeriod(userId)
    if (active) return active
    // Fallback: rethrow original error if still nothing
    throw err
  }
}
