'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts'
import { 
  Search, Download, AlertTriangle, Trophy, Calendar, 
  TrendingUp, Package, DollarSign, Truck, Clock, Star, FileText 
} from 'lucide-react'
import jsPDF from 'jspdf'
import { DataService } from '@/lib/data-service'
import { Supplier, SupplierStats } from '@/types/supplier.types'

// Sample Supplier Data
interface SupplierData {
  id: string
  name: string
  contact: string
  email: string
  totalProducts: number
  totalPurchaseValue: number
  status: 'Active' | 'Inactive'
  lastTransactionDate: string
  reliability: 'High' | 'Medium' | 'Low'
  onTimeDeliveryRate: number
  averageDeliveryTime: number // in days
  totalTransactions: number
  categories: string[]
  monthlyPurchases: {
    month: string
    amount: number
    orders: number
  }[]
}

interface Transaction {
  id: string
  supplierId: string
  productName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  date: string
  status: 'Completed' | 'Pending' | 'Cancelled'
  deliveryDate?: string
  isLateDelivery: boolean
}

// Sample data
const sampleSuppliers: SupplierData[] = [
  {
    id: 'sup-1',
    name: 'TechCorp',
    contact: '+62-21-123-4567',
    email: 'contact@techcorp.co.id',
    totalProducts: 15,
    totalPurchaseValue: 45750000, // IDR
    status: 'Active',
    lastTransactionDate: '2024-01-15',
    reliability: 'High',
    onTimeDeliveryRate: 95,
    averageDeliveryTime: 3,
    totalTransactions: 28,
    categories: ['Electronics', 'Gadgets'],
    monthlyPurchases: [
      { month: 'Nov', amount: 12500000, orders: 8 },
      { month: 'Dec', amount: 15200000, orders: 10 },
      { month: 'Jan', amount: 18050000, orders: 10 }
    ]
  },
  {
    id: 'sup-2',
    name: 'Bean Masters',
    contact: '+62-21-765-4321',
    email: 'orders@beanmasters.com',
    totalProducts: 8,
    totalPurchaseValue: 18750000,
    status: 'Active',
    lastTransactionDate: '2024-01-14',
    reliability: 'High',
    onTimeDeliveryRate: 92,
    averageDeliveryTime: 2,
    totalTransactions: 15,
    categories: ['Food & Beverage'],
    monthlyPurchases: [
      { month: 'Nov', amount: 5200000, orders: 5 },
      { month: 'Dec', amount: 6800000, orders: 5 },
      { month: 'Jan', amount: 6750000, orders: 5 }
    ]
  },
  {
    id: 'sup-3',
    name: 'Office Plus',
    contact: '+62-21-888-9999',
    email: 'supply@officeplus.id',
    totalProducts: 12,
    totalPurchaseValue: 28950000,
    status: 'Active',
    lastTransactionDate: '2024-01-13',
    reliability: 'Medium',
    onTimeDeliveryRate: 78,
    averageDeliveryTime: 5,
    totalTransactions: 22,
    categories: ['Office Supplies', 'Furniture'],
    monthlyPurchases: [
      { month: 'Nov', amount: 8900000, orders: 7 },
      { month: 'Dec', amount: 9200000, orders: 8 },
      { month: 'Jan', amount: 10850000, orders: 7 }
    ]
  },
  {
    id: 'sup-4',
    name: 'FitGear Co',
    contact: '+62-21-444-5555',
    email: 'wholesale@fitgear.co.id',
    totalProducts: 10,
    totalPurchaseValue: 22400000,
    status: 'Active',
    lastTransactionDate: '2024-01-12',
    reliability: 'High',
    onTimeDeliveryRate: 88,
    averageDeliveryTime: 4,
    totalTransactions: 18,
    categories: ['Sports & Fitness'],
    monthlyPurchases: [
      { month: 'Nov', amount: 7100000, orders: 6 },
      { month: 'Dec', amount: 7800000, orders: 6 },
      { month: 'Jan', amount: 7500000, orders: 6 }
    ]
  },
  {
    id: 'sup-5',
    name: 'AudioTech',
    contact: '+62-21-222-3333',
    email: 'sales@audiotech.id',
    totalProducts: 6,
    totalPurchaseValue: 15680000,
    status: 'Inactive',
    lastTransactionDate: '2023-12-20',
    reliability: 'Low',
    onTimeDeliveryRate: 65,
    averageDeliveryTime: 7,
    totalTransactions: 12,
    categories: ['Electronics', 'Audio'],
    monthlyPurchases: [
      { month: 'Nov', amount: 5200000, orders: 4 },
      { month: 'Dec', amount: 3800000, orders: 3 },
      { month: 'Jan', amount: 6680000, orders: 5 }
    ]
  }
]

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function SupplierReportPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All')
  const [reliabilityFilter, setReliabilityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All')
  const [sortBy, setSortBy] = useState<'name' | 'totalPurchaseValue' | 'totalTransactions' | 'reliability'>('totalPurchaseValue')
  const [suppliers, setSuppliers] = useState<(Supplier & SupplierStats)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load suppliers with statistics
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true)
        if (DataService.isUsingSupabase()) {
          const suppliersWithStats = await DataService.getSuppliersWithStats()
          setSuppliers(suppliersWithStats)
        } else {
          // Fallback to sample data if not using Supabase
          const transformedSuppliers = sampleSuppliers.map(supplier => ({
            id: supplier.id,
            name: supplier.name,
            contact: supplier.contact,
            email: supplier.email,
            address: '',
            status: supplier.status,
            reliability: supplier.reliability,
            on_time_delivery_rate: supplier.onTimeDeliveryRate,
            average_delivery_time: supplier.averageDeliveryTime,
            categories: supplier.categories,
            notes: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            totalProducts: supplier.totalProducts,
            totalPurchaseValue: supplier.totalPurchaseValue,
            totalTransactions: supplier.totalTransactions,
            lastTransactionDate: supplier.lastTransactionDate,
            monthlyPurchases: supplier.monthlyPurchases
          }))
          setSuppliers(transformedSuppliers)
        }
      } catch (err) {
        console.error('Error loading suppliers:', err)
        setError('Failed to load supplier data. Please try again.')
        // Fallback to sample data on error
        const transformedSuppliers = sampleSuppliers.map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          contact: supplier.contact,
          email: supplier.email,
          address: '',
          status: supplier.status,
          reliability: supplier.reliability,
          on_time_delivery_rate: supplier.onTimeDeliveryRate,
          average_delivery_time: supplier.averageDeliveryTime,
          categories: supplier.categories,
          notes: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          totalProducts: supplier.totalProducts,
          totalPurchaseValue: supplier.totalPurchaseValue,
          totalTransactions: supplier.totalTransactions,
          lastTransactionDate: supplier.lastTransactionDate,
          monthlyPurchases: supplier.monthlyPurchases
        }))
        setSuppliers(transformedSuppliers)
      } finally {
        setLoading(false)
      }
    }

    loadSuppliers()
  }, [])

  // Filter and sort suppliers
  const filteredSuppliers = useMemo(() => {
    if (loading || suppliers.length === 0) return []
    
    let filtered = suppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          supplier.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'All' || supplier.status === statusFilter
      const matchesReliability = reliabilityFilter === 'All' || supplier.reliability === reliabilityFilter
      
      return matchesSearch && matchesStatus && matchesReliability
    })

    // Sort suppliers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'totalPurchaseValue':
          return b.totalPurchaseValue - a.totalPurchaseValue
        case 'totalTransactions':
          return b.totalTransactions - a.totalTransactions
        case 'reliability':
          const reliabilityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 }
          return reliabilityOrder[b.reliability] - reliabilityOrder[a.reliability]
        default:
          return 0
      }
    })

    return filtered
  }, [suppliers, searchTerm, statusFilter, reliabilityFilter, sortBy, loading])

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (filteredSuppliers.length === 0) {
      return {
        totalSuppliers: 0,
        activeSuppliers: 0,
        totalPurchaseValue: 0,
        averageReliability: 0,
        lowReliabilityCount: 0
      }
    }
    
    const activeSuppliers = filteredSuppliers.filter(s => s.status === 'Active')
    const totalPurchaseValue = filteredSuppliers.reduce((sum, s) => sum + s.totalPurchaseValue, 0)
    const averageReliability = filteredSuppliers.reduce((sum, s) => sum + s.on_time_delivery_rate, 0) / filteredSuppliers.length
    const lowReliabilityCount = filteredSuppliers.filter(s => s.reliability === 'Low' || s.on_time_delivery_rate < 80).length
    
    return {
      totalSuppliers: filteredSuppliers.length,
      activeSuppliers: activeSuppliers.length,
      totalPurchaseValue,
      averageReliability: Math.round(averageReliability),
      lowReliabilityCount
    }
  }, [filteredSuppliers])

  // Top performing suppliers (top 3)
  const topSuppliers = useMemo(() => {
    return [...filteredSuppliers]
      .sort((a, b) => b.totalPurchaseValue - a.totalPurchaseValue)
      .slice(0, 3)
  }, [filteredSuppliers])

  // Monthly purchase data for chart
  const monthlyData = useMemo(() => {
    const monthlyTotals: { [key: string]: number } = {}
    
    filteredSuppliers.forEach(supplier => {
      supplier.monthlyPurchases.forEach(purchase => {
        monthlyTotals[purchase.month] = (monthlyTotals[purchase.month] || 0) + purchase.amount
      })
    })
    
    return Object.entries(monthlyTotals).map(([month, amount]) => ({
      month,
      amount: amount / 1000000 // Convert to millions IDR
    }))
  }, [filteredSuppliers])

  // Reliability distribution for pie chart
  const reliabilityData = useMemo(() => {
    const distribution = { High: 0, Medium: 0, Low: 0 }
    filteredSuppliers.forEach(supplier => {
      distribution[supplier.reliability]++
    })
    
    return Object.entries(distribution).map(([reliability, count]) => ({
      name: reliability,
      value: count
    }))
  }, [filteredSuppliers])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getReliabilityBadge = (supplier: SupplierData) => {
    if (supplier.reliability === 'Low' || supplier.onTimeDeliveryRate < 80) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle size={12} />
        Needs Attention
      </Badge>
    } else if (supplier.reliability === 'High' && supplier.onTimeDeliveryRate >= 90) {
      return <Badge variant="default" className="bg-green-500 flex items-center gap-1">
        <Star size={12} />
        Top Performer
      </Badge>
    }
    return <Badge variant="secondary">{supplier.reliability} Reliability</Badge>
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    let yPosition = 30

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Supplier Report', pageWidth / 2, yPosition, { align: 'center' })
    
    yPosition += 15
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, yPosition, { align: 'center' })
    
    yPosition += 20

    // Summary Statistics
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary Statistics', margin, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const summaryLines = [
      `Total Suppliers: ${summaryStats.totalSuppliers}`,
      `Active Suppliers: ${summaryStats.activeSuppliers}`,
      `Total Purchase Value: ${formatCurrency(summaryStats.totalPurchaseValue)}`,
      `Average Delivery Rate: ${summaryStats.averageReliability}%`,
      `Suppliers Needing Attention: ${summaryStats.lowReliabilityCount}`
    ]
    
    summaryLines.forEach(line => {
      doc.text(line, margin, yPosition)
      yPosition += 6
    })
    
    yPosition += 15

    // Top Performers
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Top Performing Suppliers', margin, yPosition)
    yPosition += 10

    topSuppliers.forEach((supplier, index) => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${supplier.name}`, margin, yPosition)
      yPosition += 5
      
      doc.setFont('helvetica', 'normal')
      doc.text(`   Purchase Value: ${formatCurrency(supplier.totalPurchaseValue)}`, margin, yPosition)
      yPosition += 5
      doc.text(`   On-time Delivery: ${supplier.onTimeDeliveryRate}%`, margin, yPosition)
      yPosition += 8
    })

    yPosition += 10

    // Suppliers Table
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Detailed Supplier List', margin, yPosition)
    yPosition += 15

    // Table headers
    const headers = ['Supplier Name', 'Status', 'Products', 'Purchase Value', 'Reliability']
    const headerY = yPosition
    const colWidth = (pageWidth - 2 * margin) / headers.length

    // Draw header background
    doc.setFillColor(59, 130, 246) // Blue
    doc.rect(margin, headerY - 5, pageWidth - 2 * margin, 10, 'F')

    // Header text
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    headers.forEach((header, index) => {
      doc.text(header, margin + index * colWidth + 2, headerY, { maxWidth: colWidth - 4 })
    })

    yPosition += 10
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')

    // Table rows
    filteredSuppliers.slice(0, 15).forEach((supplier, index) => {
      const isEvenRow = index % 2 === 0
      
      // Alternating row colors
      if (isEvenRow) {
        doc.setFillColor(248, 250, 252)
        doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 8, 'F')
      }

      const rowData = [
        supplier.name,
        supplier.status,
        supplier.totalProducts.toString(),
        formatCurrency(supplier.totalPurchaseValue),
        `${supplier.onTimeDeliveryRate}%`
      ]

      rowData.forEach((data, colIndex) => {
        let text = data
        if (text.length > 15) {
          text = text.substring(0, 12) + '...'
        }
        doc.text(text, margin + colIndex * colWidth + 2, yPosition, { maxWidth: colWidth - 4 })
      })

      yPosition += 8

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 30
      }
    })

    // Footer
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Stokku - Supplier Report | Page ${i} of ${totalPages}`, 
        pageWidth / 2, 285, { align: 'center' })
    }

    doc.save(`Supplier-Report-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Supplier Name', 'Contact', 'Email', 'Status', 'Total Products', 'Purchase Value (IDR)', 'On-time Delivery %', 'Reliability', 'Last Transaction'],
      ...filteredSuppliers.map(supplier => [
        supplier.name,
        supplier.contact,
        supplier.email,
        supplier.status,
        supplier.totalProducts.toString(),
        supplier.totalPurchaseValue.toString(),
        supplier.onTimeDeliveryRate.toString(),
        supplier.reliability,
        supplier.lastTransactionDate
      ])
    ]
    
    const csvString = csvContent.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Supplier-Report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Report</h1>
          <p className="text-gray-600 mt-1">Monitor supplier performance and purchase analytics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
          <Button onClick={exportToPDF} size="sm">
            <FileText size={16} className="mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search suppliers, email, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reliabilityFilter} onValueChange={(value: any) => setReliabilityFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Reliability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Reliability</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalPurchaseValue">Purchase Value</SelectItem>
                <SelectItem value="totalTransactions">Transactions</SelectItem>
                <SelectItem value="reliability">Reliability</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Suppliers</p>
                <p className="text-2xl font-bold">{summaryStats.totalSuppliers}</p>
              </div>
              <Package className="text-blue-500" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Suppliers</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.activeSuppliers}</p>
              </div>
              <TrendingUp className="text-green-500" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Purchase Value</p>
                <p className="text-lg font-bold">{formatCurrency(summaryStats.totalPurchaseValue)}</p>
              </div>
              <DollarSign className="text-yellow-500" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Delivery Rate</p>
                <p className="text-2xl font-bold text-blue-600">{summaryStats.averageReliability}%</p>
              </div>
              <Truck className="text-blue-500" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Need Attention</p>
                <p className="text-2xl font-bold text-red-600">{summaryStats.lowReliabilityCount}</p>
              </div>
              <AlertTriangle className="text-red-500" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            Top Performing Suppliers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topSuppliers.map((supplier, index) => (
              <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{supplier.name}</p>
                    <p className="text-sm text-gray-600">{supplier.categories.join(', ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(supplier.totalPurchaseValue)}</p>
                  <p className="text-sm text-gray-600">{supplier.on_time_delivery_rate}% on-time delivery</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Purchases Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Purchase Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `${value}M`}
                  width={60}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}M IDR`, 'Purchase Value']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reliability Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Reliability Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reliabilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reliabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Overview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Supplier Name</th>
                  <th className="text-left p-2">Contact</th>
                  <th className="text-left p-2">Products</th>
                  <th className="text-left p-2">Purchase Value</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Delivery Rate</th>
                  <th className="text-left p-2">Last Transaction</th>
                  <th className="text-left p-2">Reliability</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <p className="font-semibold">{supplier.name}</p>
                        <p className="text-sm text-gray-600">{supplier.categories.join(', ')}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="text-sm">{supplier.contact}</p>
                        <p className="text-sm text-gray-600">{supplier.email}</p>
                      </div>
                    </td>
                    <td className="p-2">{supplier.totalProducts}</td>
                    <td className="p-2">{formatCurrency(supplier.totalPurchaseValue)}</td>
                    <td className="p-2">
                      <Badge variant={supplier.status === 'Active' ? 'default' : 'secondary'}>
                        {supplier.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span>{supplier.on_time_delivery_rate}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${supplier.on_time_delivery_rate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {supplier.lastTransactionDate}
                      </div>
                    </td>
                    <td className="p-2">
                      {getReliabilityBadge(supplier)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
