import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(
  'https://hkhmipoxoetjzplqjctr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhraG1pcG94b2V0anpwbHFqY3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzA2NTcsImV4cCI6MjA3OTkwNjY1N30.Y3JgIUCUEUJJGeuChJo_3Hd_NRwjCIedF9Jk68zupuo',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)