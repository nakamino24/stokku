'use client'

import { useAuth } from '@/contexts/AuthContext'
import { DashboardClient } from '@/components/features/dashboard'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { DataService } from '@/lib/data-service'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  
  // Check if we're using Supabase or sample data mode
  const isUsingSupabase = DataService.isUsingSupabase()

  useEffect(() => {
    // Check for unauthorized access message
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'unauthorized') {
      toast.error('Access denied. Admin privileges required.')
      router.replace('/dashboard')
    }
  }, [])

  useEffect(() => {
    // Only redirect unauthenticated users if using Supabase
    if (isUsingSupabase && !loading && (!user || !profile)) {
      router.push('/')
    }
  }, [user, profile, loading, router, isUsingSupabase])

  // Show loading only if using Supabase and still loading
  if (isUsingSupabase && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show loading only if using Supabase and no user/profile
  if (isUsingSupabase && (!user || !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <DashboardClient />
}
