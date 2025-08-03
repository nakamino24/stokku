"use client"

import { useState } from "react"
import { InventorySidebar } from "@/components/inventory-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { InventoryHeader } from "@/components/inventory-header"
import { InventoryContent } from "@/components/inventory-content"

// Sample inventory data
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

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to Stokku
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please <a href="/auth/login" className="text-blue-600 hover:underline">sign in</a> to access your inventory
          </p>
        </div>
      </div>
    </div>
  )
}
