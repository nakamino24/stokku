'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, Plus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { DataService } from '@/lib/data-service'
import { toast } from 'sonner'

interface InitStatus {
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
}

const defaultCategories = [
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

export function DatabaseInitializer() {
  const [initStatus, setInitStatus] = useState<InitStatus>({ status: 'idle' })
  const [currentCategories, setCurrentCategories] = useState<any[]>([])
  const [hasChecked, setHasChecked] = useState(false)

  const checkCurrentCategories = async () => {
    setInitStatus({ status: 'loading', message: 'Checking current categories...' })
    
    try {
      const categories = await DataService.getAllCategories()
      setCurrentCategories(categories)
      setHasChecked(true)
      setInitStatus({ status: 'success', message: `Found ${categories.length} categories` })
    } catch (error) {
      setInitStatus({ status: 'error', message: 'Failed to check categories' })
      toast.error('Failed to check categories')
    }
  }

  const initializeCategories = async () => {
    setInitStatus({ status: 'loading', message: 'Initializing categories...' })
    
    try {
      let successCount = 0
      let existingCount = 0
      
      for (const category of defaultCategories) {
        // Check if category already exists
        const exists = currentCategories.some(c => c.name === category.name)
        
        if (exists) {
          existingCount++
          continue
        }
        
        try {
          await DataService.createCategory(category)
          successCount++
        } catch (error) {
          console.error(`Failed to create category ${category.name}:`, error)
        }
      }
      
      // Refresh categories list
      await checkCurrentCategories()
      
      setInitStatus({ 
        status: 'success', 
        message: `Created ${successCount} new categories, ${existingCount} already existed` 
      })
      
      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} categories`)
      } else if (existingCount > 0) {
        toast.info('All categories already exist')
      }
      
    } catch (error) {
      setInitStatus({ status: 'error', message: 'Failed to initialize categories' })
      toast.error('Failed to initialize categories')
    }
  }

  const getStatusIcon = () => {
    switch (initStatus.status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  const getStatusBadge = () => {
    if (!hasChecked) return null
    
    if (currentCategories.length === 0) {
      return <Badge variant="destructive">No Categories</Badge>
    }
    
    if (currentCategories.length < defaultCategories.length) {
      return <Badge variant="secondary">Incomplete</Badge>
    }
    
    return <Badge variant="default">Ready</Badge>
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Initializer
          {getStatusBadge()}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Initialize your Stokku database with essential categories and sample data
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Current Categories</h3>
            <p className="text-xs text-gray-500">
              {hasChecked 
                ? `${currentCategories.length} categories found` 
                : 'Click "Check Categories" to see current state'
              }
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={checkCurrentCategories}
            disabled={initStatus.status === 'loading'}
          >
            {initStatus.status === 'loading' && !hasChecked ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Check Categories
          </Button>
        </div>

        {hasChecked && (
          <div className="space-y-2">
            {currentCategories.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {currentCategories.map((category) => (
                  <div key={category.id} className="p-2 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-800">
                      {category.name}
                    </div>
                    <div className="text-xs text-green-600">
                      {category.description}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                <p className="text-sm text-red-800">No categories found</p>
                <p className="text-xs text-red-600">Initialize categories to get started</p>
              </div>
            )}
          </div>
        )}

        {hasChecked && currentCategories.length < defaultCategories.length && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Missing Categories</h4>
            <div className="grid grid-cols-2 gap-2">
              {defaultCategories
                .filter(defCat => !currentCategories.some(cat => cat.name === defCat.name))
                .map((category, index) => (
                  <div key={index} className="p-2 bg-yellow-50 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800">
                      {category.name}
                    </div>
                    <div className="text-xs text-yellow-600">
                      {category.description}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button 
            onClick={initializeCategories}
            disabled={initStatus.status === 'loading' || (hasChecked && currentCategories.length >= defaultCategories.length)}
            className="flex-1"
          >
            {getStatusIcon()}
            <Plus className="h-4 w-4 ml-2" />
            Initialize Categories
          </Button>
        </div>

        {initStatus.message && (
          <div className={`p-3 rounded-lg text-sm ${
            initStatus.status === 'error' 
              ? 'bg-red-50 text-red-800' 
              : initStatus.status === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-blue-50 text-blue-800'
          }`}>
            {initStatus.message}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Data Source:</strong> {DataService.getDataSource()}</p>
          <p><strong>Environment:</strong> {DataService.isUsingSupabase() ? 'Production' : 'Development'}</p>
        </div>
      </CardContent>
    </Card>
  )
}
