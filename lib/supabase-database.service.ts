import { supabase } from './supabase'
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

export class SupabaseService {
  // Product CRUD operations
  static async getAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, description)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Add computed status field
    return data.map(product => ({
      ...product,
      status: this.computeProductStatus(product.quantity, product.min_quantity),
      // Legacy compatibility
      image: product.image_url,
      lastUpdated: product.updated_at,
    }))
  }

  static async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, description)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    return {
      ...data,
      status: this.computeProductStatus(data.quantity, data.min_quantity),
      image: data.image_url,
      lastUpdated: data.updated_at,
    }
  }

  static async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: product.name,
        sku: product.sku,
        description: product.description,
        category_id: product.category_id,
        supplier: product.supplier,
        image_url: product.image_url,
        quantity: product.quantity,
        min_quantity: product.min_quantity,
        price: product.price,
      }])
      .select(`
        *,
        category:categories(id, name, description)
      `)
      .single()
    
    if (error) throw error
    return {
      ...data,
      status: this.computeProductStatus(data.quantity, data.min_quantity),
      image: data.image_url,
      lastUpdated: data.updated_at,
    }
  }

  static async updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: updates.name,
        sku: updates.sku,
        description: updates.description,
        category_id: updates.category_id,
        supplier: updates.supplier,
        image_url: updates.image_url || updates.image,
        quantity: updates.quantity,
        min_quantity: updates.min_quantity,
        price: updates.price,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name, description)
      `)
      .single()
    
    if (error) throw error
    return {
      ...data,
      status: this.computeProductStatus(data.quantity, data.min_quantity),
      image: data.image_url,
      lastUpdated: data.updated_at,
    }
  }

  static async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Categories
  static async getAllCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  }

  static async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Transactions
  static async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select(`
        *,
        product:products(id, name, sku)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  static async getTransactionsByProduct(productId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        product:products(id, name, sku)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async getAllTransactions(limit = 50) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        product:products(id, name, sku)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }

  // Search and filtering
  static async searchProducts(query: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, description)
      `)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,supplier.ilike.%${query}%`)
      .order('name')
    
    if (error) throw error
    return data.map(product => ({
      ...product,
      status: this.computeProductStatus(product.quantity, product.min_quantity),
      image: product.image_url,
      lastUpdated: product.updated_at,
    }))
  }

  static async getProductsByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, description)
      `)
      .eq('category_id', categoryId)
      .order('name')
    
    if (error) throw error
    return data.map(product => ({
      ...product,
      status: this.computeProductStatus(product.quantity, product.min_quantity),
      image: product.image_url,
      lastUpdated: product.updated_at,
    }))
  }

  static async getLowStockProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, description)
      `)
      .filter('quantity', 'lte', supabase.raw('min_quantity'))
      .order('quantity')
    
    if (error) throw error
    return data.map(product => ({
      ...product,
      status: this.computeProductStatus(product.quantity, product.min_quantity),
      image: product.image_url,
      lastUpdated: product.updated_at,
    }))
  }

  static async getOutOfStockProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, description)
      `)
      .eq('quantity', 0)
      .order('name')
    
    if (error) throw error
    return data.map(product => ({
      ...product,
      status: this.computeProductStatus(product.quantity, product.min_quantity),
      image: product.image_url,
      lastUpdated: product.updated_at,
    }))
  }

  // Stock adjustment with transaction recording
  static async adjustStock(productId: string, quantity: number, type: 'in' | 'out', reason: string, notes?: string, createdBy?: string) {
    const { data: currentProduct, error: productError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', productId)
      .single()
    
    if (productError) throw productError
    
    const newQuantity = type === 'in' 
      ? currentProduct.quantity + quantity
      : Math.max(0, currentProduct.quantity - quantity)
    
    // Update product quantity
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
    
    if (updateError) throw updateError
    
    // Record transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        product_id: productId,
        type,
        quantity,
        reason,
        notes,
        created_by: createdBy,
      }])
      .select()
      .single()
    
    if (transactionError) throw transactionError
    return transaction
  }

  // Analytics
  static async getProductStats() {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, description)
      `)
    
    if (error) throw error
    
    const enrichedProducts = products.map(product => ({
      ...product,
      status: this.computeProductStatus(product.quantity, product.min_quantity),
      image: product.image_url,
      lastUpdated: product.updated_at,
    }))
    
    const totalProducts = enrichedProducts.length
    const totalValue = enrichedProducts.reduce((sum, p) => sum + (p.quantity * p.price), 0)
    const lowStockCount = enrichedProducts.filter(p => p.status === 'Low Stock').length
    const outOfStockCount = enrichedProducts.filter(p => p.status === 'Out of Stock').length
    
    return {
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      products: enrichedProducts
    }
  }

  // Stock Movement Report (based on transactions)
  static async getStockMovements(limit = 50) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        product:products(id, name, sku, category:categories(name))
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    // Transform to stock movement format
    return data.map(transaction => ({
      id: transaction.id,
      productName: transaction.product?.name || 'Unknown Product',
      sku: transaction.product?.sku || 'Unknown',
      type: transaction.type === 'in' ? 'inbound' : 'outbound',
      quantity: transaction.quantity,
      status: 'delivered', // Since these are completed transactions
      supplier: transaction.type === 'in' ? 'Supplier' : `Order ${transaction.reason}`,
      expectedDate: transaction.created_at.split('T')[0],
      actualDate: transaction.created_at.split('T')[0],
      trackingNumber: `TXN-${transaction.id.slice(-8)}`,
      reason: transaction.reason,
      notes: transaction.notes,
    }))
  }

  // Helper function to compute product status
  private static computeProductStatus(quantity: number, minQuantity: number): 'In Stock' | 'Low Stock' | 'Out of Stock' {
    if (quantity === 0) return 'Out of Stock'
    if (quantity <= minQuantity) return 'Low Stock'
    return 'In Stock'
  }

  // ======================
  // SUPPLIER OPERATIONS
  // ======================

  // Get all suppliers
  static async getAllSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  }

  // Get supplier by ID
  static async getSupplierById(id: string): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  // Create supplier
  static async createSupplier(supplier: CreateSupplierRequest): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplier])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Update supplier
  static async updateSupplier(id: string, updates: Omit<UpdateSupplierRequest, 'id'>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Delete supplier
  static async deleteSupplier(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Get suppliers with statistics
  static async getSuppliersWithStats(): Promise<(Supplier & SupplierStats)[]> {
    const suppliers = await this.getAllSuppliers()
    
    const enrichedSuppliers = await Promise.all(
      suppliers.map(async (supplier) => {
        // Get products count by supplier name (legacy field)
        const { data: products } = await supabase
          .from('products')
          .select('id, price, quantity')
          .eq('supplier', supplier.name)
        
        // Get purchase transactions
        const { data: transactions } = await supabase
          .from('purchase_transactions')
          .select('total_amount, order_date, status')
          .eq('supplier_id', supplier.id)
          .eq('status', 'Completed')
        
        const totalProducts = products?.length || 0
        const totalPurchaseValue = transactions?.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0) || 0
        const totalTransactions = transactions?.length || 0
        
        // Get last transaction date
        const lastTransaction = transactions?.sort((a, b) => 
          new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
        )[0]
        const lastTransactionDate = lastTransaction?.order_date || supplier.created_at
        
        // Calculate monthly purchases (last 3 months)
        const now = new Date()
        const months = ['Nov', 'Dec', 'Jan'] // Simplified for demo
        const monthlyPurchases = months.map((month, index) => {
          const monthTransactions = transactions?.filter(t => {
            const transactionDate = new Date(t.order_date)
            const targetMonth = new Date(now.getFullYear(), now.getMonth() - (2 - index), 1)
            return transactionDate.getMonth() === targetMonth.getMonth()
          }) || []
          
          return {
            month,
            amount: monthTransactions.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0),
            orders: monthTransactions.length
          }
        })
        
        return {
          ...supplier,
          totalProducts,
          totalPurchaseValue,
          totalTransactions,
          lastTransactionDate,
          monthlyPurchases
        }
      })
    )
    
    return enrichedSuppliers
  }

  // Search suppliers
  static async searchSuppliers(query: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,contact.ilike.%${query}%`)
      .order('name')
    
    if (error) throw error
    return data || []
  }

  // ======================
  // PURCHASE TRANSACTIONS
  // ======================

  // Get all purchase transactions
  static async getAllPurchaseTransactions(): Promise<PurchaseTransaction[]> {
    const { data, error } = await supabase
      .from('purchase_transactions')
      .select(`
        *,
        supplier:suppliers(id, name, contact, email),
        product:products(id, name, sku)
      `)
      .order('order_date', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Get purchase transactions by supplier
  static async getPurchaseTransactionsBySupplier(supplierId: string): Promise<PurchaseTransaction[]> {
    const { data, error } = await supabase
      .from('purchase_transactions')
      .select(`
        *,
        supplier:suppliers(id, name, contact, email),
        product:products(id, name, sku)
      `)
      .eq('supplier_id', supplierId)
      .order('order_date', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Create purchase transaction
  static async createPurchaseTransaction(transaction: CreatePurchaseTransactionRequest): Promise<PurchaseTransaction> {
    const { data, error } = await supabase
      .from('purchase_transactions')
      .insert([transaction])
      .select(`
        *,
        supplier:suppliers(id, name, contact, email),
        product:products(id, name, sku)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  // Update purchase transaction
  static async updatePurchaseTransaction(id: string, updates: Omit<UpdatePurchaseTransactionRequest, 'id'>): Promise<PurchaseTransaction> {
    const { data, error } = await supabase
      .from('purchase_transactions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers(id, name, contact, email),
        product:products(id, name, sku)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  // Delete purchase transaction
  static async deletePurchaseTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_transactions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
