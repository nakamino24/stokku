'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Product } from '@/types/product.types'
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
  TableRow,
} from '@/components/ui/table'
import {
  Package,
  Package2,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { DataService } from '@/lib/data-service'

interface StockMovementPageProps {
  products: Product[]
}

interface StockMovement {
  id: number
  productName: string
  sku: string
  type: 'inbound' | 'outbound'
  quantity: number
  status: 'pending' | 'in-transit' | 'delivered' | 'cancelled' | 'received'
  supplier?: string
  expectedDate: string
  actualDate?: string | null
  trackingNumber?: string
  reason: string
  notes?: string
  created_at?: string
}

// Default sample stock movement data as fallback
const defaultStockMovements: StockMovement[] = [
  {
    id: 1,
    productName: 'Wireless Headphones',
    sku: 'WH-001',
    type: 'inbound',
    quantity: 50,
    status: 'delivered',
    supplier: 'TechCorp',
    expectedDate: '2024-01-15',
    actualDate: '2024-01-14',
    trackingNumber: 'TC789456123'
  },
  {
    id: 2,
    productName: 'Coffee Beans Premium',
    sku: 'CB-002',
    type: 'inbound',
    quantity: 100,
    status: 'in-transit',
    supplier: 'Bean Masters',
    expectedDate: '2024-01-18',
    actualDate: null,
    trackingNumber: 'BM456789012'
  },
  {
    id: 3,
    productName: 'Yoga Mat Premium',
    sku: 'YM-004',
    type: 'outbound',
    quantity: 25,
    status: 'delivered',
    supplier: 'Customer Order #1234',
    expectedDate: '2024-01-16',
    actualDate: '2024-01-16',
    trackingNumber: 'OUT123456789'
  },
  {
    id: 4,
    productName: 'Desk Lamp LED',
    sku: 'DL-003',
    type: 'inbound',
    quantity: 75,
    status: 'pending',
    supplier: 'Office Plus',
    expectedDate: '2024-01-20',
    actualDate: null,
    trackingNumber: 'OP987654321'
  },
  {
    id: 5,
    productName: 'Bluetooth Speaker',
    sku: 'BS-005',
    type: 'outbound',
    quantity: 15,
    status: 'in-transit',
    supplier: 'Customer Order #1567',
    expectedDate: '2024-01-19',
    actualDate: null,
    trackingNumber: 'OUT987654321'
  },
  {
    id: 6,
    productName: 'Wireless Headphones',
    sku: 'WH-001',
    type: 'inbound',
    quantity: 30,
    status: 'received',
    supplier: 'TechCorp',
    expectedDate: '2024-01-12',
    actualDate: '2024-01-12',
    trackingNumber: 'TC321654987'
  }
]

export function StockMovementPage({ products }: StockMovementPageProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  // Load stock movements from localStorage and DataService
  useEffect(() => {
    loadStockMovements()
  }, [])

  const loadStockMovements = async () => {
    setLoading(true)
    try {
      // Load from admin-created movements in localStorage
      const adminMovements = JSON.parse(localStorage.getItem('stockMovements') || '[]')
      
      // Load from DataService (database or fallback)
      let serviceMovements: any[] = []
      try {
        serviceMovements = await DataService.getStockMovements()
      } catch (error) {
        console.error('Error loading stock movements from service:', error)
      }

      // Combine admin movements with service movements, prioritizing admin movements
      let allMovements = [...adminMovements]
      
      // Add service movements, avoiding duplicates
      serviceMovements.forEach(movement => {
        if (!allMovements.find(m => m.id === movement.id)) {
          allMovements.push(movement)
        }
      })

      // If no movements found, use default sample data
      if (allMovements.length === 0) {
        allMovements = defaultStockMovements
      }

      setStockMovements(allMovements)
    } catch (error) {
      console.error('Error loading stock movements:', error)
      toast.error('Failed to load stock movements')
      setStockMovements(defaultStockMovements)
    } finally {
      setLoading(false)
    }
  }

  // Filter movements based on selected filters
  const filteredMovements = stockMovements.filter(movement => {
    const matchesStatus = statusFilter === 'all' || movement.status === statusFilter
    const matchesType = typeFilter === 'all' || movement.type === typeFilter
    return matchesStatus && matchesType
  })

  // Calculate summary statistics
  const totalInbound = stockMovements.filter(m => m.type === 'inbound').length
  const totalOutbound = stockMovements.filter(m => m.type === 'outbound').length
  const pendingMovements = stockMovements.filter(m => m.status === 'pending').length
  const inTransitMovements = stockMovements.filter(m => m.status === 'in-transit').length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'received':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in-transit':
        return <Truck className="h-4 w-4 text-blue-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'received':
        return 'bg-green-100 text-green-800'
      case 'in-transit':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'inbound' ? 
      <ArrowRight className="h-4 w-4 text-green-600" /> : 
      <ArrowLeft className="h-4 w-4 text-red-600" />
  }

  const getTypeColor = (type: string) => {
    return type === 'inbound' ? 
      'bg-green-100 text-green-800' : 
      'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Stock Movement</h1>
          <p className="text-sm text-gray-600">
            Track inbound and outbound inventory movements with real-time status updates
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Movement Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="received">Received</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inbound Movements</p>
                <p className="text-2xl font-bold text-green-600">{totalInbound}</p>
                <p className="text-xs text-gray-500 mt-1">Receiving inventory</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outbound Movements</p>
                <p className="text-2xl font-bold text-red-600">{totalOutbound}</p>
                <p className="text-xs text-gray-500 mt-1">Shipping inventory</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowLeft className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-blue-600">{inTransitMovements}</p>
                <p className="text-xs text-gray-500 mt-1">Currently shipping</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingMovements}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Movements Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              Stock Movements
            </CardTitle>
            <Badge variant="secondary">
              {filteredMovements.length} movements
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Supplier/Destination</TableHead>
                  <TableHead>Expected Date</TableHead>
                  <TableHead>Actual Date</TableHead>
                  <TableHead>Tracking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.productName}</div>
                        <div className="text-sm text-gray-500">{movement.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(movement.type)}>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(movement.type)}
                          {movement.type === 'inbound' ? 'Inbound' : 'Outbound'}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {movement.type === 'inbound' ? '+' : '-'}{movement.quantity}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(movement.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(movement.status)}
                          {movement.status.charAt(0).toUpperCase() + movement.status.slice(1)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{movement.supplier}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {movement.expectedDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      {movement.actualDate ? (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {movement.actualDate}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">Pending</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono text-blue-600">
                        {movement.trackingNumber}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMovements.slice(0, 5).map((movement, index) => (
              <div key={movement.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                <div className={`p-2 rounded-full ${
                  movement.type === 'inbound' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {getTypeIcon(movement.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{movement.productName}</p>
                    <span className="text-sm text-gray-500">{movement.expectedDate}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {movement.type === 'inbound' ? 'Receiving' : 'Shipping'} {movement.quantity} units
                    {movement.type === 'inbound' ? ' from ' : ' to '}{movement.supplier}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusIcon(movement.status)}
                    <span className="text-sm text-gray-500 capitalize">{movement.status}</span>
                    <span className="text-xs text-gray-400">• {movement.trackingNumber}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
