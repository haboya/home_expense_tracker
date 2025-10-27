'use client'

import { useState, useEffect } from 'react'

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Monthly Balances</h1>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
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
                  ${parseFloat(balance.openingBalance).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                  ${parseFloat(balance.totalDeposits).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                  ${parseFloat(balance.totalWithdrawals).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  ${parseFloat(balance.closingBalance).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
