'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { InventorySidebar } from '@/components/inventory-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { InventoryHeader } from '@/components/inventory-header'
import { InventoryContent } from '@/components/inventory-content'
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
  const [products, setProducts] = useState(sampleProducts) // Use sample data for now
  const [currentView, setCurrentView] = useState("dashboard")
  const { user, profile, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
      router.push('/auth/login')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Error logging out')
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <InventorySidebar currentView={currentView} onViewChange={setCurrentView} products={products} />
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
          <InventoryHeader products={products} setProducts={setProducts} />
          <InventoryContent products={products} setProducts={setProducts} currentView={currentView} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
