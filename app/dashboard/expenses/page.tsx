'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/format'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [availableBalance, setAvailableBalance] = useState<string | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    details: '',
  })

  useEffect(() => {
    fetchExpenses()
    fetchCategories()
  }, [])

  const fetchExpenses = async () => {
    let url = '/api/expenses'
    const params = new URLSearchParams()
    
    if (startDate) {
      params.append('startDate', new Date(startDate).toISOString())
    }
    if (endDate) {
      params.append('endDate', new Date(endDate).toISOString())
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }
    
    const res = await fetch(url)
    setExpenses(await res.json())
  }

  const fetchCategories = async () => {
    const res = await fetch('/api/expense-categories')
    setCategories(await res.json())
  }

  const fetchAvailableBalance = async (categoryId: string) => {
    if (!categoryId) {
      setAvailableBalance(null)
      return
    }

    setLoadingBalance(true)
    try {
      const res = await fetch(`/api/available-balance?categoryId=${categoryId}`)
      const data = await res.json()
      if (res.ok) {
        setAvailableBalance(data.availableBalance)
      } else {
        setAvailableBalance(null)
      }
    } catch (err) {
      console.error('Error fetching balance:', err)
      setAvailableBalance(null)
    } finally {
      setLoadingBalance(false)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    setFormData({ ...formData, categoryId })
    fetchAvailableBalance(categoryId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date().toISOString(),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to create expense')
      return
    }

    setFormData({ amount: '', categoryId: '', details: '' })
    setAvailableBalance(null)
    setShowForm(false)
    fetchExpenses()
  }

  const handleStartDateChange = (date: string) => {
    setStartDate(date)
  }

  const handleEndDateChange = (date: string) => {
    setEndDate(date)
  }

  const handleClearFilter = () => {
    setStartDate('')
    setEndDate('')
  }

  // Auto-apply filter when dates change
  useEffect(() => {
    if (categories.length > 0) {
      fetchExpenses()
    }
  }, [startDate, endDate])

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Add Expense
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Date Range</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          {(startDate || endDate) && (
            <div className="flex items-end">
              <button
                onClick={handleClearFilter}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {expenses.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Showing {expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
              {(startDate || endDate) && (
                <span className="ml-2">
                  {startDate && endDate ? (
                    <>from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</>
                  ) : startDate ? (
                    <>from {new Date(startDate).toLocaleDateString()}</>
                  ) : (
                    <>until {new Date(endDate).toLocaleDateString()}</>
                  )}
                </span>
              )}
            </p>
            <p className="text-lg font-bold text-red-600">
              Total: Ugx {formatCurrency(expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0))}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            <div>
              <select
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
                className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              
              {formData.categoryId && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  {loadingBalance ? (
                    <p className="text-sm text-blue-700">Loading balance...</p>
                  ) : availableBalance !== null ? (
                    <div>
                      <p className="text-sm text-blue-700">
                        <span className="font-semibold">Available Balance:</span> Ugx {formatCurrency(availableBalance)}
                      </p>
                      {formData.amount && parseFloat(formData.amount) > parseFloat(availableBalance) && (
                        <p className="text-sm text-red-600 mt-1">
                          ⚠️ Insufficient funds! You need Ugx {formatCurrency(parseFloat(formData.amount) - parseFloat(availableBalance))} more.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No balance information available</p>
                  )}
                </div>
              )}
            </div>
            
            <input
              type="text"
              placeholder="Details (optional)"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex gap-2">
              <button 
                type="submit" 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!!(formData.amount && availableBalance !== null && parseFloat(formData.amount) > parseFloat(availableBalance))}
              >
                Save
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false)
                  setError(null)
                  setAvailableBalance(null)
                }} 
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(expense.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                  Ugx {formatCurrency(expense.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {expense.category.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {expense.details || '-'}
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
