export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category: string;
  quantity: number;
  price: number;
  supplier: string;
  lastUpdated: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  image?: string;
  createdAt?: string;
  updatedAt?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  location?: string;
  barcode?: string;
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
