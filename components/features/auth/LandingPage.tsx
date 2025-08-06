'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Users,
  MapPin,
  Truck,
  Warehouse,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function LandingPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-600 rounded-xl p-3">
                <Package className="h-8 w-8 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">Stokku</span>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
            <p className="text-gray-600">Welcome back! Please log-in to access our system!</p>
          </div>

          {/* Login Form */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Your email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Input your login email ..."
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Your password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Input your login password"
                    className="mt-1"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={setRememberMe}
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600">
                      Remember me
                    </Label>
                  </div>
                  <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Submit'}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/auth/register" className="text-blue-600 hover:text-blue-500 font-medium">
                      Register here
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-blue-400 rounded-full opacity-30 animate-bounce"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full opacity-10"></div>
        </div>

        <div className="relative z-10 max-w-2xl text-white">
          {/* Location Pin */}
          <div className="absolute -top-8 right-12">
            <div className="bg-red-500 rounded-full p-2 animate-bounce">
              <MapPin className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center space-y-6">
            {/* Character/Mascot */}
            <div className="relative mb-8">
              <div className="bg-orange-400 rounded-full w-24 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="bg-orange-500 rounded-full w-20 h-12 flex items-center justify-center">
                  <div className="w-3 h-3 bg-black rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-black rounded-full"></div>
                </div>
              </div>
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <div className="bg-orange-400 rounded-lg p-1">
                  <div className="w-8 h-6 bg-orange-500 rounded"></div>
                </div>
              </div>
            </div>

            {/* Inventory Icons */}
            <div className="flex justify-center items-center space-x-4 mb-8">
              <div className="bg-yellow-400 p-3 rounded-lg">
                <Warehouse className="h-8 w-8 text-gray-800" />
              </div>
              <div className="bg-green-400 p-3 rounded-lg">
                <Package className="h-8 w-8 text-gray-800" />
              </div>
              <div className="bg-blue-400 p-3 rounded-lg">
                <Truck className="h-8 w-8 text-gray-800" />
              </div>
              <div className="bg-purple-400 p-3 rounded-lg">
                <BarChart3 className="h-8 w-8 text-gray-800" />
              </div>
            </div>

            <div className="space-y-4">
              <Badge className="bg-blue-500 text-white px-3 py-1 text-sm">
                Inventory Management System
              </Badge>
              
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Welcome to
                <br />
                <span className="text-yellow-300">Stokku Inventory Management</span>
                <br />
                <span className="text-blue-200">System</span>
              </h1>

              <p className="text-xl text-blue-100 leading-relaxed max-w-xl mx-auto">
                Introducing new innovation for modern businesses. Stokku is a comprehensive 
                inventory management system that enables users to monitor and manage their 
                stock efficiently with real-time analytics and insights.
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <div className="flex items-center space-x-2 bg-blue-500 bg-opacity-30 rounded-lg px-3 py-2">
                  <TrendingUp className="h-5 w-5 text-yellow-300" />
                  <span className="text-sm">Real-time Analytics</span>
                </div>
                <div className="flex items-center space-x-2 bg-blue-500 bg-opacity-30 rounded-lg px-3 py-2">
                  <Shield className="h-5 w-5 text-green-300" />
                  <span className="text-sm">Secure & Reliable</span>
                </div>
                <div className="flex items-center space-x-2 bg-blue-500 bg-opacity-30 rounded-lg px-3 py-2">
                  <Users className="h-5 w-5 text-purple-300" />
                  <span className="text-sm">Multi-user Support</span>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="pt-8">
              <Link href="/auth/register">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium group"
                >
                  Get Started Today
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
