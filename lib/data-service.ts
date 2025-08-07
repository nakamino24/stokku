import { SupabaseService } from './supabase-database.service'
import { sampleProductsDB, sampleCategories } from './database-compatible-sample-data'
import { Product, Category, Transaction } from '@/types/product.types'
import { 
  Supplier, 
  PurchaseTransaction, 
  CreateSupplierRequest, 
  UpdateSupplierRequest,
  CreatePurchaseTransactionRequest,
  UpdatePurchaseTransactionRequest,
  SupplierStats 
} from '@/types/supplier.types'

// Configuration: Set to true to use Supabase, false to use sample data
// Now using Supabase by default for real data
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE !== 'false'

export class DataService {
  
  // Product operations
  static async getAllProducts(): Promise<Product[]> {
    if (USE_SUPABASE) {
      return await SupabaseService.getAllProducts()
    }
    
    // Return sample data for development
    return Promise.resolve(sampleProductsDB)
  }

  static async getProductById(id: string): Promise<Product | null> {
    if (USE_SUPABASE) {
      try {
        return await SupabaseService.getProductById(id)
      } catch (error) {
        return null
      }
    }
    
    // Return sample data for development
    const product = sampleProductsDB.find(p => p.id === id)
    return Promise.resolve(product || null)
  }

  static async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    if (USE_SUPABASE) {
      return await SupabaseService.createProduct(product)
    }
    
