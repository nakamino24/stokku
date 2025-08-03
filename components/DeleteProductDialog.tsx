import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { databaseService } from '@/lib/database.service';

interface DeleteProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onProductDelete: () => void;
}

export function DeleteProductDialog({ isOpen, onClose, productId, onProductDelete }: DeleteProductDialogProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDeleteProduct = async () => {
    if (!profile) {
      toast.error('You must be logged in to delete products.');
      return;
    }

    setLoading(true);

    try {
      await databaseService.deleteProduct(productId);
      toast.success('Product deleted successfully!');
      onProductDelete();
      onClose();
    } catch (error) {
      toast.error('Failed to delete product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to delete this product? This action cannot be undone.</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleDeleteProduct} disabled={loading} variant="destructive">
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

