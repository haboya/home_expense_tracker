'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface BudgetPeriod {
  id: string
  name: string
  startDate: string
  endDate: string | null
  isActive: boolean
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
}

interface PeriodContextType {
  periods: BudgetPeriod[]
  selectedPeriod: BudgetPeriod | null
  isLoading: boolean
  setSelectedPeriod: (period: BudgetPeriod) => void
  refreshPeriods: () => Promise<void>
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined)

export function PeriodProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [periods, setPeriods] = useState<BudgetPeriod[]>([])
  const [selectedPeriod, setSelectedPeriodState] = useState<BudgetPeriod | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPeriods = async () => {
    if (!session?.user?.id) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/periods')
      const data = await response.json()

      if (response.ok && data.periods) {
        setPeriods(data.periods)
        
        // If no period is selected, select the active one or the first one
        if (!selectedPeriod && data.periods.length > 0) {
          const activePeriod = data.periods.find((p: BudgetPeriod) => p.isActive)
          const periodToSelect = activePeriod || data.periods[0]
          setSelectedPeriodState(periodToSelect)
          // Save to localStorage
          localStorage.setItem('selectedPeriodId', periodToSelect.id)
        } else if (selectedPeriod) {
          // Update the selected period with fresh data
          const updatedPeriod = data.periods.find((p: BudgetPeriod) => p.id === selectedPeriod.id)
          if (updatedPeriod) {
            setSelectedPeriodState(updatedPeriod)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching periods:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load selected period from localStorage on mount
  useEffect(() => {
    if (session?.user?.id) {
      const savedPeriodId = localStorage.getItem('selectedPeriodId')
      if (savedPeriodId && periods.length > 0) {
        const savedPeriod = periods.find(p => p.id === savedPeriodId)
        if (savedPeriod) {
          setSelectedPeriodState(savedPeriod)
        }
      }
    }
  }, [session, periods.length])

  useEffect(() => {
    fetchPeriods()
  }, [session?.user?.id])

  const setSelectedPeriod = (period: BudgetPeriod) => {
    setSelectedPeriodState(period)
    localStorage.setItem('selectedPeriodId', period.id)
  }

  const refreshPeriods = async () => {
    await fetchPeriods()
  }

  return (
    <PeriodContext.Provider
      value={{
        periods,
        selectedPeriod,
        isLoading,
        setSelectedPeriod,
        refreshPeriods,
      }}
    >
      {children}
    </PeriodContext.Provider>
  )
}

export function usePeriod() {
  const context = useContext(PeriodContext)
  if (context === undefined) {
    throw new Error('usePeriod must be used within a PeriodProvider')
  }
  return context
}
