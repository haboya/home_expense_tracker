'use client'

import { SessionProvider } from 'next-auth/react'
import { PeriodProvider } from '@/contexts/PeriodContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PeriodProvider>{children}</PeriodProvider>
    </SessionProvider>
  )
}
