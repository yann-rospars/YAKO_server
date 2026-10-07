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

  const formattedSearch =
    search.trim()

  if (formattedSearch.length > 0) {
    query = query.or(
      `name.ilike.%${formattedSearch}%,city.ilike.%${formattedSearch}%,address.ilike.%${formattedSearch}%`
    )
  }

  const { data, error } =
    await query

  if (error) {
    throw error
  }

  return (data ?? []) as Cinema[]
}

export type CinemaSessionRow = {
  id: number
  starts_at: string
  projection: string | null
  version: string | null
  booking_url: string | null

  movie: {
    id: number
    title: string
    poster_path: string | null
    release_date: string | null

    movie_people: {
      role_type: string
      person: {
        name: string
      } | null
    }[]
  } | null
}

export type CinemaDetail = {
  id: number
  name: string
  address: string
  city: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  sessions: CinemaSessionRow[]
}

export async function getCinemaDetail(
  cinemaId: number
): Promise<CinemaDetail> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('cinemas')
    .select(`
      id,
      name,
      address,
      city,
      postal_code,
      latitude,
      longitude,
      sessions (
        id,
        starts_at,
        projection,
        version,
        booking_url,
        movie:movies (
          id,
          title,
          poster_path,
          release_date,
          movie_people (
            role_type,
            person:peoples (
              name
            )
          )
        )
      )
    `)
    .eq('id', cinemaId)
    .gt('sessions.starts_at', now)
    .order('starts_at', {
      referencedTable: 'sessions',
      ascending: true,
    })
    .single()

  if (error) {
    throw error
  }

  const normalizedSessions: CinemaSessionRow[] =
    (data.sessions ?? []).map((session: any) => ({
      id: session.id,
      starts_at: session.starts_at,
      projection: session.projection,
      version: session.version,
      booking_url: session.booking_url,

      movie: Array.isArray(session.movie)
        ? session.movie[0] ?? null
        : session.movie ?? null,
    }))

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    city: data.city,
    postal_code: data.postal_code,
    latitude: data.latitude,
    longitude: data.longitude,
    sessions: normalizedSessions,
  }
}