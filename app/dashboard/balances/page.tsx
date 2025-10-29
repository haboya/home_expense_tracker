'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/format'

export default function BalancesPage() {
  const [balances, setBalances] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState('')

  useEffect(() => {
    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(monthYear)
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      fetchBalances()
    }
  }, [selectedMonth])

  const fetchBalances = async () => {
    const res = await fetch(`/api/monthly-balances?monthYear=${selectedMonth}`)
    setBalances(await res.json())
  }

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Balances</h1>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md"
        />
      </div>

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
    </div>
  )
}
