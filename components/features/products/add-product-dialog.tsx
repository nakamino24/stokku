"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataService } from '@/lib/data-service'
import { toast } from 'sonner'

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddProduct: (product: any) => void
}

export function AddProductDialog({ open, onOpenChange, onAddProduct }: AddProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    quantity: "",
    price: "",
    supplier: "",
  })
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  // Load available categories when modal opens
  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open])

  const loadCategories = async () => {
    setCategoriesLoading(true)
    try {
      const categories = await DataService.getAllCategories()
      setAvailableCategories(categories.map(cat => cat.name))
    } catch (error) {
      console.error('Failed to load categories:', error)
      toast.error('Failed to load categories. Please try again.')
      // Fallback to default categories if loading fails
      setAvailableCategories([
        'Electronics',
        'Food & Beverage',
        'Office Supplies', 
        'Sports & Fitness',
        'Clothing',
        'Home & Garden'
      ])
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newProduct = {
      ...formData,
      quantity: Number.parseInt(formData.quantity) || 0,
      price: Number.parseFloat(formData.price) || 0,
      lastUpdated: new Date().toISOString().split("T")[0],
      status:
        Number.parseInt(formData.quantity) > 10
          ? "In Stock"
          : Number.parseInt(formData.quantity) > 0
            ? "Low Stock"
            : "Out of Stock",
      image: `/placeholder.svg?height=40&width=40&query=${encodeURIComponent(formData.name)}`,
    }

    onAddProduct(newProduct)
    setFormData({
      name: "",
      sku: "",
      category: "",
      quantity: "",
      price: "",
      supplier: "",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Enter the details for your new product. All fields are required.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">
                SKU
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading ? (
                    <SelectItem value="" disabled>
                      Loading categories...
                    </SelectItem>
                  ) : availableCategories.length > 0 ? (
                    availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No categories available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier" className="text-right">
                Supplier
              </Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
