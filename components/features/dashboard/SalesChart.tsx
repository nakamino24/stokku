'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { CalendarIcon, TrendingUp, DollarSign, Package, BarChart3 } from 'lucide-react'
import { format, subDays, subMonths, startOfDay, endOfDay, isWithinInterval } from 'date-fns'
import { cn } from '@/lib/utils'

interface SalesData {
  date: string
  sales: number
  revenue: number
  orders: number
  products: number
}

// Sample sales data - in a real app, this would come from your database
const generateSampleData = (): SalesData[] => {
  const data: SalesData[] = []
  const today = new Date()
  
  for (let i = 90; i >= 0; i--) {
    const date = subDays(today, i)
    const baseRevenue = 1000 + Math.random() * 2000
    const variation = Math.sin(i / 10) * 500 + Math.random() * 300
    
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      sales: Math.floor(baseRevenue + variation),
      revenue: Math.floor((baseRevenue + variation) * 1.2),
      orders: Math.floor((baseRevenue + variation) / 50),
      products: Math.floor((baseRevenue + variation) / 100)
    })
  }
  
  return data
}

const sampleSalesData = generateSampleData()

interface SalesChartProps {
  className?: string
}

export function SalesChart({ className }: SalesChartProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: subDays(new Date(), 30),
    to: new Date()
  })

  const [quickRange, setQuickRange] = useState<string>('30d')
  const [chartType, setChartType] = useState<'line' | 'area'>('area')
  const [metric, setMetric] = useState<'sales' | 'revenue' | 'orders'>('revenue')

  // Quick range options
  const quickRanges = [
    { label: '7 Days', value: '7d', days: 7 },
    { label: '30 Days', value: '30d', days: 30 },
    { label: '3 Months', value: '3m', days: 90 },
    { label: '6 Months', value: '6m', days: 180 },
    { label: '1 Year', value: '1y', days: 365 }
  ]

  const handleQuickRangeChange = (value: string) => {
    setQuickRange(value)
    const range = quickRanges.find(r => r.value === value)
    if (range) {
      setDateRange({
        from: subDays(new Date(), range.days),
        to: new Date()
      })
    }
  }

  // Filter data based on selected date range
  const filteredData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return sampleSalesData

    return sampleSalesData.filter(item => {
      const itemDate = new Date(item.date)
      return isWithinInterval(itemDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      })
    })
  }, [dateRange])

  // Calculate totals and growth
  const totals = useMemo(() => {
    const currentPeriodData = filteredData
    const previousPeriodStart = subDays(dateRange.from, filteredData.length)
    const previousPeriodData = sampleSalesData.filter(item => {
      const itemDate = new Date(item.date)
      return isWithinInterval(itemDate, {
        start: startOfDay(previousPeriodStart),
        end: endOfDay(subDays(dateRange.from, 1))
      })
    }).slice(-filteredData.length)

    const currentTotal = currentPeriodData.reduce((sum, item) => sum + item[metric], 0)
    const previousTotal = previousPeriodData.reduce((sum, item) => sum + item[metric], 0)
    const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

    return {
      current: currentTotal,
      previous: previousTotal,
      growth: growth,
      orders: currentPeriodData.reduce((sum, item) => sum + item.orders, 0),
      products: currentPeriodData.reduce((sum, item) => sum + item.products, 0)
    }
  }, [filteredData, metric, dateRange])

  const metricConfig = {
    sales: { 
      label: 'Sales', 
      color: '#3b82f6', 
      icon: BarChart3,
      prefix: '$',
      format: (value: number) => `$${value.toLocaleString()}`
    },
    revenue: { 
      label: 'Revenue', 
      color: '#10b981', 
      icon: DollarSign,
      prefix: '$',
      format: (value: number) => `$${value.toLocaleString()}`
    },
    orders: { 
      label: 'Orders', 
      color: '#f59e0b', 
      icon: Package,
      prefix: '',
      format: (value: number) => value.toLocaleString()
    }
  }

  const currentConfig = metricConfig[metric]

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <currentConfig.icon className="h-5 w-5" />
              {currentConfig.label} Analytics
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {currentConfig.format(totals.current)}
                </span>
                <Badge 
                  variant={totals.growth >= 0 ? 'default' : 'destructive'}
                  className={cn(
                    "text-xs",
                    totals.growth >= 0 
                      ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                      : 'bg-red-100 text-red-800 hover:bg-red-100'
                  )}
                >
                  <TrendingUp className={cn(
                    "h-3 w-3 mr-1",
                    totals.growth < 0 && "rotate-180"
                  )} />
                  {Math.abs(totals.growth).toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Metric Selector */}
            <Select value={metric} onValueChange={(value: any) => setMetric(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
              </SelectContent>
            </Select>

            {/* Chart Type Selector */}
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-full sm:w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="line">Line</SelectItem>
              </SelectContent>
            </Select>

            {/* Quick Range Selector */}
            <Select value={quickRange} onValueChange={handleQuickRangeChange}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {quickRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range: any) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to })
                      setQuickRange('custom')
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totals.orders}</div>
            <div className="text-xs text-gray-500">Total Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totals.products}</div>
            <div className="text-xs text-gray-500">Products Sold</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {totals.orders > 0 ? `$${Math.round(totals.current / totals.orders)}` : '$0'}
            </div>
            <div className="text-xs text-gray-500">Avg Order Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{filteredData.length}</div>
            <div className="text-xs text-gray-500">Days Selected</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={currentConfig.format}
                  className="text-xs"
                />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  formatter={(value: number) => [currentConfig.format(value), currentConfig.label]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke={currentConfig.color}
                  strokeWidth={2}
                  fill={currentConfig.color}
                  fillOpacity={0.1}
                />
              </AreaChart>
            ) : (
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={currentConfig.format}
                  className="text-xs"
                />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  formatter={(value: number) => [currentConfig.format(value), currentConfig.label]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke={currentConfig.color}
                  strokeWidth={3}
                  dot={{ fill: currentConfig.color, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: currentConfig.color, strokeWidth: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
