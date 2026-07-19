import { supabase } from '../lib/supabase'
import { Cinema } from '../types/cinema'

export async function getCinemas(
  search: string = ''
): Promise<Cinema[]> {
  let query = supabase
    .from('cinemas')
    .select(`
      id,
      name,
      address,
      city,
      postal_code,
      image
    `)
    .order('name', {
      ascending: true,
    })
    .limit(9)

  const formattedSearch = search.trim()

  if (formattedSearch.length > 0) {
    query = query.or(
      `name.ilike.%${formattedSearch}%,city.ilike.%${formattedSearch}%,address.ilike.%${formattedSearch}%`
    )
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []) as Cinema[]
}