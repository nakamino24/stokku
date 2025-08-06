import { Product, ProductFormData, ProductStats } from '@/types/product.types'
import { databaseService } from '@/lib/database.service'

export class ProductService {
  static generateSKU(name: string, category: string): string {
    const timestamp = Date.now().toString().slice(-6)
    const categoryCode = category.substring(0, 2).toUpperCase()
    const nameCode = name.substring(0, 2).toUpperCase()
    return `${categoryCode}${nameCode}-${timestamp}`
  }

  static calculateStatus(quantity: number, minStockLevel?: number): Product['status'] {
    if (quantity === 0) return 'Out of Stock'
    if (minStockLevel && quantity <= minStockLevel) return 'Low Stock'
    return 'In Stock'
  }

  static async getAllProducts(): Promise<Product[]> {
    try {
      return await databaseService.getProducts()
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  static async createProduct(productData: ProductFormData): Promise<void> {
    try {
      const productToCreate = {
        name: productData.name,
        sku: productData.sku,
        description: productData.description,
        category: productData.category,
        quantity: productData.quantity,
        price: productData.price,
        supplier: productData.supplier,
      }

      await databaseService.createProduct(productToCreate)
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  static async updateProduct(id: string, productData: Partial<ProductFormData>): Promise<void> {
    try {
      await databaseService.updateProduct(id, productData)
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  static async deleteProduct(id: string): Promise<void> {
    try {
      await databaseService.deleteProduct(id)
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  static calculateStats(products: Product[]): ProductStats {
    const totalProducts = products.length
    const totalValue = products.reduce((sum, product) => sum + (product.quantity * product.price), 0)
    const lowStockCount = products.filter(p => p.status === 'Low Stock').length
    const outOfStockCount = products.filter(p => p.status === 'Out of Stock').length

    // Calculate category counts
    const categoryCounts = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate supplier counts
    const supplierCounts = products.reduce((acc, product) => {
      acc[product.supplier] = (acc[product.supplier] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      categoryCounts,
      supplierCounts,
    }
  }

  static searchProducts(products: Product[], searchTerm: string): Product[] {
    if (!searchTerm.trim()) return products

    const term = searchTerm.toLowerCase()
    return products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term) ||
      product.supplier.toLowerCase().includes(term) ||
      (product.description?.toLowerCase().includes(term))
    )
  }

  static filterProducts(products: Product[], filters: {
    category?: string
    status?: string
    supplier?: string
    minPrice?: number
    maxPrice?: number
  }): Product[] {
    return products.filter(product => {
      if (filters.category && product.category !== filters.category) return false
      if (filters.status && product.status !== filters.status) return false
      if (filters.supplier && product.supplier !== filters.supplier) return false
      if (filters.minPrice !== undefined && product.price < filters.minPrice) return false
      if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false
      return true
    })
  }

  static sortProducts(products: Product[], sortBy: keyof Product, direction: 'asc' | 'desc' = 'asc'): Product[] {
    return [...products].sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal
      }

      return 0
    })
  }

  static exportToCSV(products: Product[]): string {
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Quantity', 'Price', 'Supplier', 'Status', 'Last Updated']
    
    const csvContent = [
      headers.join(','),
      ...products.map(product => [
        product.id,
        `"${product.name}"`,
        product.sku,
        `"${product.category}"`,
        product.quantity,
        product.price,
        `"${product.supplier}"`,
        product.status,
        product.lastUpdated
      ].join(','))
    ].join('\n')

    return csvContent
  }

  static downloadCSV(products: Product[], filename: string = 'products.csv'): void {
    const csv = this.exportToCSV(products)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  static validateProduct(productData: Partial<ProductFormData>): string[] {
    const errors: string[] = []

    if (!productData.name?.trim()) {
      errors.push('Product name is required')
    }

    if (!productData.sku?.trim()) {
      errors.push('SKU is required')
    }

    if (!productData.category?.trim()) {
      errors.push('Category is required')
    }

    if (productData.quantity !== undefined && productData.quantity < 0) {
      errors.push('Quantity cannot be negative')
    }

    if (productData.price !== undefined && productData.price <= 0) {
      errors.push('Price must be greater than 0')
    }

    if (!productData.supplier?.trim()) {
      errors.push('Supplier is required')
    }

    if (productData.minStockLevel !== undefined && productData.minStockLevel < 0) {
      errors.push('Minimum stock level cannot be negative')
    }

    if (
      productData.maxStockLevel !== undefined && 
      productData.minStockLevel !== undefined &&
      productData.maxStockLevel < productData.minStockLevel
    ) {
      errors.push('Maximum stock level must be greater than minimum')
    }

    return errors
  }
}
