'use client'

import { AdminDashboard } from '@/components/features/admin/AdminDashboard'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import { DataService } from '@/lib/data-service'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function AdminPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const isUsingSupabase = DataService.isUsingSupabase()
  
  // Use auth guard with admin role requirement
  const { isAdmin } = useAuthGuard({
    requireAuth: isUsingSupabase,
    requireRole: isUsingSupabase ? 'admin' : undefined,
    redirectTo: '/dashboard'
  })

  useEffect(() => {
    // Check for unauthorized access message
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'unauthorized') {
      toast.error('Access denied. Admin privileges required.')
      router.replace('/dashboard')
    }
  }, [router])

  // If using Supabase, show loading while auth is resolving
  if (isUsingSupabase && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If using Supabase but no user/profile, show loading
  if (isUsingSupabase && (!user || !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If using Supabase and user is not admin, access will be denied by AdminDashboard component
  // If not using Supabase, allow access (sample data mode)
  return <AdminDashboard />
}
