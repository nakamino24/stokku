export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          sku: string
          description: string | null
          category_id: string | null
          quantity: number
          min_quantity: number
          price: number
          supplier: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sku: string
          description?: string | null
          category_id?: string | null
          quantity?: number
          min_quantity?: number
          price?: number
          supplier?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sku?: string
          description?: string | null
          category_id?: string | null
          quantity?: number
          min_quantity?: number
          price?: number
          supplier?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          product_id: string
          type: 'in' | 'out'
          quantity: number
          reason: string
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          type: 'in' | 'out'
          quantity: number
          reason: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          type?: 'in' | 'out'
          quantity?: number
          reason?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Enhanced types with relationships
export interface ProductWithCategory extends Database['public']['Tables']['products']['Row'] {
  category?: Database['public']['Tables']['categories']['Row'] | null
  status: 'In Stock' | 'Low Stock' | 'Out of Stock'
}

export interface TransactionWithProduct extends Database['public']['Tables']['transactions']['Row'] {
  product?: Database['public']['Tables']['products']['Row'] | null
  created_by_profile?: Database['public']['Tables']['profiles']['Row'] | null
}

export interface ProfileWithStats extends Database['public']['Tables']['profiles']['Row'] {
  transaction_count?: number
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
