import { supabase } from '../lib/supabase'
import { getCurrentISOString } from '../utils/date'

export async function getWatchlistSessionDays(): Promise<Set<string>> {
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError) throw authError
  const days = new Set<string>()
  if (!session) return days

  const now = getCurrentISOString()
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from('sessions')
      .select('starts_at, movies!inner(list_movies!inner(lists!inner()))')
      .eq('movies.list_movies.lists.user_id', session.user.id)
      .eq('movies.list_movies.lists.type', 'system')
      .eq('movies.list_movies.lists.name', 'À voir au cinema')
      .gt('starts_at', now)
      .order('starts_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error) throw error
    const rows = data ?? []
    for (const row of rows) {
      // Same calendar date as starts_at::date in get_session_days.
      days.add(row.starts_at.slice(0, 10))
    }
    if (rows.length < pageSize) break
  }
  return days
}
