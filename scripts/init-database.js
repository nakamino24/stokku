#!/usr/bin/env node

/**
 * Database Initialization Script
 * This script populates the Supabase database with initial categories and sample data
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL and Key are required in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Categories to insert
const categories = [
  {
    name: 'Electronics',
    description: 'Electronic devices and accessories'
  },
  {
    name: 'Food & Beverage',
    description: 'Food products and beverages'
  },
  {
    name: 'Office Supplies',
    description: 'Office equipment and supplies'
  },
  {
    name: 'Sports & Fitness',
    description: 'Sports equipment and fitness gear'
  },
  {
    name: 'Clothing',
    description: 'Apparel and clothing items'
  },
  {
    name: 'Home & Garden',
    description: 'Home improvement and garden supplies'
  }
]

async function initializeDatabase() {
  console.log('🚀 Initializing Stokku database...')
  
  try {
    // Check if categories already exist
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('*')
    
    if (fetchError) {
      console.error('❌ Error checking existing categories:', fetchError.message)
      return
    }
    
    console.log(`📊 Found ${existingCategories.length} existing categories`)
    
    // Insert categories if table is empty
    if (existingCategories.length === 0) {
      console.log('📝 Inserting categories...')
      
      const { data: insertedCategories, error: insertError } = await supabase
        .from('categories')
        .insert(categories)
        .select()
      
      if (insertError) {
        console.error('❌ Error inserting categories:', insertError.message)
        return
      }
      
      console.log(`✅ Successfully inserted ${insertedCategories.length} categories:`)
      insertedCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.id})`)
      })
    } else {
      console.log('✅ Categories table already has data, skipping insertion')
      existingCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.id})`)
      })
    }
    
    // Get current categories for sample products
    const { data: currentCategories } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    const electronicsCategory = currentCategories.find(c => c.name === 'Electronics')
    const foodCategory = currentCategories.find(c => c.name === 'Food & Beverage')
    const officeCategory = currentCategories.find(c => c.name === 'Office Supplies')
    const sportsCategory = currentCategories.find(c => c.name === 'Sports & Fitness')
    
    // Check if products exist
    const { data: existingProducts, error: productsError } = await supabase
      .from('products')
      .select('*')
    
    if (productsError) {
      console.error('❌ Error checking existing products:', productsError.message)
      return
    }
    
    console.log(`📦 Found ${existingProducts.length} existing products`)
    
    // Add some sample products if products table is empty
    if (existingProducts.length === 0 && currentCategories.length > 0) {
      console.log('📝 Inserting sample products...')
      
      const sampleProducts = [
        {
          name: 'Wireless Headphones',
          sku: 'WH-001',
          description: 'Premium wireless headphones with noise cancellation',
          category_id: electronicsCategory?.id,
          supplier: 'TechCorp',
          image_url: '/placeholder.svg?height=40&width=40',
          quantity: 45,
          min_quantity: 10,
          price: 79.99
        },
        {
          name: 'Coffee Beans - Premium Blend',
          sku: 'CB-002',
          description: 'High-quality coffee beans from Colombia',
          category_id: foodCategory?.id,
          supplier: 'Bean Masters',
          image_url: '/placeholder.svg?height=40&width=40',
          quantity: 12,
          min_quantity: 20,
          price: 24.99
        },
        {
          name: 'Desk Lamp - LED',
          sku: 'DL-003',
          description: 'Energy-efficient LED desk lamp with adjustable brightness',
          category_id: officeCategory?.id,
          supplier: 'Office Plus',
          image_url: '/placeholder.svg?height=40&width=40',
          quantity: 0,
          min_quantity: 5,
          price: 34.99
        },
        {
          name: 'Yoga Mat - Premium',
          sku: 'YM-004',
          description: 'Non-slip premium yoga mat for all types of exercises',
          category_id: sportsCategory?.id,
          supplier: 'FitGear Co',
          image_url: '/placeholder.svg?height=40&width=40',
          quantity: 28,
          min_quantity: 15,
          price: 49.99
        },
        {
          name: 'Bluetooth Speaker',
          sku: 'BS-005',
          description: 'Portable Bluetooth speaker with superior sound quality',
          category_id: electronicsCategory?.id,
          supplier: 'AudioTech',
          image_url: '/placeholder.svg?height=40&width=40',
          quantity: 8,
          min_quantity: 12,
          price: 89.99
        }
      ]
      
      const { data: insertedProducts, error: insertProductsError } = await supabase
        .from('products')
        .insert(sampleProducts)
        .select()
      
      if (insertProductsError) {
        console.error('❌ Error inserting sample products:', insertProductsError.message)
        return
      }
      
      console.log(`✅ Successfully inserted ${insertedProducts.length} sample products:`)
      insertedProducts.forEach(product => {
        console.log(`  - ${product.name} (${product.sku})`)
      })
    } else if (existingProducts.length > 0) {
      console.log('✅ Products table already has data, skipping insertion')
    }
    
    // Summary
    const { data: finalCategories } = await supabase.from('categories').select('*')
    const { data: finalProducts } = await supabase.from('products').select('*')
    
    console.log('\n📊 Database Summary:')
    console.log(`  Categories: ${finalCategories.length}`)
    console.log(`  Products: ${finalProducts.length}`)
    console.log('\n🎉 Database initialization completed successfully!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the initialization
initializeDatabase()
