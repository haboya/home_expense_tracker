import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getAuthSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getAuthSession()
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  
  return session
}

export function isAdmin(session: any): boolean {
  return session?.user?.role === 'admin'
}

export function getUserFilter(session: any) {
  // Admin can see all data, regular users only see their own
  if (isAdmin(session)) {
    return {}
  }
  
  return { userId: session.user.id }
}
