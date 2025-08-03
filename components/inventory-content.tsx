"use client"

import { ProductsTable } from "@/components/products-table"
import { DashboardOverview } from "@/components/dashboard-overview"
import { ReportsView } from "@/components/reports-view"

interface InventoryContentProps {
  products: any[]
  setProducts: (products: any[]) => void
  currentView: string
}

export function InventoryContent({ products, setProducts, currentView }: InventoryContentProps) {
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
      <ProductsTable products={getFilteredProducts()} setProducts={setProducts} allProducts={products} />
    </main>
  )
}
