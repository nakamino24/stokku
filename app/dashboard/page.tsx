'use client'

import { useAuth } from '@/contexts/AuthContext'
import { DashboardClient } from '@/components/features/dashboard'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check for unauthorized access message
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'unauthorized') {
      toast.error('Access denied. Admin privileges required.')
      router.replace('/dashboard')
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    router.push('/auth/login')
    return null
  }

  return <DashboardClient />
}
