'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  Target,
  TrendingUp, 
  DollarSign, 
  Calendar,
  Clock,
  User,
  Award,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Package,
  BarChart3
} from 'lucide-react'
import { Product } from '@/types/product.types'
import { format } from 'date-fns'

interface SalesReportPageProps {
  products: Product[]
}

// Enhanced sample data with more realistic insights
const currentMonth = {
  target: 10000000, // Rp 10M
  achieved: 8700000, // Rp 8.7M
  percentage: 87
}

const dailySalesData = [
  { day: 'Mon', sales: 420000, target: 450000 },
  { day: 'Tue', sales: 380000, target: 450000 },
  { day: 'Wed', sales: 520000, target: 450000 },
  { day: 'Thu', sales: 460000, target: 450000 },
  { day: 'Fri', sales: 680000, target: 450000 },
  { day: 'Sat', sales: 720000, target: 450000 },
  { day: 'Sun', sales: 340000, target: 450000 }
]

const hourlyData = [
  { hour: '08:00', sales: 25000, orders: 3 },
  { hour: '09:00', sales: 45000, orders: 5 },
  { hour: '10:00', sales: 125000, orders: 12 },
  { hour: '11:00', sales: 180000, orders: 18 },
  { hour: '12:00', sales: 200000, orders: 22 },
  { hour: '13:00', sales: 165000, orders: 16 },
  { hour: '14:00', sales: 140000, orders: 14 },
  { hour: '15:00', sales: 95000, orders: 9 },
  { hour: '16:00', sales: 75000, orders: 7 },
  { hour: '17:00', sales: 60000, orders: 6 },
  { hour: '18:00', sales: 40000, orders: 4 },
  { hour: '19:00', sales: 30000, orders: 3 }
]

const topContributors = [
  { 
    name: 'Sarah Manager', 
    role: 'Store Manager',
    sales: 2450000,
    orders: 156,
    performance: 122,
    avatar: 'SM'
  },
  { 
    name: 'Ahmad Staff', 
    role: 'Sales Associate',
    sales: 1980000,
    orders: 134,
    performance: 118,
    avatar: 'AS'
  },
  { 
    name: 'Linda Admin', 
    role: 'Admin',
    sales: 1650000,
    orders: 98,
    performance: 110,
    avatar: 'LA'
  },
  { 
    name: 'Budi Sales', 
    role: 'Sales Associate',
    sales: 1420000,
    orders: 89,
    performance: 95,
    avatar: 'BS'
  }
]

const monthlyTrend = [
  { month: 'Jan', sales: 7200000, target: 8000000 },
  { month: 'Feb', sales: 8100000, target: 8500000 },
  { month: 'Mar', sales: 9200000, target: 9000000 },
  { month: 'Apr', sales: 8500000, target: 9500000 },
  { month: 'May', sales: 10100000, target: 10000000 },
  { month: 'Jun', sales: 9800000, target: 10200000 },
  { month: 'Jul', sales: 11200000, target: 10500000 },
  { month: 'Aug', sales: 8700000, target: 10000000 }
]

// Sample data for old charts (keeping for compatibility)
const sampleSalesData = [
  { month: 'Jan', revenue: 7200000, orders: 87, profit: 3200000 },
  { month: 'Feb', revenue: 8100000, orders: 98, profit: 4100000 },
  { month: 'Mar', revenue: 9200000, orders: 112, profit: 5200000 },
  { month: 'Apr', revenue: 8500000, orders: 94, profit: 4800000 },
  { month: 'May', revenue: 10100000, orders: 123, profit: 6100000 },
  { month: 'Jun', revenue: 9800000, orders: 108, profit: 5500000 },
  { month: 'Jul', revenue: 11200000, orders: 134, profit: 6800000 },
  { month: 'Aug', revenue: 8700000, orders: 142, profit: 7300000 }
]

const topSellingProducts = [
  { name: 'Wireless Headphones', category: 'Electronics', sold: 234, revenue: 18726 },
  { name: 'Coffee Beans Premium', category: 'Food & Beverage', sold: 189, revenue: 4721 },
  { name: 'Yoga Mat Premium', category: 'Sports & Fitness', sold: 167, revenue: 8348 },
  { name: 'Bluetooth Speaker', category: 'Electronics', sold: 142, revenue: 12768 },
  { name: 'Desk Lamp LED', category: 'Office Supplies', sold: 128, revenue: 4479 }
]

