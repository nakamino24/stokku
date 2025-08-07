'use client'

import { DatabaseInitializer } from '@/components/features/admin/DatabaseInitializer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Database, Users, FileText } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Settings className="h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your Stokku application settings and database
          </p>
          <Badge variant="outline">Development Tools</Badge>
        </div>

        {/* Quick Stats/Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Supabase</div>
              <p className="text-xs text-muted-foreground">
                Production database
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Environment</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Development</div>
              <p className="text-xs text-muted-foreground">
                Local development mode
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auth Status</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">
                User authentication enabled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Database Initializer */}
        <div className="flex justify-center">
          <DatabaseInitializer />
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">Step 1: Check Categories</h4>
              <p className="text-sm text-gray-600">
                First, click "Check Categories" to see if your database already has categories set up.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Step 2: Initialize Categories</h4>
              <p className="text-sm text-gray-600">
                If categories are missing, click "Initialize Categories" to create the essential category structure for your inventory system.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Step 3: Start Using the App</h4>
              <p className="text-sm text-gray-600">
                Once categories are set up, you can start adding products through the main dashboard.
              </p>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This admin page is only available in development mode. 
                Categories will be automatically created from your authenticated user context.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
