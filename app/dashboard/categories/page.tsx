'use client'

import { useState, useEffect } from 'react'

export default function CategoriesPage() {
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])
  const [incomeCategories, setIncomeCategories] = useState<any[]>([])
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    percentageShare: '',
    description: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const [expenseRes, incomeRes] = await Promise.all([
        fetch('/api/expense-categories'),
        fetch('/api/income-categories'),
      ])
      setExpenseCategories(await expenseRes.json())
      setIncomeCategories(await incomeRes.json())
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          percentageShare: parseFloat(formData.percentageShare),
          description: formData.description,
        }),
      })
      setFormData({ name: '', percentageShare: '', description: '' })
      setShowExpenseForm(false)
      fetchCategories()
    } catch (error) {
      console.error('Error creating expense category:', error)
    }
  }

  const handleSubmitIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/income-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      })
      setFormData({ name: '', percentageShare: '', description: '' })
      setShowIncomeForm(false)
      fetchCategories()
    } catch (error) {
      console.error('Error creating income category:', error)
    }
  }

  const totalPercentage = expenseCategories.reduce(
    (sum, cat) => sum + parseFloat(cat.percentageShare),
    0
  )

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Categories</h1>

      {/* Expense Categories */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Expense Categories</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total Percentage: <span className={totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}>
                {totalPercentage.toFixed(2)}%
              </span>
            </p>
          </div>
          <button
            onClick={() => setShowExpenseForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Category
          </button>
        </div>

        {showExpenseForm && (
          <form onSubmit={handleSubmitExpense} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Percentage Share"
                value={formData.percentageShare}
                onChange={(e) => setFormData({ ...formData, percentageShare: e.target.value })}
                required
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Share %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenseCategories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {parseFloat(category.percentageShare).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {category.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Income Categories */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Income Categories</h2>
          <button
            onClick={() => setShowIncomeForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Category
          </button>
        </div>

        {showIncomeForm && (
          <form onSubmit={handleSubmitIncome} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowIncomeForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incomeCategories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {category.description || '-'}
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
