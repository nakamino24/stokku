-- Stokku Database RLS Policies Setup
-- Run this script in your Supabase SQL Editor

-- =====================================================
-- CATEGORIES TABLE POLICIES
-- =====================================================

-- Enable RLS on categories (if not already enabled)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow all users to read categories
CREATE POLICY "Allow public read access to categories" ON public.categories
FOR SELECT USING (true);

-- Allow authenticated users to insert categories  
CREATE POLICY "Allow authenticated users to insert categories" ON public.categories
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update categories
CREATE POLICY "Allow authenticated users to update categories" ON public.categories
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete categories
CREATE POLICY "Allow authenticated users to delete categories" ON public.categories
FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- PRODUCTS TABLE POLICIES  
-- =====================================================

-- Enable RLS on products (if not already enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow all users to read products
CREATE POLICY "Allow public read access to products" ON public.products
FOR SELECT USING (true);

-- Allow authenticated users to insert products
CREATE POLICY "Allow authenticated users to insert products" ON public.products
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update products
CREATE POLICY "Allow authenticated users to update products" ON public.products
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete products
CREATE POLICY "Allow authenticated users to delete products" ON public.products
FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Enable RLS on transactions (if not already enabled)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow all users to read transactions
CREATE POLICY "Allow public read access to transactions" ON public.transactions
FOR SELECT USING (true);

-- Allow authenticated users to insert transactions
CREATE POLICY "Allow authenticated users to insert transactions" ON public.transactions
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update transactions
CREATE POLICY "Allow authenticated users to update transactions" ON public.transactions
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete transactions
CREATE POLICY "Allow authenticated users to delete transactions" ON public.transactions
FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- SUPPLIERS TABLE POLICIES (if exists)
-- =====================================================

-- Enable RLS on suppliers (if not already enabled)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Allow all users to read suppliers
CREATE POLICY "Allow public read access to suppliers" ON public.suppliers
FOR SELECT USING (true);

-- Allow authenticated users to insert suppliers
CREATE POLICY "Allow authenticated users to insert suppliers" ON public.suppliers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update suppliers
CREATE POLICY "Allow authenticated users to update suppliers" ON public.suppliers
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete suppliers
CREATE POLICY "Allow authenticated users to delete suppliers" ON public.suppliers
FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- PURCHASE_TRANSACTIONS TABLE POLICIES (if exists)
-- =====================================================

-- Enable RLS on purchase_transactions (if not already enabled)
ALTER TABLE public.purchase_transactions ENABLE ROW LEVEL SECURITY;

-- Allow all users to read purchase transactions
CREATE POLICY "Allow public read access to purchase_transactions" ON public.purchase_transactions
FOR SELECT USING (true);

-- Allow authenticated users to insert purchase transactions
CREATE POLICY "Allow authenticated users to insert purchase_transactions" ON public.purchase_transactions
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update purchase transactions
CREATE POLICY "Allow authenticated users to update purchase_transactions" ON public.purchase_transactions
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete purchase transactions
CREATE POLICY "Allow authenticated users to delete purchase_transactions" ON public.purchase_transactions
FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- PROFILES TABLE POLICIES (if exists)
-- =====================================================

-- Enable RLS on profiles (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile and other profiles
CREATE POLICY "Allow users to read profiles" ON public.profiles
FOR SELECT USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
