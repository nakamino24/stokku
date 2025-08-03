'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { databaseService } from '@/lib/database.service'

interface AddTransactionDialogProps {
  isOpen: boolean
  onClose: () => void
  onTransactionAdd: () => void
  products: any[]
}

export function AddTransactionDialog({ 
  isOpen, 
  onClose, 
  onTransactionAdd, 
  products 
}: AddTransactionDialogProps) {
  const { user } = useAuth()
  const [productId, setProductId] = useState('')
  const [type, setType] = useState<'in' | 'out'>('in')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddTransaction = async () => {
    if (!user) {
      toast.error('You must be logged in to add transactions.')
      return
    }

    if (!productId || !reason) {
      toast.error('Please fill in all required fields.')
      return
    }

    setLoading(true)

    try {
      // Add transaction
      await databaseService.createTransaction({
        product_id: productId,
        type,
        quantity,
        reason,
        notes,
        created_by: user.id,
      })

      // Update product stock
      const product = products.find(p => p.id === productId)
      if (product) {
        const newQuantity = type === 'in' 
          ? product.quantity + quantity 
          : Math.max(0, product.quantity - quantity)
        
        await databaseService.updateProduct(productId, {
          quantity: newQuantity
        })
      }

      toast.success('Transaction added successfully!')
      onTransactionAdd()
      onClose()
      
      // Reset form
      setProductId('')
      setType('in')
      setQuantity(1)
      setReason('')
      setNotes('')
      
    } catch (error) {
      toast.error('Failed to add transaction.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="product">Product *</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} (Stock: {product.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Transaction Type *</Label>
            <Select value={type} onValueChange={(value: 'in' | 'out') => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="out">Stock Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={1}
              required
            />
          </div>

          <div>
            <Label htmlFor="reason">Reason *</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Purchase, Sale, Return, Damage"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAddTransaction} disabled={loading}>
            {loading ? 'Adding...' : 'Add Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
