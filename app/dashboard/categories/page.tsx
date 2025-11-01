'use client'

import { useState, useEffect } from 'react'

export default function CategoriesPage() {
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])
  const [incomeCategories, setIncomeCategories] = useState<any[]>([])
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [editingIncome, setEditingIncome] = useState<any>(null)
  const [isExpenseCollapsed, setIsExpenseCollapsed] = useState(false)
  const [isIncomeCollapsed, setIsIncomeCollapsed] = useState(false)
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
      if (editingExpense) {
        // Update existing category
        await fetch(`/api/expense-categories/${editingExpense.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            percentageShare: parseFloat(formData.percentageShare),
            description: formData.description,
          }),
        })
        setEditingExpense(null)
      } else {
        // Create new category
        await fetch('/api/expense-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            percentageShare: parseFloat(formData.percentageShare),
            description: formData.description,
          }),
        })
      }
      setFormData({ name: '', percentageShare: '', description: '' })
      setShowExpenseForm(false)
      fetchCategories()
    } catch (error) {
      console.error('Error saving expense category:', error)
    }
  }

  const handleEditExpense = (category: any) => {
    setEditingExpense(category)
    setFormData({
      name: category.name,
      percentageShare: category.percentageShare,
      description: category.description || '',
    })
    setShowExpenseForm(true)
  }

  const handleCancelExpenseEdit = () => {
    setEditingExpense(null)
    setFormData({ name: '', percentageShare: '', description: '' })
    setShowExpenseForm(false)
  }

  const handleSubmitIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingIncome) {
        // Update existing category
        await fetch(`/api/income-categories/${editingIncome.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
          }),
        })
        setEditingIncome(null)
      } else {
        // Create new category
        await fetch('/api/income-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
          }),
        })
      }
      setFormData({ name: '', percentageShare: '', description: '' })
      setShowIncomeForm(false)
      fetchCategories()
    } catch (error) {
      console.error('Error saving income category:', error)
    }
  }

  const handleEditIncome = (category: any) => {
    setEditingIncome(category)
    setFormData({
      name: category.name,
      percentageShare: '',
      description: category.description || '',
    })
    setShowIncomeForm(true)
  }

  const handleCancelIncomeEdit = () => {
    setEditingIncome(null)
    setFormData({ name: '', percentageShare: '', description: '' })
    setShowIncomeForm(false)
  }

  const totalPercentage = expenseCategories.reduce(
    (sum, cat) => sum + parseFloat(cat.percentageShare),
    0
  )

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Manage Categories</h1>

      {/* Expense Categories */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpenseCollapsed(!isExpenseCollapsed)}
                className="text-gray-500 hover:text-gray-700 transition-transform duration-200"
                aria-label={isExpenseCollapsed ? 'Expand' : 'Collapse'}
              >
                <svg
                  className={`w-5 h-5 transform transition-transform ${isExpenseCollapsed ? '-rotate-90' : 'rotate-0'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Expense Categories</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1 ml-7">
              Total Percentage: <span className={totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}>
                {totalPercentage.toFixed(2)}%
              </span>
            </p>
          </div>
          <button
            onClick={() => {setShowExpenseForm(true); setIsExpenseCollapsed(false);}}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Category
          </button>
        </div>

        {!isExpenseCollapsed && (
          <>
            {showExpenseForm && (
              <form onSubmit={handleSubmitExpense} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingExpense ? 'Edit Category' : 'Add New Category'}
                </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Percentage Share"
                value={formData.percentageShare}
                onChange={(e) => setFormData({ ...formData, percentageShare: e.target.value })}
                required
                className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="sm:col-span-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  {editingExpense ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelExpenseEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditExpense(category)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </>
        )}
      </div>

      {/* Income Categories */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsIncomeCollapsed(!isIncomeCollapsed)}
                className="text-gray-500 hover:text-gray-700 transition-transform duration-200"
                aria-label={isIncomeCollapsed ? 'Expand' : 'Collapse'}
              >
                <svg
                  className={`w-5 h-5 transform transition-transform ${isIncomeCollapsed ? '-rotate-90' : 'rotate-0'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Income Categories</h2>
            </div>
          </div>
          <button
            onClick={() => {setShowIncomeForm(true); setIsIncomeCollapsed(false);}}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Category
          </button>
        </div>

        {!isIncomeCollapsed && (
          <>
            {showIncomeForm && (
              <form onSubmit={handleSubmitIncome} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingIncome ? 'Edit Category' : 'Add New Category'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  {editingIncome ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelIncomeEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleEditIncome(category)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </>
        )}
      </div>
    </div>
  )
}
