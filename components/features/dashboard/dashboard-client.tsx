'use client'

import { Product } from "@/types/product.types"
import { ProductFormModal, ProductDetailsModal } from "@/components/features/products"
import { DeleteConfirmDialog } from "@/components/features/products/DeleteConfirmDialog"
import { DataService } from '@/lib/data-service'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { InventorySidebar, InventoryHeader, InventoryContent } from '@/components/features/inventory'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { ProductSearchFilter } from '@/components/features/products'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Shield, User } from 'lucide-react'
import { toast } from 'sonner'

// Sample inventory data (you can replace this with real data from Supabase)
const sampleProducts = [
  {
    id: "1",
    name: "Wireless Headphones",
    sku: "WH-001",
    category: "Electronics",
    quantity: 45,
    price: 79.99,
    supplier: "TechCorp",
    lastUpdated: "2024-01-15",
    status: "In Stock",
    image: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "2",
    name: "Coffee Beans - Premium Blend",
    sku: "CB-002",
    category: "Food & Beverage",
    quantity: 12,
    price: 24.99,
    supplier: "Bean Masters",
    lastUpdated: "2024-01-14",
    status: "Low Stock",
    image: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "3",
    name: "Desk Lamp - LED",
    sku: "DL-003",
    category: "Office Supplies",
    quantity: 0,
    price: 34.99,
    supplier: "Office Plus",
    lastUpdated: "2024-01-13",
    status: "Out of Stock",
    image: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "4",
    name: "Yoga Mat - Premium",
    sku: "YM-004",
    category: "Sports & Fitness",
    quantity: 28,
    price: 49.99,
    supplier: "FitGear Co",
    lastUpdated: "2024-01-12",
    status: "In Stock",
    image: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "5",
    name: "Bluetooth Speaker",
    sku: "BS-005",
    category: "Electronics",
    quantity: 8,
    price: 89.99,
    supplier: "AudioTech",
    lastUpdated: "2024-01-11",
    status: "Low Stock",
    image: "/placeholder.svg?height=40&width=40",
  },
]

export function DashboardClient() {
  const [products, setProducts] = useState<Product[]>([])  // Start with empty array
  const [currentView, setCurrentView] = useState("dashboard")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [loading, setLoading] = useState(true)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const { user, profile, signOut } = useAuth();
  const router = useRouter()

  // Load products on component mount
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await DataService.getAllProducts()
      setProducts(data)
      setFilteredProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
      router.push('/')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Error logging out')
    }
  }

  const handleAddProduct = () => {
    setFormMode('create')
    setSelectedProduct(null)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (product?: Product) => {
    if (product) {
      try {
        if (formMode === 'create') {
          await DataService.createProduct(product)
          toast.success('Product created successfully')
        } else if (formMode === 'edit') {
          await DataService.updateProduct(product.id, product)
          toast.success('Product updated successfully')
        }
        await loadProducts() // Reload products
      } catch (error) {
        console.error('Error saving product:', error)
        toast.error('Failed to save product')
      }
    }
    setIsFormOpen(false)
  }

  const handleEditProduct = (product: Product) => {
    setFormMode('edit')
    setSelectedProduct(product)
    setIsFormOpen(true)
  }

  const handleDeleteProduct = (product: Product) => {
    setDeleteProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteProduct = async () => {
    if (!deleteProduct) return
    
    try {
      await DataService.deleteProduct(deleteProduct.id)
      await loadProducts() // Reload products
      setIsDetailsOpen(false) // Close details modal
      toast.success('Product deleted successfully')
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    } finally {
      setIsDeleteDialogOpen(false)
      setDeleteProduct(null)
    }
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDetailsOpen(true)
  }

  const handleImportProducts = async (importedProducts: Product[]) => {
    try {
      // Create each imported product in the database
      for (const product of importedProducts) {
        await DataService.createProduct(product)
      }
      await loadProducts() // Reload products
      toast.success(`Successfully imported ${importedProducts.length} products`)
    } catch (error) {
      console.error('Error importing products:', error)
      toast.error('Failed to import some products')
    }
  }

  return (
    <>
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen w-full">
          <InventorySidebar
            currentView={currentView}
            onViewChange={setCurrentView}
            products={products}
            onAddProduct={handleAddProduct}
          />
          <SidebarInset className="flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-white">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Welcome, {profile?.full_name || user?.email}</h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-gray-600">{user?.email}</p>
                    <Badge
                      variant={profile?.role === 'admin' ? 'default' : 'secondary'}
                      className={profile?.role === 'admin' ? 'bg-blue-100 text-blue-800' : ''}
                    >
                      {profile?.role === 'admin' ? (
                        <><Shield className="h-3 w-3 mr-1" />Admin</>
                      ) : (
                        <><User className="h-3 w-3 mr-1" />User</>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
            <div className="p-4 bg-gray-50/50">
              <ProductSearchFilter products={products} onFilterChange={setFilteredProducts} />
            </div>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                  <p className="text-xs text-gray-500 mt-2">Data source: {DataService.getDataSource()}</p>
                </div>
              </div>
            ) : (
              <InventoryContent 
                products={filteredProducts} 
                currentView={currentView} 
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                onViewProduct={handleViewProduct}
                onImport={handleImportProducts}
              />
            )}
          </SidebarInset>
        </div>
      </SidebarProvider>

      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        product={selectedProduct}
        mode={formMode}
      />

      <ProductDetailsModal
        product={selectedProduct}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        canEdit={profile?.role === 'admin'}
      />

      <DeleteConfirmDialog
        product={deleteProduct}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setDeleteProduct(null)
        }}
        onConfirm={confirmDeleteProduct}
      />
    </>
  )
}
