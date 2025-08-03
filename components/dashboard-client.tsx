'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { InventorySidebar } from '@/components/inventory-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { InventoryHeader } from '@/components/inventory-header'
import { InventoryContent } from '@/components/inventory-content'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
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

interface DashboardClientProps {
  user: any
  initialProducts: any[]
  initialCategories: any[]
  initialTransactions: any[]
}

export function DashboardClient({ 
  user, 
  initialProducts, 
  initialCategories, 
  initialTransactions 
}: DashboardClientProps) {
  const [products, setProducts] = useState(sampleProducts) // Use sample data for now
  const [currentView, setCurrentView] = useState("all-products")
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error('Error logging out')
      } else {
        toast.success('Logged out successfully')
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <InventorySidebar currentView={currentView} onViewChange={setCurrentView} products={products} />
        <SidebarInset className="flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <div>
              <h1 className="text-xl font-semibold">Welcome, {user.email}</h1>
              <p className="text-sm text-gray-600">Manage your inventory</p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          <InventoryHeader products={products} setProducts={setProducts} />
          <InventoryContent products={products} setProducts={setProducts} currentView={currentView} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
