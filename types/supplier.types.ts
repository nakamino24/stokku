export interface Supplier {
  id: string
  name: string
  contact?: string
  email?: string
  address?: string
  status: 'Active' | 'Inactive'
  reliability: 'High' | 'Medium' | 'Low'
  on_time_delivery_rate: number
  average_delivery_time: number
  categories: string[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface PurchaseTransaction {
  id: string
  supplier_id?: string
  product_id?: string
  product_name: string
  quantity: number
  unit_price: number
  total_amount: number
  status: 'Pending' | 'Completed' | 'Cancelled'
  order_date: string
  expected_delivery_date?: string
  actual_delivery_date?: string
  is_late_delivery?: boolean
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Joined data
  supplier?: Supplier
  product?: {
    id: string
    name: string
    sku: string
  }
}

export interface SupplierStats {
  totalProducts: number
  totalPurchaseValue: number
  totalTransactions: number
  lastTransactionDate: string
  monthlyPurchases: {
    month: string
    amount: number
    orders: number
  }[]
}

export interface CreateSupplierRequest {
  name: string
  contact?: string
  email?: string
  address?: string
  status?: 'Active' | 'Inactive'
  reliability?: 'High' | 'Medium' | 'Low'
  on_time_delivery_rate?: number
  average_delivery_time?: number
  categories?: string[]
  notes?: string
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  id: string
}

export interface CreatePurchaseTransactionRequest {
  supplier_id?: string
  product_id?: string
  product_name: string
  quantity: number
  unit_price: number
  status?: 'Pending' | 'Completed' | 'Cancelled'
  order_date?: string
  expected_delivery_date?: string
  actual_delivery_date?: string
  notes?: string
}

export interface UpdatePurchaseTransactionRequest extends Partial<CreatePurchaseTransactionRequest> {
  id: string
}
