'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Download, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Package,
  Calendar,
  Building,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface ImportExportProps {
  products: any[]
  onImport: (products: any[]) => void
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export function ImportExportManager({ products, onImport }: ImportExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    success: number
    errors: number
    total: number
    errorMessages: string[]
  } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Export as beautifully formatted PDF
  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      const doc = new jsPDF()
      
      // Add header
      doc.setFontSize(20)
      doc.setTextColor(59, 130, 246) // Blue color
      doc.text('Stokku Inventory Report', 20, 25)
      
      // Add metadata
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 20, 35)
      doc.text(`Total Products: ${products.length}`, 20, 42)
      
      // Calculate summary statistics
      const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0)
      const inStock = products.filter(p => p.status === 'In Stock').length
      const lowStock = products.filter(p => p.status === 'Low Stock').length
      const outOfStock = products.filter(p => p.status === 'Out of Stock').length
      
      doc.text(`Total Inventory Value: $${totalValue.toFixed(2)}`, 20, 49)
      doc.text(`In Stock: ${inStock} | Low Stock: ${lowStock} | Out of Stock: ${outOfStock}`, 20, 56)
      
      // Add summary boxes
      const summaryData = [
        ['Metric', 'Value', 'Status'],
        ['Total Products', products.length.toString(), 'Active'],
        ['Inventory Value', `$${totalValue.toFixed(2)}`, 'Calculated'],
        ['In Stock Items', inStock.toString(), 'Available'],
        ['Low Stock Items', lowStock.toString(), lowStock > 0 ? 'Attention Needed' : 'Good'],
        ['Out of Stock Items', outOfStock.toString(), outOfStock > 0 ? 'Restock Required' : 'Good']
      ]

      doc.autoTable({
        startY: 65,
        head: [summaryData[0]],
        body: summaryData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { fontStyle: 'bold' },
          2: { halign: 'center' }
        }
      })

      // Add detailed product table
      doc.setFontSize(14)
      doc.setTextColor(59, 130, 246)
      doc.text('Detailed Product Inventory', 20, doc.lastAutoTable.finalY + 20)
      
      const tableData = products.map(product => [
        product.name,
        product.sku,
        product.category,
        product.quantity.toString(),
        `$${product.price.toFixed(2)}`,
        product.supplier,
        product.status,
        product.lastUpdated
      ])

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 30,
        head: [['Product Name', 'SKU', 'Category', 'Qty', 'Price', 'Supplier', 'Status', 'Updated']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 25 },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 18, halign: 'right' },
          5: { cellWidth: 25 },
          6: { cellWidth: 20, halign: 'center' },
          7: { cellWidth: 22, halign: 'center' }
        },
        didParseCell: function(data: any) {
          // Color code status cells
          if (data.column.index === 6) {
            if (data.cell.raw === 'Out of Stock') {
              data.cell.styles.fillColor = [254, 226, 226] // Light red
              data.cell.styles.textColor = [185, 28, 28] // Red text
            } else if (data.cell.raw === 'Low Stock') {
              data.cell.styles.fillColor = [254, 240, 138] // Light yellow
              data.cell.styles.textColor = [146, 64, 14] // Orange text
            } else if (data.cell.raw === 'In Stock') {
              data.cell.styles.fillColor = [220, 252, 231] // Light green
              data.cell.styles.textColor = [21, 128, 61] // Green text
            }
          }
        }
      })

      // Add footer
      const pageHeight = doc.internal.pageSize.height
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('Generated by Stokku Inventory Management System', 20, pageHeight - 20)
      doc.text(`Page 1 of 1`, doc.internal.pageSize.width - 40, pageHeight - 20)

      // Save the PDF
      doc.save(`stokku-inventory-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
      toast.success('PDF report exported successfully!')
      
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export PDF report')
    } finally {
      setIsExporting(false)
    }
  }

  // Export as Excel with formatting
  const exportToExcel = async () => {
    setIsExporting(true)
    try {
      const wb = XLSX.utils.book_new()
      
      // Create summary sheet
      const summaryData = [
        ['Stokku Inventory Summary', '', ''],
        [`Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, '', ''],
        ['', '', ''],
        ['Metric', 'Value', 'Status'],
        ['Total Products', products.length, 'Active'],
        ['In Stock', products.filter(p => p.status === 'In Stock').length, 'Available'],
        ['Low Stock', products.filter(p => p.status === 'Low Stock').length, 'Needs Attention'],
        ['Out of Stock', products.filter(p => p.status === 'Out of Stock').length, 'Restock Required'],
        ['Total Value', `$${products.reduce((sum, p) => sum + (p.quantity * p.price), 0).toFixed(2)}`, 'Calculated']
      ]
      
      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary')
      
      // Create detailed products sheet
      const productData = [
        ['Product Name', 'SKU', 'Category', 'Quantity', 'Price', 'Total Value', 'Supplier', 'Status', 'Last Updated'],
        ...products.map(p => [
          p.name,
          p.sku,
          p.category,
          p.quantity,
          p.price,
          p.quantity * p.price,
          p.supplier,
          p.status,
          p.lastUpdated
        ])
      ]
      
      const productWS = XLSX.utils.aoa_to_sheet(productData)
      XLSX.utils.book_append_sheet(wb, productWS, 'Products')
      
      // Save the workbook
      XLSX.writeFile(wb, `stokku-inventory-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
      toast.success('Excel report exported successfully!')
      
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export Excel report')
    } finally {
      setIsExporting(false)
    }
  }

  // Import from CSV/Excel
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportProgress(0)
    setImportResults(null)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          let importedData: any[] = []
          
          if (file.name.endsWith('.csv')) {
            const text = e.target?.result as string
            const lines = text.split('\n')
            const headers = lines[0].split(',').map(h => h.trim())
            
            for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
                const product: any = {}
                headers.forEach((header, index) => {
                  product[header.toLowerCase().replace(' ', '_')] = values[index] || ''
                })
                importedData.push(product)
              }
              setImportProgress((i / lines.length) * 100)
            }
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const workbook = XLSX.read(e.target?.result, { type: 'binary' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            importedData = XLSX.utils.sheet_to_json(worksheet)
          }

          // Validate and process imported data
          const processedProducts = []
          const errors = []
          
          for (let i = 0; i < importedData.length; i++) {
            const item = importedData[i]
            try {
              const product = {
                id: `imported_${Date.now()}_${i}`,
                name: item.name || item.product_name || '',
                sku: item.sku || `SKU-${Date.now()}-${i}`,
                category: item.category || 'Imported',
                quantity: parseInt(item.quantity || '0'),
                price: parseFloat(item.price || '0'),
                supplier: item.supplier || 'Unknown',
                status: item.quantity > 10 ? 'In Stock' : item.quantity > 0 ? 'Low Stock' : 'Out of Stock',
                lastUpdated: format(new Date(), 'yyyy-MM-dd'),
                image: '/placeholder.svg'
              }
              
              if (!product.name) {
                errors.push(`Row ${i + 1}: Product name is required`)
                continue
              }
              
              processedProducts.push(product)
            } catch (error) {
              errors.push(`Row ${i + 1}: Invalid data format`)
            }
          }

          setImportResults({
            success: processedProducts.length,
            errors: errors.length,
            total: importedData.length,
            errorMessages: errors
          })

          if (processedProducts.length > 0) {
            onImport(processedProducts)
            toast.success(`Successfully imported ${processedProducts.length} products!`)
          }

        } catch (error) {
          toast.error('Failed to parse import file')
          console.error('Import parsing error:', error)
        } finally {
          setIsImporting(false)
        }
      }
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file)
      } else {
        reader.readAsBinaryString(file)
      }
      
    } catch (error) {
      toast.error('Failed to import file')
      console.error('Import error:', error)
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Import & Export</h1>
        <p className="text-sm text-gray-600">Manage your inventory data with professional import and export tools</p>
      </div>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <div className="text-2xl font-bold">{products.length}</div>
                  <div className="text-xs text-gray-500">Total Products</div>
                </div>
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <div className="text-2xl font-bold">
                    ${products.reduce((sum, p) => sum + (p.quantity * p.price), 0).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500">Total Value</div>
                </div>
                <div className="text-center">
                  <Building className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <div className="text-2xl font-bold">
                    {new Set(products.map(p => p.supplier)).size}
                  </div>
                  <div className="text-xs text-gray-500">Suppliers</div>
                </div>
                <div className="text-center">
                  <Calendar className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                  <div className="text-2xl font-bold">{format(new Date(), 'MMM dd')}</div>
                  <div className="text-xs text-gray-500">Export Date</div>
                </div>
              </div>

              {/* Export Options */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <FileText className="h-12 w-12 text-red-600 mb-4" />
                    <h3 className="font-semibold mb-2">PDF Report</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Generate a beautifully formatted PDF report with summary statistics and detailed product table.
                    </p>
                    <Button 
                      onClick={exportToPDF} 
                      disabled={isExporting}
                      className="w-full"
                    >
                      {isExporting ? 'Generating...' : 'Export PDF'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <FileText className="h-12 w-12 text-green-600 mb-4" />
                    <h3 className="font-semibold mb-2">Excel Workbook</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Export to Excel with multiple sheets including summary and detailed product data.
                    </p>
                    <Button 
                      onClick={exportToExcel} 
                      disabled={isExporting}
                      variant="outline"
                      className="w-full"
                    >
                      {isExporting ? 'Generating...' : 'Export Excel'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload your inventory file</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Support for CSV and Excel files. Make sure your file includes columns for name, sku, category, quantity, price, and supplier.
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                />
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  size="lg"
                >
                  {isImporting ? 'Importing...' : 'Choose File'}
                </Button>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              {importResults && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Import Results</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                        <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                        <div className="text-xs text-gray-500">Imported</div>
                      </div>
                      <div className="text-center">
                        <AlertCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                        <div className="text-2xl font-bold text-red-600">{importResults.errors}</div>
                        <div className="text-xs text-gray-500">Errors</div>
                      </div>
                      <div className="text-center">
                        <FileText className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                        <div className="text-2xl font-bold">{importResults.total}</div>
                        <div className="text-xs text-gray-500">Total Rows</div>
                      </div>
                    </div>
                    
                    {importResults.errorMessages.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Error Details:</h4>
                        <div className="space-y-1">
                          {importResults.errorMessages.slice(0, 5).map((error, index) => (
                            <p key={index} className="text-sm text-red-600">• {error}</p>
                          ))}
                          {importResults.errorMessages.length > 5 && (
                            <p className="text-sm text-gray-500">
                              ... and {importResults.errorMessages.length - 5} more errors
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Sample Format */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Required File Format</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>name</TableHead>
                        <TableHead>sku</TableHead>
                        <TableHead>category</TableHead>
                        <TableHead>quantity</TableHead>
                        <TableHead>price</TableHead>
                        <TableHead>supplier</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Wireless Headphones</TableCell>
                        <TableCell>WH-001</TableCell>
                        <TableCell>Electronics</TableCell>
                        <TableCell>25</TableCell>
                        <TableCell>79.99</TableCell>
                        <TableCell>TechCorp</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Coffee Beans</TableCell>
                        <TableCell>CB-002</TableCell>
                        <TableCell>Food & Beverage</TableCell>
                        <TableCell>50</TableCell>
                        <TableCell>24.99</TableCell>
                        <TableCell>Bean Masters</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
