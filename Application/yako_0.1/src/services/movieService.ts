import { supabase } from '../lib/supabase'
import { Movie } from '../types/movie'
import {
  getCurrentISOString,
  getDateYearsAgo,
} from '../utils/date'

type MovieWithSessionsRow = {
  id: number
  tmdb_id: number | null
  title: string
  release_date: string
  popularity: number | null
  poster_path: string | null
  sessions: {
    id: number
    starts_at: string
  }[]
}

function cleanMovies(
  rows: MovieWithSessionsRow[]
): Movie[] {
  const moviesById = new Map<number, Movie>()

  for (const row of rows) {
    if (moviesById.has(row.id)) {
      continue
    }

    moviesById.set(row.id, {
      id: row.id,
      tmdb_id: row.tmdb_id,
      title: row.title,
      release_date: row.release_date,
      popularity: row.popularity ?? undefined,
      poster_path: row.poster_path ?? undefined,
    })
  }

  return Array.from(moviesById.values())
}

export async function getOldMoviesWithFutureSessions(
  search: string = ''
): Promise<Movie[]> {
  const nowISO = getCurrentISOString()
  const twoYearsAgoDate = getDateYearsAgo(2)

  let query = supabase
    .from('movies')
    .select(`
      id,
      tmdb_id,
      title,
      release_date,
      popularity,
      poster_path,
      sessions!inner (
        id,
        starts_at
      )
    `)
    .lt('release_date', twoYearsAgoDate)
    .gt('sessions.starts_at', nowISO)
    .order('popularity', {
      ascending: false,
    })
    .limit(9)

  const formattedSearch = search.trim()

  if (formattedSearch.length > 0) {
    query = query.ilike(
      'title',
      `%${formattedSearch}%`
    )
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  const cleanedMovies = cleanMovies(
    (data ?? []) as MovieWithSessionsRow[]
  )

  return cleanedMovies.slice(0, 9)
}