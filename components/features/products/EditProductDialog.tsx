import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { databaseService } from '@/lib/database.service';

interface EditProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onProductUpdate: () => void;
}

export function EditProductDialog({ isOpen, onClose, product, onProductUpdate }: EditProductDialogProps) {
  const { profile } = useAuth();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [stock, setStock] = useState(product.quantity);
  const [price, setPrice] = useState(product.price);
  const [loading, setLoading] = useState(false);

  const handleUpdateProduct = async () => {
    if (!profile) {
      toast.error('You must be logged in to edit products.');
      return;
    }

    setLoading(true);

    try {
      await databaseService.updateProduct(product.id, {
        name,
        description,
        quantity: stock,
        price,
      });
      toast.success('Product updated successfully!');
      onProductUpdate();
      onClose();
    } catch (error) {
      toast.error('Failed to update product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdateProduct} disabled={loading}>
            {loading ? 'Updating...' : 'Update Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

