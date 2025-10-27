'use client'

import { useSession } from 'next-auth/react'

export default function AdminBadge() {
  const { data: session } = useSession()

  if (session?.user?.role !== 'admin') {
    return null
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
      Admin
    </span>
  )
}
