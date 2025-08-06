'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { DataService } from '@/lib/data-service'
import { Product, ProductFormData } from '@/types/product.types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (product?: Product) => void
  product?: Product | null
  mode: 'create' | 'edit'
}

const defaultFormData: ProductFormData = {
  name: '',
  sku: '',
  description: '',
  category: '',
  quantity: 0,
  price: 0,
  supplier: '',
  minStockLevel: 0,
  maxStockLevel: 0,
  location: '',
  barcode: '',
}

const categories = [
  'Electronics',
  'Food & Beverage',
  'Office Supplies',
  'Sports & Fitness',
  'Clothing',
  'Books',
  'Home & Garden',
  'Automotive',
  'Health & Beauty',
  'Toys & Games',
  'Other'
]

export function ProductFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  product, 
  mode 
}: ProductFormModalProps) {
  const { profile } = useAuth()
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<ProductFormData>>({})

  useEffect(() => {
    if (product && mode === 'edit') {
      // Handle category and supplier that might be objects
      const categoryName = typeof product.category === 'object' ? product.category?.name : product.category
      const supplierName = typeof product.supplier === 'object' ? product.supplier?.name : product.supplier
      
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        category: categoryName || '',
        quantity: product.quantity || 0,
        price: product.price || 0,
        supplier: supplierName || '',
        minStockLevel: product.min_quantity || product.minStockLevel || 0,
        maxStockLevel: product.maxStockLevel || 0,
        location: product.location || '',
        barcode: product.barcode || '',
      })
    } else {
      setFormData(defaultFormData)
    }
    setErrors({})
  }, [product, mode, isOpen])

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6)
    const categoryCode = formData.category ? formData.category.substring(0, 2).toUpperCase().padEnd(2, 'X') : 'XX'
    const nameCode = formData.name ? formData.name.substring(0, 2).toUpperCase().padEnd(2, 'X') : 'XX'
    return `${categoryCode}${nameCode}-${timestamp}`
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ProductFormData> = {}

    console.log('Validating form data:', formData)

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (!formData.sku || !formData.sku.trim()) {
      newErrors.sku = 'SKU is required'
    }

    if (!formData.category || !formData.category.trim()) {
      newErrors.category = 'Category is required'
    }

    if (formData.quantity < 0 || isNaN(formData.quantity)) {
      newErrors.quantity = 'Quantity must be a valid number and cannot be negative'
    }

    if (formData.price <= 0 || isNaN(formData.price)) {
      newErrors.price = 'Price must be a valid number greater than 0'
    }

    if (!formData.supplier || !formData.supplier.trim()) {
      newErrors.supplier = 'Supplier is required'
    }

    if (formData.minStockLevel < 0 || isNaN(formData.minStockLevel)) {
      newErrors.minStockLevel = 'Minimum stock level must be a valid number and cannot be negative'
    }

    // Only check max vs min if both have valid values
    if (!isNaN(formData.maxStockLevel) && !isNaN(formData.minStockLevel) && formData.maxStockLevel > 0 && formData.maxStockLevel < formData.minStockLevel) {
      newErrors.maxStockLevel = 'Maximum stock level must be greater than minimum'
    }

    console.log('Validation errors:', newErrors)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile) {
      toast.error('You must be logged in to manage products.')
      return
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form.')
      return
    }

    setLoading(true)

    try {
      if (mode === 'create') {
        // Need to find category_id for the selected category name
        const categories = await DataService.getAllCategories()
        const selectedCategory = categories.find(cat => cat.name === formData.category)
        
        await DataService.createProduct({
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          category_id: selectedCategory?.id || '',
          quantity: formData.quantity,
          min_quantity: formData.minStockLevel,
          price: formData.price,
          supplier: formData.supplier,
          image_url: undefined, // Optional
        })
        toast.success('Product created successfully!')
      } else if (product) {
        // Need to find category_id for the selected category name
        const categories = await DataService.getAllCategories()
        const selectedCategory = categories.find(cat => cat.name === formData.category)
        
        await DataService.updateProduct(product.id, {
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          category_id: selectedCategory?.id || product.category_id,
          quantity: formData.quantity,
          min_quantity: formData.minStockLevel,
          price: formData.price,
          supplier: formData.supplier,
        })
        toast.success('Product updated successfully!')
      }
      
      onSubmit()
      onClose()
    } catch (error: any) {
      toast.error(error.message || `Failed to ${mode} product.`)
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (quantity: number, minStock: number): string => {
    if (quantity === 0) return 'Out of Stock'
    if (quantity <= minStock) return 'Low Stock'
    return 'In Stock'
  }

  const status = getStatus(formData.quantity, formData.minStockLevel)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Product' : 'Edit Product'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Fill in the details to add a new product to your inventory.'
              : 'Update the product information below.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="stock">Stock & Pricing</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter product name"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="sku">SKU *</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({...formData, sku: generateSKU()})}
                          disabled={!formData.name || !formData.category}
                        >
                          Generate
                        </Button>
                      </div>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        placeholder="Enter SKU"
                        className={errors.sku ? 'border-red-500' : ''}
                      />
                      {errors.sku && (
                        <p className="text-sm text-red-500">{errors.sku}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData({...formData, category: value})}
                      >
                        <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-red-500">{errors.category}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier *</Label>
                      <Input
                        id="supplier"
                        value={formData.supplier}
                        onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                        placeholder="Enter supplier name"
                        className={errors.supplier ? 'border-red-500' : ''}
                      />
                      {errors.supplier && (
                        <p className="text-sm text-red-500">{errors.supplier}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stock" className="space-y-4">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium">Current Status:</span>
                    <Badge variant={status === 'In Stock' ? 'default' : 'destructive'}>
                      {status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Current Stock *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                        className={errors.quantity ? 'border-red-500' : ''}
                      />
                      {errors.quantity && (
                        <p className="text-sm text-red-500">{errors.quantity}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Unit Price ($) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                        className={errors.price ? 'border-red-500' : ''}
                      />
                      {errors.price && (
                        <p className="text-sm text-red-500">{errors.price}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Minimum Stock Level</Label>
                      <Input
                        id="minStock"
                        type="number"
                        min="0"
                        value={formData.minStockLevel}
                        onChange={(e) => setFormData({...formData, minStockLevel: Number(e.target.value)})}
                        className={errors.minStockLevel ? 'border-red-500' : ''}
                      />
                      {errors.minStockLevel && (
                        <p className="text-sm text-red-500">{errors.minStockLevel}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxStock">Maximum Stock Level</Label>
                      <Input
                        id="maxStock"
                        type="number"
                        min="0"
                        value={formData.maxStockLevel}
                        onChange={(e) => setFormData({...formData, maxStockLevel: Number(e.target.value)})}
                        className={errors.maxStockLevel ? 'border-red-500' : ''}
                      />
                      {errors.maxStockLevel && (
                        <p className="text-sm text-red-500">{errors.maxStockLevel}</p>
                      )}
                    </div>
                  </div>

                  {formData.quantity > 0 && formData.price > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Total Value:</span> 
                        ${(formData.quantity * formData.price).toFixed(2)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Storage Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="e.g., Warehouse A, Shelf B-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                        placeholder="Enter barcode number"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading 
                ? (mode === 'create' ? 'Creating...' : 'Updating...') 
                : (mode === 'create' ? 'Create Product' : 'Update Product')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
