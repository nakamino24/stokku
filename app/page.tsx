import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, BarChart3, Users, FileText, ArrowRight, CheckCircle, Star, Shield, Zap, TrendingUp } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">Stokku</span>
            </div>
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Simple Inventory Management
            <span className="block text-blue-600">for Small Businesses</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your inventory operations with our modern, mobile-friendly platform. 
            No server setup required - just sign up and start managing your stock today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <Package className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Add, edit, and track your products with ease. Organize by categories and monitor stock levels.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Real-time Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get instant insights into your inventory performance with automated reports and dashboards.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Role-based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Control who can view and modify your inventory with admin and user role permissions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Export & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generate weekly PDF reports and export your data to CSV for external analysis.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-white rounded-2xl shadow-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to streamline your inventory?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of small businesses already using Stokku to manage their inventory efficiently.
          </p>
          <Link href="/auth/login">
            <Button size="lg">
              Start Managing Your Inventory
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Stokku. Built for small businesses with ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
