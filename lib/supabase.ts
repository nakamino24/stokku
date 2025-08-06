import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mgzxipyxzubhyxkncxkn.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nenhpcHl4enViaHl4a25jeGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTE0MDksImV4cCI6MjA2OTc4NzQwOX0.HlJf034P3mHvEc8OWSIQs2jz8Nu38fVqALw7hT7VFM0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
