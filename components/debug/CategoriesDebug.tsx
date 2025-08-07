'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataService } from '@/lib/data-service'
import { SupabaseService } from '@/lib/supabase-database.service'
import { supabase } from '@/lib/supabase'

export function CategoriesDebug() {
  const [dataServiceCategories, setDataServiceCategories] = useState<any[]>([])
  const [supabaseServiceCategories, setSupabaseServiceCategories] = useState<any[]>([])
  const [directSupabaseCategories, setDirectSupabaseCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const testAll = async () => {
    setLoading(true)
    setErrors([])
    const newErrors: string[] = []

    // Test 1: DataService
    try {
      console.log('Testing DataService.getAllCategories...')
      const categories = await DataService.getAllCategories()
      console.log('DataService categories:', categories)
      setDataServiceCategories(categories || [])
    } catch (error) {
      const errorMsg = `DataService error: ${error}`
      console.error(errorMsg)
      newErrors.push(errorMsg)
    }

    // Test 2: SupabaseService directly
    try {
      console.log('Testing SupabaseService.getAllCategories...')
      const categories = await SupabaseService.getAllCategories()
      console.log('SupabaseService categories:', categories)
      setSupabaseServiceCategories(categories || [])
    } catch (error) {
      const errorMsg = `SupabaseService error: ${error}`
      console.error(errorMsg)
      newErrors.push(errorMsg)
    }

    // Test 3: Direct supabase client
    try {
      console.log('Testing direct supabase client...')
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) {
        const errorMsg = `Direct supabase error: ${error.message}`
        console.error(errorMsg)
        newErrors.push(errorMsg)
      } else {
        console.log('Direct supabase categories:', data)
        setDirectSupabaseCategories(data || [])
      }
    } catch (error) {
      const errorMsg = `Direct supabase catch error: ${error}`
      console.error(errorMsg)
      newErrors.push(errorMsg)
    }

    setErrors(newErrors)
    setLoading(false)
  }

  // Test environment variables
  useEffect(() => {
    console.log('Environment check:')
    console.log('NEXT_PUBLIC_USE_SUPABASE:', process.env.NEXT_PUBLIC_USE_SUPABASE)
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('DataService.isUsingSupabase():', DataService.isUsingSupabase())
    console.log('DataService.getDataSource():', DataService.getDataSource())
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Categories Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-1">
            <p><strong>Environment:</strong> {DataService.getDataSource()}</p>
            <p><strong>Using Supabase:</strong> {DataService.isUsingSupabase() ? 'Yes' : 'No'}</p>
            <p><strong>NEXT_PUBLIC_USE_SUPABASE:</strong> {process.env.NEXT_PUBLIC_USE_SUPABASE || 'undefined'}</p>
          </div>
          
          <Button onClick={testAll} disabled={loading}>
            {loading ? 'Testing...' : 'Test All Category Sources'}
          </Button>

          {errors.length > 0 && (
            <div className="bg-red-50 p-3 rounded">
              <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-600">{error}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium mb-2">DataService ({dataServiceCategories.length})</h3>
              <div className="bg-gray-50 p-2 rounded text-xs max-h-40 overflow-y-auto">
                <pre>{JSON.stringify(dataServiceCategories, null, 2)}</pre>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">SupabaseService ({supabaseServiceCategories.length})</h3>
              <div className="bg-gray-50 p-2 rounded text-xs max-h-40 overflow-y-auto">
                <pre>{JSON.stringify(supabaseServiceCategories, null, 2)}</pre>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Direct Supabase ({directSupabaseCategories.length})</h3>
              <div className="bg-gray-50 p-2 rounded text-xs max-h-40 overflow-y-auto">
                <pre>{JSON.stringify(directSupabaseCategories, null, 2)}</pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
