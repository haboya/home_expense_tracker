'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/format'

interface PeriodStats {
  period: {
    id: string
    name: string
    startDate: string
    endDate: string | null
    status: string
    isActive: boolean
  }
  summary: {
    totalIncome: string
    totalExpenses: string
    netBalance: string
    incomeCount: number
    expenseCount: number
  }
  incomesByCategory: Array<{
    categoryId: number
    categoryName: string
    total: string
    count: number
  }>
  expensesByCategory: Array<{
    categoryId: number
    categoryName: string
    total: string
    count: number
  }>
  monthlyTrends: {
    income: Record<string, number>
    expenses: Record<string, number>
  }
  currentBalances: Array<{
    categoryId: number
    categoryName: string
    closingBalance: string
    monthYear: string
  }>
}

export default function PeriodDetailPage() {
  const params = useParams()
  const router = useRouter()
  const periodId = params.id as string

  const [stats, setStats] = useState<PeriodStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPeriodStats()
  }, [periodId])

  const fetchPeriodStats = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/periods/${periodId}/stats`)
      if (!res.ok) {
        throw new Error('Failed to fetch period statistics')
      }
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Failed to load period data'}</p>
        </div>
      </div>
    )
  }

  const totalIncome = parseFloat(stats.summary.totalIncome)
  const totalExpenses = parseFloat(stats.summary.totalExpenses)
  const netBalance = parseFloat(stats.summary.netBalance)
  const totalBalances = stats.currentBalances.reduce(
    (sum, b) => sum + parseFloat(b.closingBalance),
    0
  )

  // Prepare monthly trend data
  const allMonths = Array.from(
    new Set([
      ...Object.keys(stats.monthlyTrends.income),
      ...Object.keys(stats.monthlyTrends.expenses),
    ])
  ).sort()

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
        >
          ← Back
        </button>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stats.period.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(stats.period.startDate).toLocaleDateString()} -{' '}
              {stats.period.endDate
                ? new Date(stats.period.endDate).toLocaleDateString()
                : 'Ongoing'}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              stats.period.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {stats.period.status}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-600">
            Ugx {formatCurrency(totalIncome)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.summary.incomeCount} transaction{stats.summary.incomeCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">
            Ugx {formatCurrency(totalExpenses)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.summary.expenseCount} transaction{stats.summary.expenseCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-1">Net Balance</p>
          <p
            className={`text-2xl font-bold ${
              netBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            Ugx {formatCurrency(netBalance)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {netBalance >= 0 ? 'Surplus' : 'Deficit'}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-1">Available Balance</p>
          <p
            className={`text-2xl font-bold ${
              totalBalances >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}
          >
            Ugx {formatCurrency(totalBalances)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Current total</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income by Category */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Income by Category</h2>
          {stats.incomesByCategory.length > 0 ? (
            <div className="space-y-4">
              {stats.incomesByCategory
                .sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
                .map((item) => {
                  const percentage = totalIncome > 0 ? (parseFloat(item.total) / totalIncome) * 100 : 0
                  return (
                    <div key={item.categoryId}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {item.categoryName}
                        </span>
                        <span className="text-sm text-gray-600">
                          Ugx {formatCurrency(parseFloat(item.total))}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.count} transaction{item.count !== 1 ? 's' : ''} • {percentage.toFixed(1)}%
                      </p>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No income data</p>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
          {stats.expensesByCategory.length > 0 ? (
            <div className="space-y-4">
              {stats.expensesByCategory
                .sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
                .map((item) => {
                  const percentage = totalExpenses > 0 ? (parseFloat(item.total) / totalExpenses) * 100 : 0
                  return (
                    <div key={item.categoryId}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {item.categoryName}
                        </span>
                        <span className="text-sm text-gray-600">
                          Ugx {formatCurrency(parseFloat(item.total))}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.count} transaction{item.count !== 1 ? 's' : ''} • {percentage.toFixed(1)}%
                      </p>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No expense data</p>
          )}
        </div>
      </div>

      {/* Monthly Trends */}
      {allMonths.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h2>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="flex items-end justify-between gap-2 h-64 px-4">
                {allMonths.map((month) => {
                  const income = stats.monthlyTrends.income[month] || 0
                  const expenses = stats.monthlyTrends.expenses[month] || 0
                  const maxValue = Math.max(
                    ...allMonths.map((m) =>
                      Math.max(
                        stats.monthlyTrends.income[m] || 0,
                        stats.monthlyTrends.expenses[m] || 0
                      )
                    )
                  )
                  const incomeHeight = maxValue > 0 ? (income / maxValue) * 100 : 0
                  const expenseHeight = maxValue > 0 ? (expenses / maxValue) * 100 : 0

                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex justify-center items-end gap-1 h-full">
                        <div className="flex-1 flex flex-col items-center justify-end">
                          <div
                            className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                            style={{ height: `${incomeHeight}%`, minHeight: income > 0 ? '4px' : '0' }}
                            title={`Income: Ugx ${formatCurrency(income)}`}
                          ></div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-end">
                          <div
                            className="w-full bg-red-500 rounded-t transition-all duration-300 hover:bg-red-600"
                            style={{ height: `${expenseHeight}%`, minHeight: expenses > 0 ? '4px' : '0' }}
                            title={`Expenses: Ugx ${formatCurrency(expenses)}`}
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 text-center whitespace-nowrap">
                        {new Date(month + '-01').toLocaleDateString('en-US', {
                          month: 'short',
                          year: '2-digit',
                        })}
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-600">Expenses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Balances by Category */}
      {stats.currentBalances.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Current Balances by Category</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Latest Month
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.currentBalances
                  .sort((a, b) => parseFloat(b.closingBalance) - parseFloat(a.closingBalance))
                  .map((balance) => (
                    <tr key={balance.categoryId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {balance.categoryName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(balance.monthYear + '-01').toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                          parseFloat(balance.closingBalance) >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        Ugx {formatCurrency(parseFloat(balance.closingBalance))}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
