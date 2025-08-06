'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'
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
  ChevronRight,
  Mail,
  Lock,
  User as UserIcon,
  ArrowLeft
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { DataService } from '@/lib/data-service'

export function LandingPage() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  
  // Check if we're in sample data mode
  const isUsingSupabase = DataService.isUsingSupabase()
  
  const handleDemoAccess = () => {
    toast.success('Entering demo mode with sample data!')
    router.push('/dashboard')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      toast.success('Login successful!')
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    
    if (!fullName.trim()) {
      toast.error('Please enter your full name')
      return
    }
    
    setLoading(true)

    try {
      await signUp(email, password, fullName)
      toast.success('Account created! Please check your email for verification.')
      // Clear form fields and switch to login
      setEmail('')
      setPassword('')
      setFullName('')
      setAuthMode('login')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {authMode === 'login' ? 'Login' : 'Join Stokku'}
            </h1>
            <p className="text-gray-600">
              {authMode === 'login' 
                ? 'Welcome back! Please log-in to access our system!' 
                : 'Create your account and start managing inventory efficiently'
              }
            </p>
          </div>

          {/* Auth Form */}
          <Card className="backdrop-blur-sm bg-white/95 shadow-xl border-0">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-xl font-semibold text-center">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-center">
                {authMode === 'login' 
                  ? 'Enter your credentials to continue' 
                  : 'Fill in your details to get started'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={authMode === 'login' ? handleLogin : handleSignUp}>
                <div className="space-y-4">
                  {authMode === 'register' && (
                    <div>
                      <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</Label>
                      <div className="relative mt-1">
                        <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="fullName"
                          name="fullName"
                          type="text"
                          autoComplete="name"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={authMode === 'login' ? 'Enter your email' : 'Enter your email'}
                        className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={authMode === 'login' ? 'Enter your password' : 'Create a password (min. 6 characters)'}
                        className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    type="submit"
                    disabled={loading || !email || !password || (authMode === 'register' && !fullName)}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {authMode === 'login' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      authMode === 'login' ? 'Sign In' : 'Create Account'
                    )}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        {authMode === 'login' ? 'New to Stokku?' : 'Already have an account?'}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login')
                      // Clear form fields when switching modes
                      setEmail('')
                      setPassword('')
                      setFullName('')
                    }}
                    className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-200"
                  >
                    {authMode === 'login' ? 'Create New Account' : 'Sign In Instead'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Demo Mode Button for Sample Data */}
          {!isUsingSupabase && (
            <Card className="backdrop-blur-sm bg-amber-50/95 shadow-xl border-2 border-amber-200">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg font-semibold text-center text-amber-800">
                  🚀 Demo Mode Available
                </CardTitle>
                <CardDescription className="text-center text-amber-700">
                  Experience Stokku with sample data - no signup required!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleDemoAccess}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Try Demo Now
                </Button>
                <p className="text-xs text-amber-600 text-center mt-2">
                  No registration needed • Sample data included • Full features available
                </p>
              </CardContent>
            </Card>
          )}

          {/* Security Badge */}
          <div className="flex justify-center">
            <Badge className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
              <Shield className="w-3 h-3 mr-1" />
              {authMode === 'login' 
                ? 'Secured with enterprise-grade encryption' 
                : 'Your data is encrypted and secure'
              }
            </Badge>
          </div>
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
              <Button 
                size="lg" 
                onClick={() => {
                  if (isUsingSupabase) {
                    setAuthMode('register')
                  } else {
                    handleDemoAccess()
                  }
                }}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium group"
              >
                {isUsingSupabase ? 'Get Started Today' : 'Try Demo Now'}
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
