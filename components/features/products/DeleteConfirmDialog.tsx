'use client'

import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { Product } from "@/types/product.types"

interface DeleteConfirmDialogProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({ 
  product, 
  isOpen, 
  onClose, 
  onConfirm 
}: DeleteConfirmDialogProps) {
  if (!product) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{product.name}"? This action cannot be undone.
            <br /><br />
            <strong>Product Details:</strong>
            <br />• SKU: {product.sku}
            <br />• Current Stock: {product.quantity}
            <br />• Value: ${(product.quantity * product.price).toFixed(2)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Delete Product
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
