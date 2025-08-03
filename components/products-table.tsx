"use client"
import { useState } from "react"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditProductDialog } from "@/components/EditProductDialog"
import { DeleteProductDialog } from "@/components/DeleteProductDialog"
import { useAuth } from "@/contexts/AuthContext"

interface ProductsTableProps {
  products: any[]
  setProducts: (products: any[]) => void
  allProducts: any[]
}

export function ProductsTable({ products, setProducts, allProducts }: ProductsTableProps) {
  const { profile } = useAuth()
  const [editProduct, setEditProduct] = useState<any>(null)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  
  const handleProductUpdate = () => {
    // Refresh products - this would typically refetch from the database
    // For now, we'll just close the dialog
    setEditProduct(null)
  }
  
  const handleProductDelete = () => {
    if (deleteProductId) {
      const updatedProducts = allProducts.filter((p) => p.id !== deleteProductId)
      setProducts(updatedProducts)
      setDeleteProductId(null)
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "In Stock":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            In Stock
          </Badge>
        )
      case "Low Stock":
        return (
          <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Low Stock
          </Badge>
        )
      case "Out of Stock":
        return <Badge variant="destructive">Out of Stock</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleDeleteProduct = (productId: string) => {
    const updatedProducts = allProducts.filter((p) => p.id !== productId)
    setProducts(updatedProducts)
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12"></TableHead>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-gray-50">
              <TableCell>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={product.image || "/placeholder.svg"} alt={product.name} />
                  <AvatarFallback className="text-xs">{product.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="font-mono text-sm">{product.sku}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell className="text-right font-mono">{product.quantity}</TableCell>
              <TableCell className="text-right font-mono">${product.price}</TableCell>
              <TableCell>{product.supplier}</TableCell>
              <TableCell>{getStatusBadge(product.status)}</TableCell>
              <TableCell className="text-sm text-gray-600">{product.lastUpdated}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {profile?.role === 'admin' && (
                      <DropdownMenuItem onClick={() => setEditProduct(product)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Product
                      </DropdownMenuItem>
                    )}
                    {profile?.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => setDeleteProductId(product.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Edit Product Dialog */}
      {editProduct && (
        <EditProductDialog
          isOpen={!!editProduct}
          onClose={() => setEditProduct(null)}
          product={editProduct}
          onProductUpdate={handleProductUpdate}
        />
      )}
      
      {/* Delete Product Dialog */}
      {deleteProductId && (
        <DeleteProductDialog
          isOpen={!!deleteProductId}
          onClose={() => setDeleteProductId(null)}
          productId={deleteProductId}
          onProductDelete={handleProductDelete}
        />
      )}
    </div>
  )
}
