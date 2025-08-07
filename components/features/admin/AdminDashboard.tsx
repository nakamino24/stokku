'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatabaseInitializer } from './DatabaseInitializer'
import { CategoriesDebug } from '@/components/debug/CategoriesDebug'
import { 
  Settings, Database, Users, FileText, Plus, Target, 
  Truck, TrendingUp, Package, Download, Upload, 
  AlertTriangle, CheckCircle, Edit, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { DataService } from '@/lib/data-service'
import { useAuth } from '@/contexts/AuthContext'

interface Category {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

interface SalesTarget {
  id: string
  month: string
  year: number
  target_amount: number
  created_at: string
  updated_at: string
}

interface StockMovement {
  id: number
  productName: string
  sku: string
  type: 'inbound' | 'outbound'
  quantity: number
  status: 'pending' | 'in-transit' | 'delivered' | 'cancelled'
  supplier?: string
  expectedDate: string
  actualDate?: string
  trackingNumber?: string
  reason: string
  notes?: string
}

interface Supplier {
  id: string
  name: string
  contact: string
  email: string
  address: string
  status: 'Active' | 'Inactive'
  reliability: 'High' | 'Medium' | 'Low'
  on_time_delivery_rate: number
  average_delivery_time: number
  categories: string[]
  notes?: string
  created_at: string
  updated_at: string
}

export function AdminDashboard() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)

  // Category form state
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  
  // Sales target form state
  const [salesTarget, setSalesTarget] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    targetAmount: ''
  })
  
  // Stock movement form state
  const [stockMovement, setStockMovement] = useState({
    productName: '',
    sku: '',
    type: 'inbound' as 'inbound' | 'outbound',
    quantity: '',
    supplier: '',
    expectedDate: new Date().toISOString().slice(0, 10),
    trackingNumber: '',
    reason: '',
    notes: ''
  })

  // Supplier form state
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
    categories: '',
    notes: ''
  })

  useEffect(() => {
    loadCategories()
    loadSuppliers()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await DataService.getAllCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const loadSuppliers = async () => {
    try {
      const data = await DataService.getAllSuppliers()
      setSuppliers(data)
    } catch (error) {
      console.error('Error loading suppliers:', error)
      toast.error('Failed to load suppliers')
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setLoading(true)
    try {
      await DataService.createCategory({
        name: newCategory.name,
        description: newCategory.description
      })
      
      toast.success('Category added successfully')
      setNewCategory({ name: '', description: '' })
      loadCategories()
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Failed to add category')
    } finally {
      setLoading(false)
    }
  }

  const handleSetSalesTarget = async () => {
    if (!salesTarget.month || !salesTarget.targetAmount) {
      toast.error('Month and target amount are required')
      return
    }

    setLoading(true)
    try {
      // Create mock sales target (in real app, this would save to database)
      const [year, month] = salesTarget.month.split('-')
      
      // Store in localStorage for demo purposes
      const targets = JSON.parse(localStorage.getItem('salesTargets') || '[]')
      const existingIndex = targets.findIndex((t: any) => t.month === salesTarget.month)
      
      const targetData = {
        id: existingIndex >= 0 ? targets[existingIndex].id : `target-${Date.now()}`,
        month: salesTarget.month,
        year: parseInt(year),
        target_amount: parseFloat(salesTarget.targetAmount),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (existingIndex >= 0) {
        targets[existingIndex] = targetData
      } else {
        targets.push(targetData)
      }

      localStorage.setItem('salesTargets', JSON.stringify(targets))
      
      toast.success(`Sales target set for ${new Date(salesTarget.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`)
      setSalesTarget({ month: new Date().toISOString().slice(0, 7), targetAmount: '' })
    } catch (error) {
      console.error('Error setting sales target:', error)
      toast.error('Failed to set sales target')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStockMovement = async () => {
    if (!stockMovement.productName || !stockMovement.quantity) {
      toast.error('Product name and quantity are required')
      return
    }

    setLoading(true)
    try {
      // Create mock stock movement (in real app, this would save to database)
      const movements = JSON.parse(localStorage.getItem('stockMovements') || '[]')
      
      const movementData = {
        id: movements.length + 1,
        ...stockMovement,
        quantity: parseInt(stockMovement.quantity),
        status: 'pending',
        created_at: new Date().toISOString()
      }

      movements.unshift(movementData)
      localStorage.setItem('stockMovements', JSON.stringify(movements))
      
      toast.success(`Stock movement recorded for ${stockMovement.productName}`)
      setStockMovement({
        productName: '',
        sku: '',
        type: 'inbound',
        quantity: '',
        supplier: '',
        expectedDate: new Date().toISOString().slice(0, 10),
        trackingNumber: '',
        reason: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error adding stock movement:', error)
      toast.error('Failed to add stock movement')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSupplier = async () => {
    if (!newSupplier.name || !newSupplier.contact || !newSupplier.email) {
      toast.error('Name, contact, and email are required')
      return
    }

    setLoading(true)
    try {
      const supplierData = {
        name: newSupplier.name,
        contact: newSupplier.contact,
        email: newSupplier.email,
        address: newSupplier.address,
        status: 'Active' as const,
        reliability: 'Medium' as const,
        on_time_delivery_rate: 85,
        average_delivery_time: 5,
        categories: newSupplier.categories.split(',').map(c => c.trim()).filter(c => c),
        notes: newSupplier.notes
      }

      const result = await DataService.createSupplier(supplierData)
      
      if (result) {
        toast.success('Supplier added successfully')
        setNewSupplier({
          name: '',
          contact: '',
          email: '',
          address: '',
          categories: '',
          notes: ''
        })
        loadSuppliers()
      } else {
        throw new Error('Failed to create supplier')
      }
    } catch (error) {
      console.error('Error adding supplier:', error)
      toast.error('Failed to add supplier')
    } finally {
      setLoading(false)
    }
  }

  const exportSystemData = () => {
    const data = {
      categories,
      suppliers,
      salesTargets: JSON.parse(localStorage.getItem('salesTargets') || '[]'),
      stockMovements: JSON.parse(localStorage.getItem('stockMovements') || '[]'),
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stokku-admin-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('System data exported successfully')
  }

  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Settings className="h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive management tools for your Stokku application
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline">Admin Access</Badge>
            <Badge variant={DataService.isUsingSupabase() ? "default" : "secondary"}>
              {DataService.getDataSource()}
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                Product categories
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <p className="text-xs text-muted-foreground">
                Registered suppliers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {DataService.isUsingSupabase() ? 'Live' : 'Mock'}
              </div>
              <p className="text-xs text-muted-foreground">
                {DataService.getDataSource()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">
                System operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="targets">Sales Targets</TabsTrigger>
            <TabsTrigger value="movements">Stock Movements</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Debug Component */}
              <CategoriesDebug />
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={exportSystemData} variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export System Data
                  </Button>
                  
                  <DatabaseInitializer />
                  
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      System is running with {DataService.getDataSource()}. 
                      All changes are {DataService.isUsingSupabase() ? 'saved to database' : 'temporary'}.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Add New Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Electronics, Clothing"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="categoryDescription">Description (Optional)</Label>
                    <Textarea
                      id="categoryDescription"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the category"
                      rows={3}
                    />
                  </div>
                  
                  <Button onClick={handleAddCategory} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Categories ({categories.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {categories.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No categories found</p>
                    ) : (
                      categories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{category.name}</p>
                            {category.description && (
                              <p className="text-sm text-gray-600">{category.description}</p>
                            )}
                          </div>
                          <Badge variant="outline">{category.id}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="targets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Set Monthly Sales Target</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetMonth">Target Month</Label>
                    <Input
                      id="targetMonth"
                      type="month"
                      value={salesTarget.month}
                      onChange={(e) => setSalesTarget(prev => ({ ...prev, month: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="targetAmount">Target Amount (IDR)</Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      min="0"
                      step="1000000"
                      value={salesTarget.targetAmount}
                      onChange={(e) => setSalesTarget(prev => ({ ...prev, targetAmount: e.target.value }))}
                      placeholder="e.g., 10000000"
                    />
                  </div>
                </div>
                
                <Button onClick={handleSetSalesTarget} disabled={loading}>
                  <Target className="h-4 w-4 mr-2" />
                  Set Sales Target
                </Button>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Sales targets are used in the Sales Report page to track performance against goals.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Stock Movement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                      id="productName"
                      value={stockMovement.productName}
                      onChange={(e) => setStockMovement(prev => ({ ...prev, productName: e.target.value }))}
                      placeholder="e.g., Wireless Headphones"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={stockMovement.sku}
                      onChange={(e) => setStockMovement(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="e.g., WH-001"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="movementType">Movement Type</Label>
                    <Select value={stockMovement.type} onValueChange={(value: 'inbound' | 'outbound') => setStockMovement(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbound">Inbound (Receiving)</SelectItem>
                        <SelectItem value="outbound">Outbound (Shipping)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={stockMovement.quantity}
                      onChange={(e) => setStockMovement(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supplier">Supplier (Optional)</Label>
                    <Input
                      id="supplier"
                      value={stockMovement.supplier}
                      onChange={(e) => setStockMovement(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="e.g., TechCorp"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="expectedDate">Expected Date</Label>
                    <Input
                      id="expectedDate"
                      type="date"
                      value={stockMovement.expectedDate}
                      onChange={(e) => setStockMovement(prev => ({ ...prev, expectedDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="trackingNumber">Tracking Number (Optional)</Label>
                    <Input
                      id="trackingNumber"
                      value={stockMovement.trackingNumber}
                      onChange={(e) => setStockMovement(prev => ({ ...prev, trackingNumber: e.target.value }))}
                      placeholder="e.g., TC789456123"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      value={stockMovement.reason}
                      onChange={(e) => setStockMovement(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g., Restock, Customer order"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={stockMovement.notes}
                    onChange={(e) => setStockMovement(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this movement"
                    rows={3}
                  />
                </div>
                
                <Button onClick={handleAddStockMovement} disabled={loading}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Add Stock Movement
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Supplier */}
              <Card>
                <CardHeader>
                  <CardTitle>Add New Supplier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="supplierName">Supplier Name</Label>
                    <Input
                      id="supplierName"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., TechCorp"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supplierContact">Contact Number</Label>
                    <Input
                      id="supplierContact"
                      value={newSupplier.contact}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, contact: e.target.value }))}
                      placeholder="e.g., +62-21-123-4567"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supplierEmail">Email</Label>
                    <Input
                      id="supplierEmail"
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g., contact@techcorp.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supplierAddress">Address</Label>
                    <Textarea
                      id="supplierAddress"
                      value={newSupplier.address}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Complete business address"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supplierCategories">Categories (comma-separated)</Label>
                    <Input
                      id="supplierCategories"
                      value={newSupplier.categories}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, categories: e.target.value }))}
                      placeholder="e.g., Electronics, Gadgets"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supplierNotes">Notes (Optional)</Label>
                    <Textarea
                      id="supplierNotes"
                      value={newSupplier.notes}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this supplier"
                      rows={2}
                    />
                  </div>
                  
                  <Button onClick={handleAddSupplier} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Suppliers */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Suppliers ({suppliers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {suppliers.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No suppliers found</p>
                    ) : (
                      suppliers.map((supplier) => (
                        <div key={supplier.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{supplier.name}</p>
                              <p className="text-sm text-gray-600">{supplier.email}</p>
                              <p className="text-sm text-gray-500">{supplier.contact}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={supplier.status === 'Active' ? 'default' : 'secondary'}>
                                {supplier.status}
                              </Badge>
                              <Badge variant="outline">
                                {supplier.reliability}
                              </Badge>
                            </div>
                          </div>
                          {supplier.categories.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Categories: {supplier.categories.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Database:</span>
                      <Badge variant={DataService.isUsingSupabase() ? 'default' : 'secondary'}>
                        {DataService.getDataSource()}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Environment:</span>
                      <Badge variant="outline">
                        {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">User Role:</span>
                      <Badge variant="default">
                        {profile?.role || 'Unknown'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Categories:</span>
                      <span className="text-sm font-medium">{categories.length} active</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Suppliers:</span>
                      <span className="text-sm font-medium">{suppliers.length} registered</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Export/Import */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={exportSystemData} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Export Includes:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Categories ({categories.length})</li>
                      <li>• Suppliers ({suppliers.length})</li>
                      <li>• Sales Targets</li>
                      <li>• Stock Movements</li>
                      <li>• System Configuration</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Database Initializer */}
            <div className="flex justify-center">
              <DatabaseInitializer />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
