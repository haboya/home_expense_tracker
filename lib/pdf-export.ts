import jsPDF from 'jspdf'
import { formatCurrency } from './format'

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

export function exportPeriodToPDF(stats: PeriodStats) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = margin

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Budget Period Report', margin, yPos)
  yPos += 10

  // Period Info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(stats.period.name, margin, yPos)
  yPos += 6
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const startDate = new Date(stats.period.startDate).toLocaleDateString()
  const endDate = stats.period.endDate 
    ? new Date(stats.period.endDate).toLocaleDateString() 
    : 'Ongoing'
  doc.text(`${startDate} - ${endDate}`, margin, yPos)
  yPos += 5
  doc.text(`Status: ${stats.period.status}`, margin, yPos)
  yPos += 15

  // Summary Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Summary', margin, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const totalIncome = parseFloat(stats.summary.totalIncome)
  const totalExpenses = parseFloat(stats.summary.totalExpenses)
  const netBalance = parseFloat(stats.summary.netBalance)
  
  // Summary box
  const summaryData = [
    { label: 'Total Income:', value: `Ugx ${formatCurrency(totalIncome)}`, count: `(${stats.summary.incomeCount} transactions)` },
    { label: 'Total Expenses:', value: `Ugx ${formatCurrency(totalExpenses)}`, count: `(${stats.summary.expenseCount} transactions)` },
    { label: 'Net Balance:', value: `Ugx ${formatCurrency(netBalance)}`, count: netBalance >= 0 ? '(Surplus)' : '(Deficit)' },
  ]

  summaryData.forEach((item) => {
    doc.text(item.label, margin, yPos)
    doc.text(item.value, margin + 50, yPos)
    doc.setTextColor(100, 100, 100)
    doc.text(item.count, margin + 110, yPos)
    doc.setTextColor(0, 0, 0)
    yPos += 6
  })
  yPos += 10

  // Income by Category
  checkNewPage(80)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Income by Category', margin, yPos)
  yPos += 8

  if (stats.incomesByCategory.length > 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Category', margin, yPos)
    doc.text('Amount', margin + 80, yPos)
    doc.text('Count', margin + 130, yPos)
    doc.text('%', margin + 160, yPos)
    yPos += 5
    
    doc.setFont('helvetica', 'normal')
    const sortedIncome = [...stats.incomesByCategory].sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
    
    sortedIncome.forEach((item) => {
      checkNewPage(7)
      const percentage = totalIncome > 0 ? (parseFloat(item.total) / totalIncome) * 100 : 0
      doc.text(item.categoryName.substring(0, 30), margin, yPos)
      doc.text(`Ugx ${formatCurrency(parseFloat(item.total))}`, margin + 80, yPos)
      doc.text(item.count.toString(), margin + 130, yPos)
      doc.text(`${percentage.toFixed(1)}%`, margin + 160, yPos)
      yPos += 6
    })
  } else {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('No income data', margin, yPos)
    doc.setTextColor(0, 0, 0)
    yPos += 6
  }
  yPos += 10

  // Expenses by Category
  checkNewPage(80)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Expenses by Category', margin, yPos)
  yPos += 8

  if (stats.expensesByCategory.length > 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Category', margin, yPos)
    doc.text('Amount', margin + 80, yPos)
    doc.text('Count', margin + 130, yPos)
    doc.text('%', margin + 160, yPos)
    yPos += 5
    
    doc.setFont('helvetica', 'normal')
    const sortedExpenses = [...stats.expensesByCategory].sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
    
    sortedExpenses.forEach((item) => {
      checkNewPage(7)
      const percentage = totalExpenses > 0 ? (parseFloat(item.total) / totalExpenses) * 100 : 0
      doc.text(item.categoryName.substring(0, 30), margin, yPos)
      doc.text(`Ugx ${formatCurrency(parseFloat(item.total))}`, margin + 80, yPos)
      doc.text(item.count.toString(), margin + 130, yPos)
      doc.text(`${percentage.toFixed(1)}%`, margin + 160, yPos)
      yPos += 6
    })
  } else {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('No expense data', margin, yPos)
    doc.setTextColor(0, 0, 0)
    yPos += 6
  }
  yPos += 10

  // Monthly Trends
  const allMonths = Array.from(
    new Set([
      ...Object.keys(stats.monthlyTrends.income),
      ...Object.keys(stats.monthlyTrends.expenses),
    ])
  ).sort()

  if (allMonths.length > 0) {
    checkNewPage(80)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Monthly Trends', margin, yPos)
    yPos += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Month', margin, yPos)
    doc.text('Income', margin + 60, yPos)
    doc.text('Expenses', margin + 110, yPos)
    doc.text('Net', margin + 160, yPos)
    yPos += 5

    doc.setFont('helvetica', 'normal')
    allMonths.forEach((month) => {
      checkNewPage(7)
      const income = stats.monthlyTrends.income[month] || 0
      const expenses = stats.monthlyTrends.expenses[month] || 0
      const net = income - expenses
      
      const monthName = new Date(month + '-01').toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
      
      doc.text(monthName, margin, yPos)
      doc.text(`Ugx ${formatCurrency(income)}`, margin + 60, yPos)
      doc.text(`Ugx ${formatCurrency(expenses)}`, margin + 110, yPos)
      doc.setTextColor(net >= 0 ? 0 : 200, net >= 0 ? 150 : 0, 0)
      doc.text(`Ugx ${formatCurrency(net)}`, margin + 160, yPos)
      doc.setTextColor(0, 0, 0)
      yPos += 6
    })
    yPos += 10
  }

  // Current Balances
  if (stats.currentBalances.length > 0) {
    checkNewPage(80)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Current Balances by Category', margin, yPos)
    yPos += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Category', margin, yPos)
    doc.text('Latest Month', margin + 80, yPos)
    doc.text('Balance', margin + 140, yPos)
    yPos += 5

    doc.setFont('helvetica', 'normal')
    const sortedBalances = [...stats.currentBalances].sort(
      (a, b) => parseFloat(b.closingBalance) - parseFloat(a.closingBalance)
    )

    sortedBalances.forEach((balance) => {
      checkNewPage(7)
      const monthName = new Date(balance.monthYear + '-01').toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
      const balanceValue = parseFloat(balance.closingBalance)
      
      doc.text(balance.categoryName.substring(0, 30), margin, yPos)
      doc.text(monthName, margin + 80, yPos)
      doc.setTextColor(balanceValue >= 0 ? 0 : 200, balanceValue >= 0 ? 150 : 0, 0)
      doc.text(`Ugx ${formatCurrency(balanceValue)}`, margin + 140, yPos)
      doc.setTextColor(0, 0, 0)
      yPos += 6
    })
  }

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    )
  }

  // Save the PDF
  const fileName = `${stats.period.name.replace(/[^a-z0-9]/gi, '_')}_Report.pdf`
  doc.save(fileName)
}
