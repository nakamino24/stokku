"use client"

import { Product } from "@/types/product.types"
import { ProductsTable } from "@/components/features/products"
import { DashboardOverview } from "@/components/features/dashboard"
import { ReportsView } from "@/components/features/reports"

interface InventoryContentProps {
  products: Product[];
  currentView: string;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
}

export function InventoryContent({
  products,
  currentView,
  onEditProduct,
  onDeleteProduct,
  onViewProduct,
}: InventoryContentProps) {
  const getFilteredProducts = () => {
    switch (currentView) {
      case "low-stock":
        return products.filter((p) => p.status === "Low Stock")
      case "out-of-stock":
        return products.filter((p) => p.status === "Out of Stock")
      default:
        return products
    }
  }

  const getViewTitle = () => {
    switch (currentView) {
      case "dashboard":
        return "Dashboard Overview"
      case "all-products":
        return "All Products"
      case "low-stock":
        return "Low Stock Items"
      case "out-of-stock":
        return "Out of Stock Items"
      case "sales-report":
        return "Sales Report"
      case "stock-movement":
        return "Stock Movement Report"
      case "supplier-report":
        return "Supplier Report"
      default:
        return "Inventory Management"
    }
  }

  if (currentView === "dashboard") {
    return (
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{getViewTitle()}</h1>
          <p className="text-sm text-gray-600 mt-1">Monitor your inventory performance and key metrics</p>
        </div>
        <DashboardOverview products={products} />
      </main>
    )
  }

  if (currentView.includes("report")) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{getViewTitle()}</h1>
          <p className="text-sm text-gray-600 mt-1">Analyze your inventory data and trends</p>
        </div>
        <ReportsView reportType={currentView} products={products} />
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{getViewTitle()}</h1>
        <p className="text-sm text-gray-600 mt-1">{getFilteredProducts().length} items</p>
      </div>
      <ProductsTable
        products={getFilteredProducts()}
        onEdit={onEditProduct}
        onDelete={onDeleteProduct}
        onView={onViewProduct}
      />
    </main>
  )
}
