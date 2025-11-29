'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/format'
import { usePeriod } from '@/contexts/PeriodContext'

export default function BalancesPage() {
  const { selectedPeriod } = usePeriod()
  const [balances, setBalances] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [transferForm, setTransferForm] = useState({
    fromCategoryId: '',
    toCategoryId: '',
    amount: '',
    fromBalance: 0,
    toBalance: 0,
  })
  const [transferError, setTransferError] = useState<string | null>(null)
  const [transferSuccess, setTransferSuccess] = useState(false)

  useEffect(() => {
    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(monthYear)
  }, [])

  useEffect(() => {
    if (selectedMonth && selectedPeriod) {
      fetchBalances()
    }
  }, [selectedMonth, selectedPeriod])

  const fetchBalances = async () => {
    if (!selectedPeriod) return
    
    const res = await fetch(`/api/monthly-balances?monthYear=${selectedMonth}&periodId=${selectedPeriod.id}`)
    setBalances(await res.json())
  }

  const getClosingBalance = (categoryId: string) => {
    const balance = balances.find(b => b.expenseCategory.id.toString() === categoryId)
    return balance ? parseFloat(balance.closingBalance) : 0
  }

  const updateTransferAmount = (destination: 'from' | 'to' | 'both', value: string) => {
    // Ensure only valid numeric input
    if (/^\d*\.?\d*$/.test(value)) {
      switch (destination) {
        case 'from':
          const fromBal = getClosingBalance(value) - parseFloat(transferForm.amount || '0')
          setTransferForm({ ...transferForm, fromCategoryId: value, fromBalance: fromBal })
          break
        case 'to':
          const toBal = getClosingBalance(value) + parseFloat(transferForm.amount || '0')
          setTransferForm({ ...transferForm, toCategoryId: value, toBalance: toBal })
          break
        case 'both':
          setTransferForm({ ...transferForm, amount: value })
          const fromBalance = getClosingBalance(transferForm.fromCategoryId) - parseFloat(value || '0')
          const toBalance = getClosingBalance(transferForm.toCategoryId) + parseFloat(value || '0')
          setTransferForm({ ...transferForm, amount: value, fromBalance, toBalance })
          break
      }
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setTransferError(null)
    setTransferSuccess(false)

    if (transferForm.fromCategoryId === transferForm.toCategoryId) {
      setTransferError('Cannot transfer to the same category')
      return
    }

    try {
      const res = await fetch('/api/transfer-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCategoryId: Number(transferForm.fromCategoryId),
          toCategoryId: Number(transferForm.toCategoryId),
          amount: parseFloat(transferForm.amount),
          monthYear: selectedMonth,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setTransferError(data.error || 'Transfer failed')
        return
      }

      setTransferSuccess(true)
      setTransferForm({ fromCategoryId: '', toCategoryId: '', amount: '', fromBalance: 0, toBalance: 0 })
      fetchBalances()
      
      setTimeout(() => {
        setShowTransferDialog(false)
        setTransferSuccess(false)
      }, 2000)
    } catch (err) {
      setTransferError('An error occurred during transfer')
    }
  }

  const isActivePeriod = selectedPeriod?.status === 'ACTIVE'

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Balances</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md"
          />
          {isActivePeriod && balances.length > 0 && (
            <button
              onClick={() => setShowTransferDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Transfer
            </button>
          )}
        </div>
      </div>
      
      {!isActivePeriod && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            You are viewing a closed period. Balance transfers are not allowed.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Total Opening Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              Ugx {formatCurrency(balances.reduce((sum, b) => sum + parseFloat(b.openingBalance), 0))}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Total Deposits</p>
            <p className="text-2xl font-bold text-green-600">
              Ugx {formatCurrency(balances.reduce((sum, b) => sum + parseFloat(b.totalDeposits), 0))}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Total Available</p>
            <p className={`text-2xl font-bold ${
              balances.reduce((sum, b) => sum + parseFloat(b.closingBalance), 0) < 0 
                ? 'text-red-600' 
                : 'text-green-600'
            }`}>
              Ugx {formatCurrency(balances.reduce((sum, b) => sum + parseFloat(b.closingBalance), 0))}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opening Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deposits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Withdrawals</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Closing Balance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {balances.map((balance) => (
                <tr key={balance.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {balance.expenseCategory.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Ugx {formatCurrency(balance.openingBalance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    Ugx {formatCurrency(balance.totalDeposits)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    Ugx {formatCurrency(balance.totalWithdrawals)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                    parseFloat(balance.closingBalance) < 0 
                      ? 'text-red-600' 
                      : parseFloat(balance.closingBalance) === 0 
                      ? 'text-gray-500' 
                      : 'text-green-600'
                  }`}>
                    Ugx {formatCurrency(balance.closingBalance)}
                    {parseFloat(balance.closingBalance) < 0 && (
                      <span className="ml-2 text-xs">(Overdrawn)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Dialog */}
      {showTransferDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Transfer Balance</h2>
            
            {transferError && (
              <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                {transferError}
              </div>
            )}
            
            {transferSuccess && (
              <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
                Transfer completed successfully!
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Category *
                </label>
                <select
                  value={transferForm.fromCategoryId}
                  onChange={(e) =>
                    updateTransferAmount('from', e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {balances
                    .filter((b) => parseFloat(b.closingBalance) > 0)
                    .map((balance) => (
                      <option key={balance.expenseCategory.id} value={balance.expenseCategory.id}>
                        {balance.expenseCategory.name} (Ugx {formatCurrency(transferForm.fromBalance>0? transferForm.fromBalance : balance.closingBalance)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Category *
                </label>
                <select
                  value={transferForm.toCategoryId}
                  onChange={(e) =>
                    updateTransferAmount('to', e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {balances.map((balance) => (
                    <option
                      key={balance.expenseCategory.id}
                      value={balance.expenseCategory.id}
                      disabled={balance.expenseCategory.id.toString() === transferForm.fromCategoryId}
                    >
                      {balance.expenseCategory.name} (Ugx {formatCurrency(transferForm.toBalance>0? transferForm.toBalance : balance.closingBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transferForm.amount}
                  onChange={(e) =>
                    updateTransferAmount('both', e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  required 
                  disabled={!transferForm.fromCategoryId || !transferForm.toCategoryId}
                />
                {transferForm.fromCategoryId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: Ugx{' '}
                    {formatCurrency(
                      parseFloat(
                        balances.find(
                          (b) => b.expenseCategory.id.toString() === transferForm.fromCategoryId
                        )?.closingBalance || '0'
                      )
                    )}
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferDialog(false)
                    setTransferForm({ fromCategoryId: '', toCategoryId: '', amount: '', fromBalance: 0, toBalance: 0 })
                    setTransferError(null)
                    setTransferSuccess(false)
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={transferSuccess}
                >
                  Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