    // Simulate creation for development
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: product.quantity === 0 ? 'Out of Stock' : 
              product.quantity <= product.min_quantity ? 'Low Stock' : 'In Stock',
      // Legacy compatibility
      image: product.image_url,
      lastUpdated: new Date().toISOString().split('T')[0],
    }
    
    sampleProductsDB.unshift(newProduct)
    return Promise.resolve(newProduct)
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (USE_SUPABASE) {
      try {
        return await SupabaseService.updateProduct(id, updates)
      } catch (error) {
        return null
      }
    }
    
    // Update sample data for development
    const index = sampleProductsDB.findIndex(p => p.id === id)
    if (index === -1) return null
    
    const updated = {
      ...sampleProductsDB[index],
      ...updates,
      updated_at: new Date().toISOString(),
      lastUpdated: new Date().toISOString().split('T')[0],
    }
    
    // Recalculate status if quantity or min_quantity changed
    if (updates.quantity !== undefined || updates.min_quantity !== undefined) {
      const quantity = updates.quantity ?? updated.quantity
      const minQuantity = updates.min_quantity ?? updated.min_quantity
      updated.status = quantity === 0 ? 'Out of Stock' : 
                      quantity <= minQuantity ? 'Low Stock' : 'In Stock'
    }
    
    sampleProductsDB[index] = updated
    return Promise.resolve(updated)
  }

  static async deleteProduct(id: string): Promise<boolean> {
    if (USE_SUPABASE) {
      try {
        await SupabaseService.deleteProduct(id)
        return true
      } catch (error) {
        return false
      }
    }
    
    // Delete from sample data for development
    const index = sampleProductsDB.findIndex(p => p.id === id)
    if (index === -1) return false
    
    sampleProductsDB.splice(index, 1)
    return Promise.resolve(true)
  }

  // Category operations
  static async getAllCategories(): Promise<Category[]> {
    console.log('DataService.getAllCategories - USE_SUPABASE:', USE_SUPABASE)
    
    if (USE_SUPABASE) {
      try {
        console.log('Attempting to fetch categories from Supabase...')
        const categories = await SupabaseService.getAllCategories()
        console.log('Categories from Supabase:', categories?.length || 0, categories)
        
        // If Supabase returns empty categories, fall back to sample data
        if (!categories || categories.length === 0) {
          console.warn('No categories found in Supabase, using sample categories')
          return sampleCategories
        }
        console.log('Returning Supabase categories:', categories)
        return categories
      } catch (error) {
        console.error('Error fetching categories from Supabase, using sample categories:', error)
        return sampleCategories
      }
    }
    
    console.log('Using sample categories (not using Supabase)')
    return Promise.resolve(sampleCategories)
  }

  static async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    if (USE_SUPABASE) {
      return await SupabaseService.createCategory(category)
    }
    
    // Simulate creation for development
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    sampleCategories.push(newCategory)
    return Promise.resolve(newCategory)
  }

  // Search and filtering
  static async searchProducts(query: string): Promise<Product[]> {
    if (USE_SUPABASE) {
      return await SupabaseService.searchProducts(query)
    }
    
    // Filter sample data for development
    const lowerQuery = query.toLowerCase()
    const filtered = sampleProductsDB.filter(product => 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.sku.toLowerCase().includes(lowerQuery) ||
      (product.supplier && product.supplier.toLowerCase().includes(lowerQuery))
    )
    
    return Promise.resolve(filtered)
  }

  static async getProductsByCategory(categoryId: string): Promise<Product[]> {
    if (USE_SUPABASE) {
      return await SupabaseService.getProductsByCategory(categoryId)
    }
    
    // Filter sample data by category for development
    const filtered = sampleProductsDB.filter(product => product.category_id === categoryId)
    return Promise.resolve(filtered)
  }

  static async getLowStockProducts(): Promise<Product[]> {
    if (USE_SUPABASE) {
      return await SupabaseService.getLowStockProducts()
    }
    
    // Filter sample data for low stock
    const filtered = sampleProductsDB.filter(product => 
      product.quantity > 0 && product.quantity <= product.min_quantity
    )
    return Promise.resolve(filtered)
  }

  static async getOutOfStockProducts(): Promise<Product[]> {
    if (USE_SUPABASE) {
      return await SupabaseService.getOutOfStockProducts()
    }
    
    // Filter sample data for out of stock
    const filtered = sampleProductsDB.filter(product => product.quantity === 0)
    return Promise.resolve(filtered)
  }

  // Stock movement operations
  static async adjustStock(
    productId: string, 
    quantity: number, 
    type: 'in' | 'out', 
    reason: string, 
    notes?: string, 
    createdBy?: string
  ): Promise<Transaction | null> {
    if (USE_SUPABASE) {
      try {
        return await SupabaseService.adjustStock(productId, quantity, type, reason, notes, createdBy)
      } catch (error) {
        return null
      }
    }
    
    // Simulate stock adjustment for development
    const product = sampleProductsDB.find(p => p.id === productId)
    if (!product) return null
    
    const oldQuantity = product.quantity
    product.quantity = type === 'in' 
      ? oldQuantity + quantity 
      : Math.max(0, oldQuantity - quantity)
    
    // Update status
    product.status = product.quantity === 0 ? 'Out of Stock' : 
                    product.quantity <= product.min_quantity ? 'Low Stock' : 'In Stock'
    
    product.updated_at = new Date().toISOString()
    product.lastUpdated = new Date().toISOString().split('T')[0]
    
    // Create mock transaction
    const transaction: Transaction = {
      id: `txn-${Date.now()}`,
      product_id: productId,
      type,
      quantity,
      reason,
      notes,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      product,
    }
    
    return Promise.resolve(transaction)
  }

  static async getStockMovements(limit = 50) {
    if (USE_SUPABASE) {
      return await SupabaseService.getStockMovements(limit)
    }
    
    // Return sample stock movements for development
    const sampleMovements = [
      {
        id: 1,
        productName: 'Wireless Headphones',
        sku: 'WH-001',
        type: 'inbound' as const,
        quantity: 50,
        status: 'delivered' as const,
        supplier: 'TechCorp',
        expectedDate: '2024-01-15',
        actualDate: '2024-01-14',
        trackingNumber: 'TC789456123',
        reason: 'Restock',
        notes: 'Regular restock order',
      },
      {
        id: 2,
        productName: 'Coffee Beans Premium',
        sku: 'CB-002',
        type: 'inbound' as const,
        quantity: 100,
        status: 'in-transit' as const,
        supplier: 'Bean Masters',
        expectedDate: '2024-01-18',
        actualDate: null,
        trackingNumber: 'BM456789012',
        reason: 'New shipment',
        notes: null,
      },
    ]
    
    return Promise.resolve(sampleMovements.slice(0, limit))
  }

  // Analytics
  static async getProductStats() {
    if (USE_SUPABASE) {
      return await SupabaseService.getProductStats()
    }
    
    // Calculate stats from sample data
    const products = sampleProductsDB
    const totalProducts = products.length
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0)
    const lowStockCount = products.filter(p => p.status === 'Low Stock').length
    const outOfStockCount = products.filter(p => p.status === 'Out of Stock').length
    
    return Promise.resolve({
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      products
    })
  }

  // ======================
  // SUPPLIER OPERATIONS
  // ======================

  static async getAllSuppliers(): Promise<Supplier[]> {
    if (USE_SUPABASE) {
      return await SupabaseService.getAllSuppliers()
    }
    
    // Return sample data for development (fallback)
    return Promise.resolve([])
  }

  static async getSupplierById(id: string): Promise<Supplier | null> {
    if (USE_SUPABASE) {
      try {
        return await SupabaseService.getSupplierById(id)
      } catch (error) {
        return null
      }
    }
    
    return Promise.resolve(null)
  }

  static async createSupplier(supplier: CreateSupplierRequest): Promise<Supplier | null> {
    if (USE_SUPABASE) {
      try {
        return await SupabaseService.createSupplier(supplier)
      } catch (error) {
        console.error('Error creating supplier:', error)
        return null
      }
    }
    
    return Promise.resolve(null)
  }

  static async updateSupplier(id: string, updates: Omit<UpdateSupplierRequest, 'id'>): Promise<Supplier | null> {
    if (USE_SUPABASE) {
      try {
        return await SupabaseService.updateSupplier(id, updates)
      } catch (error) {
        console.error('Error updating supplier:', error)
        return null
      }
    }
    
    return Promise.resolve(null)
  }

  static async deleteSupplier(id: string): Promise<boolean> {
    if (USE_SUPABASE) {
      try {
        await SupabaseService.deleteSupplier(id)
        return true
      } catch (error) {
        console.error('Error deleting supplier:', error)
        return false
      }
    }
    
    return Promise.resolve(false)
  }

  static async getSuppliersWithStats(): Promise<(Supplier & SupplierStats)[]> {
    if (USE_SUPABASE) {
      return await SupabaseService.getSuppliersWithStats()
    }
    
    // Return empty array for development (fallback)
    return Promise.resolve([])
  }

  static async searchSuppliers(query: string): Promise<Supplier[]> {
    if (USE_SUPABASE) {
      return await SupabaseService.searchSuppliers(query)
    }
    
    return Promise.resolve([])
  }

  // ======================
  // PURCHASE TRANSACTIONS
  // ======================

  static async getAllPurchaseTransactions(): Promise<PurchaseTransaction[]> {
    if (USE_SUPABASE) {
      return await SupabaseService.getAllPurchaseTransactions()
    }
    
    return Promise.resolve([])
  }

  static async getPurchaseTransactionsBySupplier(supplierId: string): Promise<PurchaseTransaction[]> {
    if (USE_SUPABASE) {
      return await SupabaseService.getPurchaseTransactionsBySupplier(supplierId)
    }
    
    return Promise.resolve([])
  }

  static async createPurchaseTransaction(transaction: CreatePurchaseTransactionRequest): Promise<PurchaseTransaction | null> {
    if (USE_SUPABASE) {
      try {
        return await SupabaseService.createPurchaseTransaction(transaction)
      } catch (error) {
        console.error('Error creating purchase transaction:', error)
        return null
      }
    }
    
    return Promise.resolve(null)
  }

  static async updatePurchaseTransaction(id: string, updates: Omit<UpdatePurchaseTransactionRequest, 'id'>): Promise<PurchaseTransaction | null> {
    if (USE_SUPABASE) {
      try {
        return await SupabaseService.updatePurchaseTransaction(id, updates)
      } catch (error) {
        console.error('Error updating purchase transaction:', error)
        return null
      }
    }
    
    return Promise.resolve(null)
  }

  static async deletePurchaseTransaction(id: string): Promise<boolean> {
    if (USE_SUPABASE) {
      try {
        await SupabaseService.deletePurchaseTransaction(id)
        return true
      } catch (error) {
        console.error('Error deleting purchase transaction:', error)
        return false
      }
    }
    
    return Promise.resolve(false)
  }

  // Configuration
  static isUsingSupabase(): boolean {
    return USE_SUPABASE
  }

  static getDataSource(): string {
    return USE_SUPABASE ? 'Supabase Database' : 'Sample Data'
  }
}
