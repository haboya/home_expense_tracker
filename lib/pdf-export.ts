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

interface FinancialLog {
  id: number
  transaction: 'DEPOSIT' | 'WITHDRAWL' | 'TRANSFER'
  refId: string
  amount: string
  balances: Record<string, number>
  timestamp: string
}

export function exportPeriodToPDF(stats: PeriodStats, logs: FinancialLog[], categoryMap: Record<string, string>) {
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
    yPos += 10
  }

  // Transaction Ledger - Add new page in landscape for better table layout
  if (logs && logs.length > 0) {
    // Add a new page in landscape orientation for the ledger
    doc.addPage('landscape')
    const landscapeWidth = doc.internal.pageSize.getWidth()
    const landscapeHeight = doc.internal.pageSize.getHeight()
    yPos = margin

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Transaction Ledger', margin, yPos)
    yPos += 10

    // Get category names for headers
    const categoryIds = Object.keys(categoryMap)
    const numCategories = categoryIds.length
    
    // Calculate column widths for landscape
    const dateColWidth = 25
    const typeColWidth = 18
    const amountColWidth = 30
    const fixedColsWidth = dateColWidth + typeColWidth + amountColWidth
    const availableForCategories = landscapeWidth - margin * 2 - fixedColsWidth - 5
    const categoryColWidth = numCategories > 0 ? Math.floor(availableForCategories / numCategories) : 25
    
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    
    // Header row
    let xPos = margin
    doc.text('Date', xPos, yPos)
    xPos += dateColWidth
    doc.text('Type', xPos, yPos)
    xPos += typeColWidth
    doc.text('Amount', xPos, yPos)
    xPos += amountColWidth
    
    // Category headers
    categoryIds.forEach((catId) => {
      const catName = categoryMap[catId] || `Cat ${catId}`
      // Truncate category name to fit column
      const maxChars = Math.floor(categoryColWidth / 2.5)
      doc.text(catName.substring(0, maxChars), xPos, yPos)
      xPos += categoryColWidth
    })
    yPos += 4

    // Draw a line under headers
    doc.setDrawColor(180, 180, 180)
    doc.line(margin, yPos - 1, landscapeWidth - margin, yPos - 1)
    yPos += 2

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    
    logs.forEach((log, index) => {
      // Check for new page in landscape
      if (yPos + 6 > landscapeHeight - margin) {
        doc.addPage('landscape')
        yPos = margin
        
        // Repeat headers on new page
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        xPos = margin
        doc.text('Date', xPos, yPos)
        xPos += dateColWidth
        doc.text('Type', xPos, yPos)
        xPos += typeColWidth
        doc.text('Amount', xPos, yPos)
        xPos += amountColWidth
        categoryIds.forEach((catId) => {
          const catName = categoryMap[catId] || `Cat ${catId}`
          const maxChars = Math.floor(categoryColWidth / 2.5)
          doc.text(catName.substring(0, maxChars), xPos, yPos)
          xPos += categoryColWidth
        })
        yPos += 4
        doc.setDrawColor(180, 180, 180)
        doc.line(margin, yPos - 1, landscapeWidth - margin, yPos - 1)
        yPos += 2
        doc.setFont('helvetica', 'normal')
      }
      
      const prevBalances = index > 0 ? logs[index - 1].balances : {}
      
      // Alternate row background
      if (index % 2 === 1) {
        doc.setFillColor(248, 248, 248)
        doc.rect(margin, yPos - 3, landscapeWidth - margin * 2, 5, 'F')
      }
      
      xPos = margin
      
      // Date
      const logDate = new Date(log.timestamp)
      const dateStr = logDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      doc.setTextColor(0, 0, 0)
      doc.text(dateStr, xPos, yPos)
      xPos += dateColWidth
      
      // Transaction type
      const typeLabel = log.transaction === 'DEPOSIT' ? 'DEP' : 
                        log.transaction === 'WITHDRAWL' ? 'WTH' : 'TRF'
      if (log.transaction === 'DEPOSIT') {
        doc.setTextColor(0, 128, 0)
      } else if (log.transaction === 'WITHDRAWL') {
        doc.setTextColor(200, 0, 0)
      } else {
        doc.setTextColor(0, 0, 200)
      }
      doc.text(typeLabel, xPos, yPos)
      xPos += typeColWidth
      
      // Amount
      const amount = parseFloat(log.amount)
      const amountPrefix = log.transaction === 'DEPOSIT' ? '+' : 
                           log.transaction === 'WITHDRAWL' ? '-' : ''
      doc.text(`${amountPrefix}${formatCurrency(amount)}`, xPos, yPos)
      doc.setTextColor(0, 0, 0)
      xPos += amountColWidth
      
      // Category balances
      categoryIds.forEach((catId) => {
        const currentBal = log.balances[catId] || 0
        const prevBal = prevBalances[catId] || 0
        const change = currentBal - prevBal
        
        // Format balance compactly
        const balText = formatCurrency(currentBal)
        
        // Color based on change
        if (index > 0 && change > 0) {
          doc.setTextColor(0, 128, 0)
        } else if (index > 0 && change < 0) {
          doc.setTextColor(200, 0, 0)
        } else {
          doc.setTextColor(80, 80, 80)
        }
        doc.text(balText, xPos, yPos)
        doc.setTextColor(0, 0, 0)
        xPos += categoryColWidth
      })
      
      yPos += 5
    })
    
    // Summary at end of ledger
    yPos += 8
    if (yPos + 15 > landscapeHeight - margin) {
      doc.addPage('landscape')
      yPos = margin
    }
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(`Total Transactions: ${logs.length}`, margin, yPos)
    yPos += 5
    
    const deposits = logs.filter(l => l.transaction === 'DEPOSIT').length
    const withdrawals = logs.filter(l => l.transaction === 'WITHDRAWL').length
    const transfers = logs.filter(l => l.transaction === 'TRANSFER').length
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 128, 0)
    doc.text(`Deposits: ${deposits}`, margin, yPos)
    doc.setTextColor(200, 0, 0)
    doc.text(`Withdrawals: ${withdrawals}`, margin + 40, yPos)
    doc.setTextColor(0, 0, 200)
    doc.text(`Transfers: ${transfers}`, margin + 90, yPos)
    doc.setTextColor(0, 0, 0)
  }

  // Footer - handle both portrait and landscape pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const currentPageWidth = doc.internal.pageSize.getWidth()
    const currentPageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${totalPages}`,
      currentPageWidth / 2,
      currentPageHeight - 10,
      { align: 'center' }
    )
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      currentPageWidth - margin,
      currentPageHeight - 10,
      { align: 'right' }
    )
  }

  // Save the PDF
  const fileName = `${stats.period.name.replace(/[^a-z0-9]/gi, '_')}_Report.pdf`
  doc.save(fileName)
}