const categoryData = [
  { name: 'Electronics', value: 45, revenue: 31494, color: '#3B82F6' },
  { name: 'Food & Beverage', value: 25, revenue: 17350, color: '#10B981' },
  { name: 'Sports & Fitness', value: 20, revenue: 14200, color: '#F59E0B' },
  { name: 'Office Supplies', value: 10, revenue: 7100, color: '#EF4444' }
]

export function SalesReportPage({ products }: SalesReportPageProps) {
  const [timeframe, setTimeframe] = useState('thisMonth')
  
  const avgDailySales = dailySalesData.reduce((sum, day) => sum + day.sales, 0) / dailySalesData.length
  const peakHour = hourlyData.reduce((prev, current) => 
    prev.sales > current.sales ? prev : current
  )
  const topContributor = topContributors[0]
  
  // Calculate insights
  const targetProgress = (currentMonth.achieved / currentMonth.target) * 100
  const remainingDays = 8 // Example: 8 days left in month
  const dailyTargetNeeded = (currentMonth.target - currentMonth.achieved) / remainingDays
  
  const formatCurrency = (amount: number) => {
    return `Rp ${(amount / 1000000).toFixed(1)}M`
  }
  
  const formatCurrencyDetailed = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  const exportToPDF = async () => {
    try {
      // Dynamic import with proper typing
      const jsPDF = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default
      
      // Create document with autoTable support
      const doc = new jsPDF() as any
      
      // Header
      doc.setFontSize(24)
      doc.setTextColor(59, 130, 246)
      doc.text('Sales Analytics Report', 20, 25)
      
      // Subtitle
      doc.setFontSize(12)
      doc.setTextColor(100)
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 20, 35)
      doc.text(`Report Period: ${timeframe}`, 20, 42)
      
      let yPos = 55
      
      // Key Metrics Section
      doc.setFontSize(16)
      doc.setTextColor(59, 130, 246)
      doc.text('Key Performance Metrics', 20, yPos)
      yPos += 12
      
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      
      // Sales vs Target
      doc.text(`Sales vs Target (August 2024):`, 20, yPos)
      yPos += 7
      doc.text(`• Target: ${formatCurrency(currentMonth.target)}`, 30, yPos)
      yPos += 5
      doc.text(`• Achieved: ${formatCurrency(currentMonth.achieved)} (${targetProgress.toFixed(1)}%)`, 30, yPos)
      yPos += 5
      doc.text(`• Remaining: ${formatCurrency(currentMonth.target - currentMonth.achieved)}`, 30, yPos)
      yPos += 5
      doc.text(`• Daily target needed: ${formatCurrency(dailyTargetNeeded)} for ${remainingDays} days`, 30, yPos)
      yPos += 12
      
      // Daily Average
      doc.text(`Average Daily Sales: ${formatCurrency(avgDailySales)} (+12.5% vs last week)`, 20, yPos)
      yPos += 7
      doc.text(`Best performing day: Saturday (${formatCurrency(720000)})`, 30, yPos)
      yPos += 12
      
      // Peak Hours
      doc.text(`Peak Sales Hours: 10:00-13:00`, 20, yPos)
      yPos += 7
      doc.text(`• Average during peak: ${formatCurrency(545000)}`, 30, yPos)
      yPos += 5
      doc.text(`• Peak hour: 12:00 (${formatCurrency(200000)}, 22 orders)`, 30, yPos)
      yPos += 12
      
      // Top Contributor
      doc.text(`Top Contributor: ${topContributor.name} (${topContributor.role})`, 20, yPos)
      yPos += 7
      doc.text(`• Sales: ${formatCurrency(topContributor.sales)}`, 30, yPos)
      yPos += 5
      doc.text(`• Orders: ${topContributor.orders} orders`, 30, yPos)
      yPos += 5
      doc.text(`• Performance: ${topContributor.performance}% of target`, 30, yPos)
      yPos += 15
      
      // Team Performance Section with manual table
      doc.setFontSize(16)
      doc.setTextColor(59, 130, 246)
      doc.text('Team Performance Ranking', 20, yPos)
      yPos += 15
      
      // Manual table headers
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.setFillColor(59, 130, 246)
      doc.rect(20, yPos - 5, 170, 8, 'F')
      doc.text('Rank', 25, yPos)
      doc.text('Name', 50, yPos)
      doc.text('Role', 85, yPos)
      doc.text('Sales', 120, yPos)
      doc.text('Orders', 145, yPos)
      doc.text('Performance', 165, yPos)
      yPos += 12
      
      // Manual table rows
      doc.setTextColor(0, 0, 0)
      topContributors.forEach((contributor, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(20, yPos - 5, 170, 8, 'F')
        }
        doc.text(`#${index + 1}`, 25, yPos)
        doc.text(contributor.name, 50, yPos)
        doc.text(contributor.role, 85, yPos)
        doc.text(formatCurrency(contributor.sales), 120, yPos)
        doc.text(`${contributor.orders}`, 145, yPos)
        doc.text(`${contributor.performance}%`, 165, yPos)
        yPos += 8
      })
      
      yPos += 10
      
      // Category Breakdown
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFontSize(16)
      doc.setTextColor(59, 130, 246)
      doc.text('Sales by Category', 20, yPos)
      yPos += 12
      
      categoryData.forEach(category => {
        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        doc.text(`• ${category.name}: ${category.value}% (${formatCurrency(category.revenue * 1000)})`, 30, yPos)
        yPos += 6
      })
      
      yPos += 10
      
      // Top Products with manual table
      doc.setFontSize(16)
      doc.setTextColor(59, 130, 246)
      doc.text('Top Selling Products', 20, yPos)
      yPos += 15
      
      // Manual table headers for products
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.setFillColor(59, 130, 246)
      doc.rect(20, yPos - 5, 170, 8, 'F')
      doc.text('Rank', 25, yPos)
      doc.text('Product Name', 40, yPos)
      doc.text('Category', 85, yPos)
      doc.text('Units', 120, yPos)
      doc.text('Revenue', 140, yPos)
      doc.text('Avg Price', 165, yPos)
      yPos += 12
      
      // Manual table rows for products
      doc.setTextColor(0, 0, 0)
      topSellingProducts.forEach((product, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(20, yPos - 5, 170, 8, 'F')
        }
        doc.text(`#${index + 1}`, 25, yPos)
        const productName = product.name.length > 20 ? product.name.substring(0, 17) + '...' : product.name
        doc.text(productName, 40, yPos)
        doc.text(product.category, 85, yPos)
        doc.text(`${product.sold}`, 120, yPos)
        doc.text(`$${product.revenue.toLocaleString()}`, 140, yPos)
        doc.text(`$${(product.revenue / product.sold).toFixed(2)}`, 165, yPos)
        yPos += 8
      })
      
      yPos += 15
      
      // Actionable Insights
      if (yPos > 220) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFontSize(16)
      doc.setTextColor(59, 130, 246)
      doc.text('Actionable Insights & Recommendations', 20, yPos)
      yPos += 12
      
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      
      const insights = [
        `Target Achievement: You're 87% towards monthly target. Focus on peak hours (10:00-13:00) to maximize sales.`,
        `Weekend Performance: Saturday shows highest sales (${formatCurrency(720000)}). Consider weekend promotions.`,
        `Team Excellence: Sarah Manager exceeds targets by 22%. Share her best practices with the team.`,
        `Peak Hour Optimization: 10:00-13:00 are peak sales hours. Consider increasing staff during these hours.`,
        `Growth Trajectory: Daily average up 12.5% from last week. This trend suggests exceeding next month's target.`,
        `Support Needed: Budi Sales is at 95% of target. Provide additional support or training.`
      ]
      
      insights.forEach(insight => {
        const lines = doc.splitTextToSize(`• ${insight}`, 170)
        lines.forEach((line: string) => {
          doc.text(line, 20, yPos)
          yPos += 5
        })
        yPos += 3
      })
      
      // Footer
      const pageHeight = doc.internal.pageSize.height
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('Generated by Stokku Sales Analytics System', 20, pageHeight - 20)
      doc.text(`Report ID: SAR-${format(new Date(), 'yyyyMMdd-HHmmss')}`, 20, pageHeight - 15)
      
      // Save
      doc.save(`sales-analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
      
    } catch (error) {
      console.error('PDF Export Error:', error)
      alert('Failed to generate PDF report. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Sales Analytics</h1>
          <p className="text-sm text-gray-600">
            Actionable insights to drive your sales performance forward
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* 🔎 Analytic Breakdown View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 📈 Total Sales vs Target */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Sales vs Target</p>
                <p className="text-xs text-gray-500 mt-1">August 2024</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Target: {formatCurrency(currentMonth.target)}</span>
                  <span className="text-xs font-medium">{targetProgress.toFixed(1)}%</span>
                </div>
                <Progress value={targetProgress} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(currentMonth.achieved)}</p>
                  <p className="text-xs text-gray-500">Achieved</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-orange-600">
                    {formatCurrency(currentMonth.target - currentMonth.achieved)}
                  </p>
                  <p className="text-xs text-gray-500">To go</p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  Need <span className="font-medium text-orange-600">{formatCurrency(dailyTargetNeeded)}/day</span> for {remainingDays} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 💹 Average Daily Sales */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Average</p>
                <p className="text-xs text-gray-500 mt-1">This week</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(avgDailySales)}
              </p>
              
              <div className="flex items-center gap-2">
                <ArrowUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600 font-medium">+12.5%</span>
                <span className="text-xs text-gray-500">vs last week</span>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  Best day: <span className="font-medium text-green-600">Saturday</span> ({formatCurrency(720000)})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🕒 Peak Sales Hours */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Peak Hours</p>
                <p className="text-xs text-gray-500 mt-1">Most active time</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-2xl font-bold text-purple-600">10:00–13:00</p>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-600 font-medium">{formatCurrency(545000)}</span>
                <span className="text-xs text-gray-500">avg during peak</span>
              </div>
              
              <div className="pt-2 border-t border-gray-100 space-y-1">
                <p className="text-xs text-gray-600">
                  Peak hour: <span className="font-medium text-purple-600">12:00</span> ({formatCurrency(200000)})
                </p>
                <p className="text-xs text-gray-500">
                  22 orders during lunch rush
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🧍‍♂️ Top Contributor */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Contributor</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {topContributor.avatar}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{topContributor.name}</p>
                  <p className="text-xs text-gray-500">{topContributor.role}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(topContributor.sales)}
                </p>
                <p className="text-xs text-gray-600">
                  {topContributor.orders} orders • {topContributor.performance}% of target
                </p>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Performance</span>
                  <Badge variant={topContributor.performance >= 100 ? "default" : "secondary"} className="text-xs">
                    {topContributor.performance >= 100 ? "Exceeding" : "On Track"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%" margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
                <AreaChart data={sampleSalesData} margin={{ left: 60, right: 30, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    width={50}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      formatCurrencyDetailed(value), 
                      name === 'revenue' ? 'Revenue' : name === 'profit' ? 'Profit' : 'Orders'
                    ]}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.1}
                    name="Revenue"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.1}
                    name="Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Sales by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelStyle={{ fontSize: '14px', fontWeight: 'bold', fill: '#374151' }}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value}% (${formatCurrency(props.payload.revenue * 1000)})`,
                      'Share'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sampleSalesData} margin={{ left: 60, right: 30, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  tickFormatter={(value) => formatCurrency(value)}
                  width={50}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => `${value}`}
                  width={30}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrencyDetailed(value) : `${value} orders`,
                    name === 'revenue' ? 'Revenue' : 'Orders'
                  ]}
                />
                <Legend />
                <Bar yAxisId="right" dataKey="orders" fill="#3B82F6" name="Orders" />
                <Bar yAxisId="left" dataKey="revenue" fill="#10B981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Top Selling Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg. Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSellingProducts.map((product, index) => (
                <TableRow key={product.name}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-semibold text-sm">
                        #{index + 1}
                      </div>
                      <div className="font-medium">{product.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{product.sold}</TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    ${product.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${(product.revenue / product.sold).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">89.2%</div>
              <div className="text-sm font-medium text-gray-600 mb-1">Customer Satisfaction</div>
              <div className="text-xs text-gray-500">Based on reviews and returns</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">2.1x</div>
              <div className="text-sm font-medium text-gray-600 mb-1">Return on Investment</div>
              <div className="text-xs text-gray-500">Compared to industry average</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">24.6%</div>
              <div className="text-sm font-medium text-gray-600 mb-1">Profit Margin</div>
              <div className="text-xs text-gray-500">Average across all products</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
