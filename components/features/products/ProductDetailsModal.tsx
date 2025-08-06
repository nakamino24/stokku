'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Package, 
  DollarSign, 
  Calendar, 
  MapPin, 
  User, 
  BarChart3,
  Hash,
  FileText,
  Truck
} from "lucide-react"
import { Product } from "@/types/product.types"

interface ProductDetailsModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (product: Product) => void
  onDelete?: (product: Product) => void
  canEdit?: boolean
}

export function ProductDetailsModal({ 
  product, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  canEdit = false 
}: ProductDetailsModalProps) {
  if (!product) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "Low Stock":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "Out of Stock":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={product.image || "/placeholder.svg"} alt={product.name} />
              <AvatarFallback className="text-sm">
                {product.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-sm text-gray-500 font-mono">{product.sku}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Quick Actions */}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(product.status)}>{product.status}</Badge>
            {canEdit && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onEdit?.(product)}>
                  Edit Product
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => onDelete?.(product)}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Main Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">SKU</p>
                    <p className="font-mono">{product.sku}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-sm">{product.description || 'No description available'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p>{product.category}</p>
                  </div>
                </div>

                {product.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p>{product.location}</p>
                    </div>
                  </div>
                )}

                {product.barcode && (
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Barcode</p>
                      <p className="font-mono text-sm">{product.barcode}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stock & Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" />
                  Stock & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Current Stock</p>
                    <p className="text-2xl font-bold">{product.quantity}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Unit Price</p>
                    <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Total Value</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${(product.quantity * product.price).toFixed(2)}
                    </p>
                  </div>
                </div>

                {(product.minStockLevel || product.maxStockLevel) && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Stock Levels</p>
                    <div className="flex justify-between text-sm">
                      {product.minStockLevel && (
                        <span>Min: <strong>{product.minStockLevel}</strong></span>
                      )}
                      {product.maxStockLevel && (
                        <span>Max: <strong>{product.maxStockLevel}</strong></span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supplier Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" />
                  Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Supplier</p>
                    <p className="font-medium">{product.supplier}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="text-sm">{product.lastUpdated}</p>
                  </div>
                </div>
                {product.createdAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="text-sm">{product.createdAt}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
