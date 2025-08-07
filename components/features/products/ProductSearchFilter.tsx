'use client'

import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Product, ProductFilter } from '@/types/product.types'

interface ProductSearchFilterProps {
  products: Product[]
  onFilterChange: (filteredProducts: Product[]) => void
  className?: string
}

export function ProductSearchFilter({ 
  products, 
  onFilterChange, 
  className 
}: ProductSearchFilterProps) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ProductFilter>({})

  // Get unique values for filter options
  const categories = [...new Set(products
    .map(p => typeof p.category === 'object' ? p.category?.name : p.category)
    .filter(Boolean)
    .filter(v => typeof v === 'string')
  )].sort()
  
  const statuses = [...new Set(products
    .map(p => p.status)
    .filter(Boolean)
    .filter(v => typeof v === 'string')
  )].sort()
  
  const suppliers = [...new Set(products
    .map(p => typeof p.supplier === 'object' ? p.supplier?.name : p.supplier)
    .filter(Boolean)
    .filter(v => typeof v === 'string')
  )].sort()

  const applyFilters = (newFilters: ProductFilter, searchTerm?: string) => {
    const currentSearch = searchTerm !== undefined ? searchTerm : search
    let filtered = products

    // Apply search
    if (currentSearch.trim()) {
      const searchLower = currentSearch.toLowerCase()
      filtered = filtered.filter(product => {
        const categoryName = typeof product.category === 'object' ? product.category?.name : product.category
        const supplierName = typeof product.supplier === 'object' ? product.supplier?.name : product.supplier
        
        return (
          product.name.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower) ||
          (categoryName && categoryName.toLowerCase().includes(searchLower)) ||
          (supplierName && supplierName.toLowerCase().includes(searchLower)) ||
          (product.description?.toLowerCase().includes(searchLower))
        )
      })
    }

    // Apply filters
    if (newFilters.category) {
      filtered = filtered.filter(p => {
        const categoryName = typeof p.category === 'object' ? p.category?.name : p.category
        return categoryName === newFilters.category
      })
    }

    if (newFilters.status) {
      filtered = filtered.filter(p => p.status === newFilters.status)
    }

    if (newFilters.supplier) {
      filtered = filtered.filter(p => {
        const supplierName = typeof p.supplier === 'object' ? p.supplier?.name : p.supplier
        return supplierName === newFilters.supplier
      })
    }

    if (newFilters.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= newFilters.minPrice!)
    }

    if (newFilters.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= newFilters.maxPrice!)
    }

    onFilterChange(filtered)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    applyFilters(filters, value)
  }

  const handleFilterChange = (key: keyof ProductFilter, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    applyFilters(newFilters)
  }

  const clearFilter = (key: keyof ProductFilter) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    setFilters(newFilters)
    applyFilters(newFilters)
  }

  const clearAllFilters = () => {
    setSearch('')
    setFilters({})
    onFilterChange(products)
  }

  const hasActiveFilters = search || Object.keys(filters).some(key => filters[key as keyof ProductFilter])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search products by name, SKU, category, or supplier..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-4"
        />
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Category Filter */}
        <Select value={filters.category || ''} onValueChange={(value) => handleFilterChange('category', value === 'all-categories' ? undefined : value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-categories">All Categories</SelectItem>
            {categories.map((category, index) => (
              <SelectItem key={`category-${category}-${index}`} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value === 'all-status' ? undefined : value)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-status">All Status</SelectItem>
            {statuses.map((status, index) => (
              <SelectItem key={`status-${status}-${index}`} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Supplier Filter */}
        <Select value={filters.supplier || ''} onValueChange={(value) => handleFilterChange('supplier', value === 'all-suppliers' ? undefined : value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-suppliers">All Suppliers</SelectItem>
            {suppliers.map((supplier, index) => (
              <SelectItem key={`supplier-${supplier}-${index}`} value={supplier}>
                {supplier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Price Range
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Price Range</h4>
                <p className="text-sm text-muted-foreground">
                  Set the price range for filtering products.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="minPrice">Min</Label>
                  <Input
                    id="minPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={filters.minPrice || ''}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                    className="col-span-2"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxPrice">Max</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="999.99"
                    value={filters.maxPrice || ''}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                    className="col-span-2"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {Object.entries(filters).length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Active filters:</span>
          {filters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {filters.category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('category')}
              />
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('status')}
              />
            </Badge>
          )}
          {filters.supplier && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Supplier: {filters.supplier}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('supplier')}
              />
            </Badge>
          )}
          {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Price: ${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  clearFilter('minPrice')
                  clearFilter('maxPrice')
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
