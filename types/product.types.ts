export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category_id: string;
  category?: Category; // Populated via join
  supplier?: string;
  image_url?: string;
  quantity: number;
  min_quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
  status?: 'In Stock' | 'Low Stock' | 'Out of Stock'; // Computed field
  // Legacy fields for backward compatibility
  image?: string;
  lastUpdated?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  location?: string;
  barcode?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  product_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  product?: Product; // Populated via join
}

export interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  category: string;
  quantity: number;
  price: number;
  supplier: string;
  minStockLevel: number;
  maxStockLevel: number;
  location: string;
  barcode: string;
  image?: string;
}

export interface ProductFilter {
  category?: string;
  status?: string;
  supplier?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface ProductStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryCounts: Record<string, number>;
  supplierCounts: Record<string, number>;
}
