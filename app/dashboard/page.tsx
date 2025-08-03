import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { DashboardClient } from '@/components/dashboard-client'

export default async function DashboardPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div>Please log in to access the dashboard</div>
  }

  // Fetch initial data (you can replace this with actual database queries)
  // For now, we'll pass empty arrays and let the client handle the data
  const initialProducts: any[] = []
  const initialCategories: any[] = []
  const initialTransactions: any[] = []

  return (
    <DashboardClient 
      user={user}
      initialProducts={initialProducts}
      initialCategories={initialCategories}
      initialTransactions={initialTransactions}
    />
  )
}
