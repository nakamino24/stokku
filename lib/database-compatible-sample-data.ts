import { Product, Category } from "@/types/product.types"

// Sample categories matching Supabase schema
export const sampleCategories: Category[] = [
  {
    id: "cat-1",
    name: "Electronics",
    description: "Electronic devices and accessories",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:00:00Z",
  },
  {
    id: "cat-2", 
    name: "Food & Beverage",
    description: "Food products and beverages",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:00:00Z",
  },
  {
    id: "cat-3",
    name: "Office Supplies",
    description: "Office equipment and supplies",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:00:00Z",
  },
  {
    id: "cat-4",
    name: "Sports & Fitness",
    description: "Sports equipment and fitness gear",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:00:00Z",
  },
]

// Sample products matching Supabase schema structure
export const sampleProductsDB: Product[] = [
  {
    id: "prod-1",
    name: "Wireless Headphones",
    sku: "WH-001",
    description: "Premium wireless headphones with noise cancellation",
    category_id: "cat-1",
    category: sampleCategories[0],
    supplier: "TechCorp",
    image_url: "/placeholder.svg?height=40&width=40",
    quantity: 45,
    min_quantity: 10,
    price: 79.99,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    status: "In Stock",
    // Legacy compatibility
    image: "/placeholder.svg?height=40&width=40",
    lastUpdated: "2024-01-15",
  },
  {
    id: "prod-2",
    name: "Coffee Beans - Premium Blend",
    sku: "CB-002",
    description: "High-quality coffee beans from Colombia",
    category_id: "cat-2",
    category: sampleCategories[1],
    supplier: "Bean Masters",
    image_url: "/placeholder.svg?height=40&width=40",
    quantity: 12,
    min_quantity: 20,
    price: 24.99,
    created_at: "2024-01-14T10:00:00Z",
    updated_at: "2024-01-14T10:00:00Z",
    status: "Low Stock",
    // Legacy compatibility
    image: "/placeholder.svg?height=40&width=40",
    lastUpdated: "2024-01-14",
  },
  {
    id: "prod-3",
    name: "Desk Lamp - LED",
    sku: "DL-003",
    description: "Energy-efficient LED desk lamp with adjustable brightness",
    category_id: "cat-3",
    category: sampleCategories[2],
    supplier: "Office Plus",
    image_url: "/placeholder.svg?height=40&width=40",
    quantity: 0,
    min_quantity: 5,
    price: 34.99,
    created_at: "2024-01-13T10:00:00Z",
    updated_at: "2024-01-13T10:00:00Z",
    status: "Out of Stock",
    // Legacy compatibility
    image: "/placeholder.svg?height=40&width=40",
    lastUpdated: "2024-01-13",
  },
  {
    id: "prod-4",
    name: "Yoga Mat - Premium",
    sku: "YM-004",
    description: "Non-slip premium yoga mat for all types of exercises",
    category_id: "cat-4",
    category: sampleCategories[3],
    supplier: "FitGear Co",
    image_url: "/placeholder.svg?height=40&width=40",
    quantity: 28,
    min_quantity: 15,
    price: 49.99,
    created_at: "2024-01-12T10:00:00Z",
    updated_at: "2024-01-12T10:00:00Z",
    status: "In Stock",
    // Legacy compatibility
    image: "/placeholder.svg?height=40&width=40",
    lastUpdated: "2024-01-12",
  },
  {
    id: "prod-5",
    name: "Bluetooth Speaker",
    sku: "BS-005",
    description: "Portable Bluetooth speaker with superior sound quality",
    category_id: "cat-1",
    category: sampleCategories[0],
    supplier: "AudioTech",
    image_url: "/placeholder.svg?height=40&width=40",
    quantity: 8,
    min_quantity: 12,
    price: 89.99,
    created_at: "2024-01-11T10:00:00Z",
    updated_at: "2024-01-11T10:00:00Z",
    status: "Low Stock",
    // Legacy compatibility
    image: "/placeholder.svg?height=40&width=40",
    lastUpdated: "2024-01-11",
  },
]

// Helper function to compute product status
export function computeProductStatus(quantity: number, minQuantity: number): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (quantity === 0) return 'Out of Stock'
  if (quantity <= minQuantity) return 'Low Stock'
  return 'In Stock'
}

// Helper to convert old format to new format
export function adaptLegacyProduct(legacyProduct: any): Product {
  return {
    ...legacyProduct,
    category_id: legacyProduct.category_id || `cat-${Math.floor(Math.random() * 4) + 1}`,
    min_quantity: legacyProduct.minStockLevel || legacyProduct.min_quantity || 10,
    image_url: legacyProduct.image || legacyProduct.image_url,
    created_at: legacyProduct.createdAt || legacyProduct.created_at || new Date().toISOString(),
    updated_at: legacyProduct.updatedAt || legacyProduct.updated_at || new Date().toISOString(),
    status: legacyProduct.status || computeProductStatus(
      legacyProduct.quantity,
      legacyProduct.minStockLevel || legacyProduct.min_quantity || 10
    ),
    // Keep legacy fields for backward compatibility
    image: legacyProduct.image || legacyProduct.image_url,
    lastUpdated: legacyProduct.lastUpdated || legacyProduct.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  }
}
