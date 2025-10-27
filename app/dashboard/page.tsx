'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Stats {
  totalIncome: number
  totalExpense: number
  balance: number
  categoryCount: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    categoryCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const currentMonth = new Date()
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

      const [incomesRes, expensesRes, categoriesRes] = await Promise.all([
        fetch(`/api/incomes?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch(`/api/expenses?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch('/api/expense-categories'),
      ])

      const incomes = await incomesRes.json()
      const expenses = await expensesRes.json()
      const categories = await categoriesRes.json()

      const totalIncome = incomes.reduce((sum: number, income: any) => sum + parseFloat(income.amount), 0)
      const totalExpense = expenses.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0)

      setStats({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        categoryCount: categories.length,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-10">Loading...</div>
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Income (This Month)
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">
                  ${stats.totalIncome.toFixed(2)}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Expenses (This Month)
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-red-600">
                  ${stats.totalExpense.toFixed(2)}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Balance
                </dt>
                <dd className={`mt-1 text-3xl font-semibold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${stats.balance.toFixed(2)}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Expense Categories
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-blue-600">
                  {stats.categoryCount}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/incomes"
              className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Income
            </Link>
            <Link
              href="/dashboard/expenses"
              className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Add Expense
            </Link>
            <Link
              href="/dashboard/categories"
              className="block w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Manage Categories
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="prose prose-sm text-gray-600">
            <ol className="list-decimal list-inside space-y-2">
              <li>Create income and expense categories</li>
              <li>Set percentage shares for expense categories (must total 100%)</li>
              <li>Add income entries - they will be distributed automatically</li>
              <li>Track your expenses by category</li>
              <li>View monthly balances for each category</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
