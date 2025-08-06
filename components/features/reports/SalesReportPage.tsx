'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Calendar,
  Download,
  Filter
} from 'lucide-react'
import { Product } from '@/types/product.types'

interface SalesReportPageProps {
  products: Product[]
}

// Sample sales data (in a real app, this would come from your database)
const sampleSalesData = [
  { month: 'Jan', revenue: 12400, orders: 87, profit: 3200 },
  { month: 'Feb', revenue: 15600, orders: 98, profit: 4100 },
  { month: 'Mar', revenue: 18900, orders: 112, profit: 5200 },
  { month: 'Apr', revenue: 16800, orders: 94, profit: 4800 },
  { month: 'May', revenue: 21200, orders: 123, profit: 6100 },
  { month: 'Jun', revenue: 19500, orders: 108, profit: 5500 },
  { month: 'Jul', revenue: 23400, orders: 134, profit: 6800 },
  { month: 'Aug', revenue: 25100, orders: 142, profit: 7300 },
  { month: 'Sep', revenue: 22800, orders: 126, profit: 6600 },
  { month: 'Oct', revenue: 26500, orders: 149, profit: 7900 },
  { month: 'Nov', revenue: 24200, orders: 138, profit: 7200 },
  { month: 'Dec', revenue: 28900, orders: 167, profit: 8500 }
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
  const [timeframe, setTimeframe] = useState('12months')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const totalRevenue = sampleSalesData.reduce((sum, item) => sum + item.revenue, 0)
  const totalOrders = sampleSalesData.reduce((sum, item) => sum + item.orders, 0)
  const totalProfit = sampleSalesData.reduce((sum, item) => sum + item.profit, 0)
  const averageOrderValue = totalRevenue / totalOrders

  const exportReport = () => {
    // In a real app, this would generate and download a comprehensive sales report
    console.log('Exporting sales report...')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Sales Report</h1>
          <p className="text-sm text-gray-600">
            Comprehensive analytics and insights about your sales performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">+12% from last period</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{totalOrders.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">+8% from last period</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Profit</p>
                <p className="text-2xl font-bold text-purple-600">${totalProfit.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">+15% from last period</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Order Value</p>
                <p className="text-2xl font-bold text-orange-600">${averageOrderValue.toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-1">+3% from last period</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-orange-600" />
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sampleSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `$${value.toLocaleString()}`, 
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
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value}% ($${props.payload.revenue.toLocaleString()})`,
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
              <BarChart data={sampleSalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#3B82F6" name="Orders" />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue ($)" />
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
