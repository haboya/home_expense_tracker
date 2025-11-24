import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// We need to limit connections to avoid exhausting the pool
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Helper function to safely execute queries with connection management
export async function prismaQuery<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    const result = await operation(prisma)
    return result
  } catch (error) {
    // If connection limit error, wait and retry once
    if (error instanceof Error && error.message.includes('max_user_connections')) {
      console.warn('Connection limit reached, retrying after 2 seconds...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      return await operation(prisma)
    }
    throw error
  }
}

// Graceful shutdown - disconnect on process termination
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
  
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
