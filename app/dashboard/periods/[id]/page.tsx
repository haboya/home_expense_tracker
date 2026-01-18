'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/format'
import { exportPeriodToPDF } from '@/lib/pdf-export'

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

interface FinancialLog {
  id: number
  transaction: 'DEPOSIT' | 'WITHDRAWL' | 'TRANSFER'
  refId: string
  amount: string
  balances: Record<string, number>
  timestamp: string
}

interface LogsResponse {
  logs: FinancialLog[]
  categoryMap: Record<string, string>
}

export default function PeriodDetailPage() {
  const params = useParams()
  const router = useRouter()
  const periodId = params.id as string

  const [stats, setStats] = useState<PeriodStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [showLedger, setShowLedger] = useState(false)
  const [showCharts, setShowCharts] = useState(true)
  const [showTrends, setShowTrends] = useState(true)
  const [showBalances, setShowBalances] = useState(true)
  const [logs, setLogs] = useState<FinancialLog[]>([])
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({})
  const [logsLoading, setLogsLoading] = useState(false)

  useEffect(() => {
    fetchPeriodStats()
  }, [periodId])

  useEffect(() => {
    if (showLedger && logs.length === 0) {
      fetchLogs()
    }
  }, [showLedger])

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

  const fetchLogs = async () => {
    try {
      setLogsLoading(true)
      const res = await fetch(`/api/periods/${periodId}/logs`)
      if (!res.ok) {
        throw new Error('Failed to fetch transaction logs')
      }
      const data: LogsResponse = await res.json()
      setLogs(data.logs)
      setCategoryMap(data.categoryMap)
      return data
    } catch (err) {
      console.error('Error fetching logs:', err)
    } finally {
      setLogsLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!stats) return
    
    setExporting(true)
    try {
      if (logs.length === 0) {
        const exportedData = await fetchLogs()
        exportPeriodToPDF(stats, exportedData?.logs || [], exportedData?.categoryMap || {})
      } else {
        exportPeriodToPDF(stats, logs, categoryMap)
      }
    } catch (err) {
      console.error('Error exporting PDF:', err)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setExporting(false)
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
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
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
      <div className="mb-6">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="w-full flex items-center justify-between px-6 py-4 bg-white shadow rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
            <span className="text-lg font-semibold text-gray-900">
              Category Breakdown
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-600 transform transition-transform ${
              showCharts ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
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
        )}
      </div>

      {/* Monthly Trends */}
      {allMonths.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowTrends(!showTrends)}
            className="w-full flex items-center justify-between px-6 py-4 bg-white shadow rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
              <span className="text-lg font-semibold text-gray-900">
                Monthly Trends
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-600 transform transition-transform ${
                showTrends ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showTrends && (
            <div className="bg-white shadow rounded-lg p-6 mt-4">
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
        </div>
      )}

      {/* Current Balances by Category */}
      {stats.currentBalances.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="w-full flex items-center justify-between px-6 py-4 bg-white shadow rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span className="text-lg font-semibold text-gray-900">
                Current Balances by Category
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-600 transform transition-transform ${
                showBalances ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showBalances && (
            <div className="bg-white shadow rounded-lg overflow-hidden mt-4">
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
      )}

      {/* Transaction Ledger Toggle */}
      <div className="mt-6">
        <button
          onClick={() => setShowLedger(!showLedger)}
          className="w-full flex items-center justify-between px-6 py-4 bg-white shadow rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-lg font-semibold text-gray-900">
              Transaction Ledger
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-600 transform transition-transform ${
              showLedger ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showLedger && (
          <div className="mt-4 bg-white shadow rounded-lg overflow-hidden">
            {logsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading transaction logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No transaction logs found for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Amount
                      </th>
                      {Object.keys(categoryMap).map((catId) => (
                        <th
                          key={catId}
                          className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider"
                        >
                          {categoryMap[catId]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log, index) => {
                      // Calculate the change for each category compared to previous log
                      const prevBalances = index > 0 ? logs[index - 1].balances : {}
                      
                      return (
                        <tr key={log.id} className={`${(index%2 === 0) ? 'bg-white' : 'bg-gray-200'} hover:bg-gray-300`}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(log.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                            <span className="text-gray-500 ml-1">
                              {new Date(log.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.transaction === 'DEPOSIT'
                                  ? 'bg-green-100 text-green-800'
                                  : log.transaction === 'WITHDRAWL'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {log.transaction === 'DEPOSIT' && '↑ '}
                              {log.transaction === 'WITHDRAWL' && '↓ '}
                              {log.transaction === 'TRANSFER' && '↔ '}
                              {log.transaction}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                            <span
                              className={
                                log.transaction === 'DEPOSIT'
                                  ? 'text-green-600'
                                  : log.transaction === 'WITHDRAWL'
                                  ? 'text-red-600'
                                  : 'text-blue-600'
                              }
                            >
                              {log.transaction === 'DEPOSIT' ? '+' : log.transaction === 'WITHDRAWL' ? '-' : ''}
                              Ugx {formatCurrency(parseFloat(log.amount))}
                            </span>
                          </td>
                          {Object.keys(categoryMap).map((catId) => {
                            const currentBal = log.balances[catId] || 0
                            const prevBal = prevBalances[catId] || 0
                            const change = currentBal - prevBal
                            
                            return (
                              <td
                                key={catId}
                                className="px-4 py-3 whitespace-nowrap text-sm text-right"
                              >
                                <div className="flex flex-col items-end">
                                  <span className="font-medium text-gray-900">
                                    Ugx {formatCurrency(currentBal)}
                                  </span>
                                  {index > 0 && change !== 0 && (
                                    <span
                                      className={`text-xs ${
                                        change > 0 ? 'text-green-600' : 'text-red-600'
                                      }`}
                                    >
                                      {change > 0 ? '+' : ''}
                                      {formatCurrency(change)}
                                    </span>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
