import { createClient } from '@/utils/supabase/client';
import {
  Product,
  Category,
  Transaction,
  Profile,
  ProductWithCategory,
  TransactionWithProduct,
} from './database.types';

const supabase = createClient();

export const databaseService = {
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    return data || [];
  },

  async getProductById(productId: string): Promise<ProductWithCategory> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('id', productId)
      .single();
    if (error) throw error;
    return data;
  },

  async createProduct(newProduct: Product): Promise<void> {
    const { error } = await supabase.from('products').insert([newProduct]);
    if (error) throw error;
  },

  async updateProduct(id: string, updatedProduct: Partial<Product>): Promise<void> {
    const { error } = await supabase.from('products').update(updatedProduct).eq('id', id);
    if (error) throw error;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    return data || [];
  },

  async createTransaction(transaction: Transaction): Promise<void> {
    const { error } = await supabase.from('transactions').insert([transaction]);
    if (error) throw error;
  },

  async getTransactions(): Promise<TransactionWithProduct[]> {
    const { data, error } = await supabase.from('transactions').select('*, product:products(*)');
    if (error) throw error;
    return data || [];
  },

  async getUserProfile(): Promise<Profile> {
    const { data, error } = await supabase.from('profiles').select('*').single();
    if (error) throw error;
    return data;
  },
};

