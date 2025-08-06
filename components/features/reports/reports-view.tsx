"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, BarChart3 } from "lucide-react"

interface ReportsViewProps {
  reportType: string
  products: any[]
}

export function ReportsView({ reportType, products }: ReportsViewProps) {
  const generateReport = () => {
    // This would generate and download the specific report
    console.log(`Generating ${reportType} report`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {reportType === "sales-report" && "Sales Performance Report"}
            {reportType === "stock-movement" && "Stock Movement Analysis"}
            {reportType === "supplier-report" && "Supplier Performance Report"}
          </CardTitle>
          <CardDescription>
            {reportType === "sales-report" && "Analyze your sales trends and product performance"}
            {reportType === "stock-movement" && "Track inventory changes and movement patterns"}
            {reportType === "supplier-report" && "Review supplier performance and delivery metrics"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={generateReport}>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
          <CardDescription>Sample data visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Report visualization will appear here</p>
              <p className="text-sm text-gray-500 mt-2">Click "Generate Report" to create detailed analytics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
