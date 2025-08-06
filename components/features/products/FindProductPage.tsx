'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  Search, 
  Filter, 
  Package, 
  Eye,
  Edit,
  Trash2,
  SlidersHorizontal
} from 'lucide-react'
import { Product } from '@/types/product.types'

interface FindProductPageProps {
  products: Product[]
  onViewProduct: (product: Product) => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (product: Product) => void
  canEdit?: boolean
}

export function FindProductPage({ 
  products, 
  onViewProduct, 
  onEditProduct, 
  onDeleteProduct,
  canEdit = true 
}: FindProductPageProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [quantityRange, setQuantityRange] = useState({ min: '', max: '' })

  // Get unique categories and suppliers for filters
  const categories = useMemo(() => 
    Array.from(new Set(products
      .map(p => typeof p.category === 'object' ? p.category?.name : p.category)
      .filter(Boolean)
      .filter(c => typeof c === 'string')
    )).sort(),
    [products]
  )
  
  const suppliers = useMemo(() => 
    Array.from(new Set(products
      .map(p => typeof p.supplier === 'object' ? p.supplier?.name : p.supplier)
      .filter(Boolean)
      .filter(s => typeof s === 'string')
    )).sort(),
    [products]
  )

  // Filter products based on search criteria
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search term filter
      const supplierName = typeof product.supplier === 'object' ? product.supplier?.name : product.supplier
      const matchesSearch = searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplierName && supplierName.toLowerCase().includes(searchTerm.toLowerCase()))

      // Category filter
      const categoryName = typeof product.category === 'object' ? product.category?.name : product.category
      const matchesCategory = categoryFilter === 'all' || categoryName === categoryFilter

      // Status filter
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter

      // Supplier filter
      const matchesSupplier = supplierFilter === 'all' || supplierName === supplierFilter

      // Price range filter
      const matchesPrice = 
        (priceRange.min === '' || product.price >= parseFloat(priceRange.min)) &&
        (priceRange.max === '' || product.price <= parseFloat(priceRange.max))

      // Quantity range filter
      const matchesQuantity = 
        (quantityRange.min === '' || product.quantity >= parseInt(quantityRange.min)) &&
        (quantityRange.max === '' || product.quantity <= parseInt(quantityRange.max))

      return matchesSearch && matchesCategory && matchesStatus && 
             matchesSupplier && matchesPrice && matchesQuantity
    })
  }, [products, searchTerm, categoryFilter, statusFilter, supplierFilter, priceRange, quantityRange])

  const clearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setSupplierFilter('all')
    setPriceRange({ min: '', max: '' })
    setQuantityRange({ min: '', max: '' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800'
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800'
      case 'Out of Stock':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Find Products</h1>
        <p className="text-sm text-gray-600">
          Search and filter through your inventory with advanced criteria
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by product name, SKU, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category, index) => (
                    <SelectItem key={`find-category-${category}-${index}`} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Supplier</label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map((supplier, index) => (
                    <SelectItem key={`find-supplier-${supplier}-${index}`} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Row 2 - Price and Quantity Ranges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Price Range</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Quantity Range</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={quantityRange.min}
                  onChange={(e) => setQuantityRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={quantityRange.max}
                  onChange={(e) => setQuantityRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Search Results
            </CardTitle>
            <Badge variant="secondary">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or clear filters to see more results.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.image || '/placeholder.svg'}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-medium">{product.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        {typeof product.category === 'object' ? product.category?.name || 'N/A' : product.category}
                      </TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {typeof product.supplier === 'object' ? product.supplier?.name || 'N/A' : product.supplier}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(product.status)}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewProduct(product)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteProduct(product)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
