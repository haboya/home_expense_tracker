'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/format'

interface BudgetPeriod {
  id: string
  name: string
  startDate: string
  endDate: string | null
  isActive: boolean
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  createdAt: string
  _count: {
    incomes: number
    expenses: number
  }
}

export default function PeriodsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [periods, setPeriods] = useState<BudgetPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  })

  // Close period form state
  const [closeFormData, setCloseFormData] = useState({
    transferBalances: false,
    newPeriodName: '',
    newPeriodStartDate: new Date().toISOString().split('T')[0],
  })

  // Edit period form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    endDate: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user?.id) {
      fetchPeriods()
    }
  }, [session, status, router])

  const fetchPeriods = async () => {
    try {
      const response = await fetch('/api/periods')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch periods')
      } else {
        setPeriods(data.periods || [])
      }
    } catch (err) {
      setError('An error occurred while fetching periods')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create period')
      } else {
        setFormData({ name: '', startDate: new Date().toISOString().split('T')[0], endDate: '' })
        setShowCreateForm(false)
        fetchPeriods()
      }
    } catch (err) {
      setError('An error occurred while creating period')
    }
  }

  const handleClosePeriod = async (periodId: string) => {
    setError('')

    try {
      const response = await fetch(`/api/periods/${periodId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferBalances: closeFormData.transferBalances,
          newPeriodName: closeFormData.newPeriodName,
          newPeriodStartDate: new Date(closeFormData.newPeriodStartDate).toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to close period')
      } else {
        setShowCloseDialog(null)
        setCloseFormData({
          transferBalances: false,
          newPeriodName: '',
          newPeriodStartDate: new Date().toISOString().split('T')[0],
        })
        fetchPeriods()
      }
    } catch (err) {
      setError('An error occurred while closing period')
    }
  }

  const handleEditPeriod = async (periodId: string) => {
    setError('')

    try {
      const response = await fetch(`/api/periods/${periodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          endDate: editFormData.endDate ? new Date(editFormData.endDate).toISOString() : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update period')
      } else {
        setShowEditDialog(null)
        setEditFormData({ name: '', endDate: '' })
        fetchPeriods()
      }
    } catch (err) {
      setError('An error occurred while updating period')
    }
  }

  const openEditDialog = (period: BudgetPeriod) => {
    setEditFormData({
      name: period.name,
      endDate: period.endDate ? new Date(period.endDate).toISOString().split('T')[0] : '',
    })
    setShowEditDialog(period.id)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const activePeriod = periods.find((p) => p.isActive)

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Periods</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your budget periods for better financial tracking
          </p>
        </div>
        {!activePeriod && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Create New Period
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Create Period Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create New Budget Period</h2>
            <form onSubmit={handleCreatePeriod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Q1 2025, Annual 2025"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({ name: '', startDate: new Date().toISOString().split('T')[0], endDate: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Period Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl text-gray-500 font-bold mb-4">Edit Budget Period</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleEditPeriod(showEditDialog)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Q1 2025"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={editFormData.endDate}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditDialog(null)
                    setEditFormData({ name: '', endDate: '' })
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Period Dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl text-gray-500 font-bold mb-4">Close Budget Period</h2>
            <p className="text-sm text-gray-400 mb-4">
              Closing this period will make it read-only and create a new active period.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleClosePeriod(showCloseDialog)
              }}
              className="space-y-4"
            >
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={closeFormData.transferBalances}
                    onChange={(e) =>
                      setCloseFormData({ ...closeFormData, transferBalances: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Transfer balances to new period</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Period Name *
                </label>
                <input
                  type="text"
                  value={closeFormData.newPeriodName}
                  onChange={(e) =>
                    setCloseFormData({ ...closeFormData, newPeriodName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Q2 2025"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Period Start Date *
                </label>
                <input
                  type="date"
                  value={closeFormData.newPeriodStartDate}
                  onChange={(e) =>
                    setCloseFormData({ ...closeFormData, newPeriodStartDate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCloseDialog(null)
                    setCloseFormData({
                      transferBalances: false,
                      newPeriodName: '',
                      newPeriodStartDate: new Date().toISOString().split('T')[0],
                    })
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Close Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Periods List */}
      <div className="space-y-4">
        {periods && periods.length > 0 ? (
          periods.map((period) => (
            <div
              key={period.id}
              className={`bg-white shadow rounded-lg p-6 ${
                period.isActive ? 'border-2 border-green-500' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{period.name}</h3>
                    {period.isActive && (
                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                        Active
                      </span>
                    )}
                    {period.status === 'CLOSED' && (
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                        Closed
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Start:</span> {formatDate(period.startDate)}
                    </p>
                    {period.endDate && (
                      <p>
                        <span className="font-medium">End:</span> {formatDate(period.endDate)}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Incomes:</span> {period._count.incomes} |{' '}
                      <span className="font-medium">Expenses:</span> {period._count.expenses}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/periods/${period.id}`)}
                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                  >
                    View Details
                  </button>
                  {period.isActive && (
                    <>
                      <button
                        onClick={() => openEditDialog(period)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowCloseDialog(period.id)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        Close Period
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
            <p>No budget periods found. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}
