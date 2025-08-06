"use client"

import { useState } from "react"
import { Search, Plus, Download, Upload, Filter, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddProductDialog } from "@/components/add-product-dialog"

interface InventoryHeaderProps {
  products: any[]
  setProducts: (products: any[]) => void
}

export function InventoryHeader({ products, setProducts }: InventoryHeaderProps) {
  const [showAddProduct, setShowAddProduct] = useState(false)

  const handleExportCSV = () => {
    const headers = ["Name", "SKU", "Category", "Quantity", "Price", "Supplier", "Status"]
    const csvContent = [
      headers.join(","),
      ...products.map((product) =>
        [
          `"${product.name}"`,
          product.sku,
          `"${product.category}"`,
          product.quantity,
          product.price,
          `"${product.supplier}"`,
          `"${product.status}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "inventory-export.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />

      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products, SKUs, or categories..." className="pl-9" />
        </div>

        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => setShowAddProduct(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Upload className="h-4 w-4 mr-2" />
              Import from CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AddProductDialog
        open={showAddProduct}
        onOpenChange={setShowAddProduct}
        onAddProduct={(newProduct) => {
          setProducts([...products, { ...newProduct, id: Date.now().toString() }])
        }}
      />
    </header>
  )
}
