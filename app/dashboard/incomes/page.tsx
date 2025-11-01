'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/format'

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    details: '',
  })

  useEffect(() => {
    fetchIncomes()
    fetchCategories()
  }, [])

  const fetchIncomes = async () => {
    let url = '/api/incomes'
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
    setIncomes(await res.json())
  }

  const fetchCategories = async () => {
    const res = await fetch('/api/income-categories')
    setCategories(await res.json())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/incomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        amount: parseFloat(formData.amount),
      }),
    })
    setFormData({ amount: '', categoryId: '', details: '' })
    setShowForm(false)
    fetchIncomes()
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
      fetchIncomes()
    }
  }, [startDate, endDate])

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Incomes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Income
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
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      {incomes.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <p className="text-sm text-green-800">
              <span className="font-semibold">Showing {incomes.length} income{incomes.length !== 1 ? 's' : ''}</span>
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
            <p className="text-lg font-bold text-green-600">
              Total: Ugx {formatCurrency(incomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0))}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Income</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-md"
            />
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
              className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-md"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Details (optional)"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-md"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
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
              {incomes.map((income) => (
                <tr key={income.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(income.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    Ugx {formatCurrency(income.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {income.category.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {income.details || '-'}
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
