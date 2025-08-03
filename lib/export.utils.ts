import Papa from 'papaparse'
import jsPDF from 'jspdf'

export const exportToCSV = (data: any[], filename: string) => {
  try {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('Error exporting CSV:', error)
    throw new Error('Failed to export CSV')
  }
}

export const generateWeeklyReport = (products: any[], transactions: any[]) => {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const startY = 20
    
    // Title
    doc.setFontSize(20)
    doc.text('Weekly Inventory Report', pageWidth / 2, startY, { align: 'center' })
    
    // Date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 7)
    
    doc.setFontSize(12)
    doc.text(
      `Report Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      pageWidth / 2,
      startY + 15,
      { align: 'center' }
    )
    
    let currentY = startY + 35
    
    // Products Summary
    doc.setFontSize(16)
    doc.text('Products Summary', 20, currentY)
    currentY += 10
    
    doc.setFontSize(10)
    doc.text(`Total Products: ${products.length}`, 20, currentY)
    currentY += 5
    
    const inStock = products.filter(p => p.status === 'In Stock').length
    const lowStock = products.filter(p => p.status === 'Low Stock').length
    const outOfStock = products.filter(p => p.status === 'Out of Stock').length
    
    doc.text(`In Stock: ${inStock}`, 20, currentY)
    currentY += 5
    doc.text(`Low Stock: ${lowStock}`, 20, currentY)
    currentY += 5
    doc.text(`Out of Stock: ${outOfStock}`, 20, currentY)
    currentY += 15
    
    // Transactions Summary
    doc.setFontSize(16)
    doc.text('Transactions Summary', 20, currentY)
    currentY += 10
    
    doc.setFontSize(10)
    const weeklyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at)
      return transactionDate >= startDate && transactionDate <= endDate
    })
    
    doc.text(`Total Transactions: ${weeklyTransactions.length}`, 20, currentY)
    currentY += 5
    
    const stockIn = weeklyTransactions.filter(t => t.type === 'in').length
    const stockOut = weeklyTransactions.filter(t => t.type === 'out').length
    
    doc.text(`Stock In: ${stockIn}`, 20, currentY)
    currentY += 5
    doc.text(`Stock Out: ${stockOut}`, 20, currentY)
    currentY += 15
    
    // Top Products
    doc.setFontSize(16)
    doc.text('Top Products by Stock', 20, currentY)
    currentY += 10
    
    const topProducts = products
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
    
    doc.setFontSize(10)
    topProducts.forEach((product, index) => {
      doc.text(`${index + 1}. ${product.name}: ${product.quantity} units`, 20, currentY)
      currentY += 5
    })
    
    // Generate filename with current date
    const filename = `weekly-report-${endDate.toISOString().split('T')[0]}.pdf`
    
    // Save the PDF
    doc.save(filename)
    
    return filename
  } catch (error) {
    console.error('Error generating PDF report:', error)
    throw new Error('Failed to generate PDF report')
  }
}

export const formatProductsForCSV = (products: any[]) => {
  return products.map(product => ({
    ID: product.id,
    Name: product.name,
    SKU: product.sku || '',
    Category: product.category || '',
    Quantity: product.quantity,
    Price: product.price,
    Supplier: product.supplier || '',
    Status: product.status,
    'Last Updated': product.lastUpdated || product.updated_at
  }))
}

export const formatTransactionsForCSV = (transactions: any[]) => {
  return transactions.map(transaction => ({
    ID: transaction.id,
    'Product ID': transaction.product_id,
    'Product Name': transaction.product?.name || '',
    Type: transaction.type === 'in' ? 'Stock In' : 'Stock Out',
    Quantity: transaction.quantity,
    Reason: transaction.reason,
    Notes: transaction.notes || '',
    'Created By': transaction.created_by_profile?.email || '',
    'Created At': transaction.created_at
  }))
}
