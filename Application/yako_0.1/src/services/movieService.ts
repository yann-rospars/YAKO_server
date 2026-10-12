import { supabase } from '../lib/supabase'
import { Movie } from '../types/movie'
import {
  getCurrentISOString,
  getDateYearsAgo,
} from '../utils/date'

export type HomeMovieFilters = {
  priorityMovieIds?: number[]
  search?: string
  minYear?: string
  maxYear?: string
  genreIds?: number[]
  includeNewReleases?: boolean
  includeOlderReleases?: boolean
  futureSessionsOnly?: boolean
  offset?: number
  limit?: number
}

type MovieRow = {
  id: number
  tmdb_id: number | null
  title: string
  release_date: string | null
  popularity: number | null
  poster_path: string | null
}

type MovieGenreRow = {
  movie_id: number
}

/*
  Récupère les IDs des films correspondant
  aux genres sélectionnés.

  Logique OU :
  Action + Comédie =
  films Action OU Comédie.
*/
async function getMovieIdsForGenres(
  genreIds: number[]
): Promise<number[]> {
  if (genreIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('movie_genre')
    .select('movie_id')
    .in('genre_id', genreIds)

  if (error) {
    throw error
  }

  return Array.from(
    new Set(
      ((data ?? []) as MovieGenreRow[]).map(
        (row) => row.movie_id
      )
    )
  )
}

function cleanMovies(
  rows: MovieRow[]
): Movie[] {
  const moviesById =
    new Map<number, Movie>()

  for (const row of rows) {
    if (moviesById.has(row.id)) {
      continue
    }

    moviesById.set(row.id, {
      id: row.id,
      tmdb_id: row.tmdb_id,
      title: row.title,
      release_date:
        row.release_date ?? '',
      popularity:
        row.popularity ?? undefined,
      poster_path:
        row.poster_path ?? undefined,
    })
  }

  return Array.from(
    moviesById.values()
  )
}

/*
  Fonction principale utilisée
  par la Home.
*/
async function getHomeMoviePage({
  onlyIds,
  excludedIds,
  countPriority = false,
  search = '',
  minYear = '',
  maxYear = '',
  genreIds = [],
  includeNewReleases = true,
  includeOlderReleases = true,
  futureSessionsOnly = false,
  offset = 0,
  limit = 18,
}: HomeMovieFilters & { onlyIds?: number[]; excludedIds?: number[]; countPriority?: boolean }): Promise<{ movies: Movie[]; count: number }> {
  if (!includeNewReleases && !includeOlderReleases) return { movies: [], count: 0 }

  const nowISO =
    getCurrentISOString()

  /*
    ----------------------------------
    GENRES
    ----------------------------------
  */

  let genreMovieIds:
    | number[]
    | null = null

  if (genreIds.length > 0) {
    genreMovieIds =
      await getMovieIdsForGenres(
        genreIds
      )

    if (
      genreMovieIds.length === 0
    ) {
      return { movies: [], count: 0 }
    }
  }

  /*
    ----------------------------------
    REQUÊTE FILMS
    ----------------------------------
  */

  let query

  if (futureSessionsOnly) {
    query = supabase
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
      `, { count: countPriority ? 'exact' : undefined })
      .gt(
        'sessions.starts_at',
        nowISO
      )
  } else {
    query = supabase
      .from('movies')
      .select(`
        id,
        tmdb_id,
        title,
        release_date,
        popularity,
        poster_path
      `, { count: countPriority ? 'exact' : undefined })
  }

  /*
    ----------------------------------
    RECHERCHE
    ----------------------------------
  */

  if (onlyIds) query = query.in('id', onlyIds)
  if (excludedIds?.length) query = query.not('id', 'in', `(${excludedIds.join(',')})`)

  const formattedSearch =
    search.trim()

  if (
    formattedSearch.length > 0
  ) {
    query = query.ilike(
      'title',
      `%${formattedSearch}%`
    )
  }

  // Both categories selected means no restriction, including unknown release dates.
  if (includeNewReleases !== includeOlderReleases) {
    const cutoff = getDateYearsAgo(1)
    if (includeNewReleases) {
      query = query.gt('release_date', cutoff)
        .lte('release_date', nowISO.split('T')[0])
    } else {
      query = query.lte('release_date', cutoff)
    }
  }

  /*
    ----------------------------------
    DATE MINIMUM
    ----------------------------------
  */

  if (/^\d{4}$/.test(minYear)) {
    query = query.gte(
      'release_date',
      `${minYear}-01-01`
    )
  }

  /*
    ----------------------------------
    DATE MAXIMUM
    ----------------------------------
  */

  if (/^\d{4}$/.test(maxYear)) {
    query = query.lte(
      'release_date',
      `${maxYear}-12-31`
    )
  }

  /*
    ----------------------------------
    GENRES
    ----------------------------------
  */

  if (
    genreMovieIds !== null
  ) {
    query = query.in(
      'id',
      genreMovieIds
    )
  }

  /*
    ----------------------------------
    TRI + PAGINATION
    ----------------------------------

    Exemple :

    offset 0, limit 18
    → lignes 0 à 17

    offset 18, limit 18
    → lignes 18 à 35
  */

  query = query
    .order('popularity', {
      ascending: false,
    })
    .order('id', { ascending: true })
    .range(
      offset,
      offset + limit - 1
    )

  const { data, error, count } =
    await query

  if (error) {
    throw error
  }

  return { movies: cleanMovies((data ?? []) as MovieRow[]), count: count ?? 0 }
}

export async function getHomeMovies(filters: HomeMovieFilters = {}): Promise<Movie[]> {
  const ids = filters.futureSessionsOnly ? filters.priorityMovieIds ?? [] : []
  if (!ids.length) return (await getHomeMoviePage(filters)).movies
  const offset = filters.offset ?? 0
  const limit = filters.limit ?? 18
  const firstPage = await getHomeMoviePage({ ...filters, offset: 0, onlyIds: ids, countPriority: true })
  const priority = offset === 0 ? firstPage : {
    count: firstPage.count,
    movies: offset >= firstPage.count ? [] :
      (await getHomeMoviePage({ ...filters, onlyIds: ids })).movies,
  }
  if (priority.movies.length === limit) return priority.movies
  const remaining = await getHomeMoviePage({
    ...filters,
    excludedIds: ids,
    offset: Math.max(0, offset - priority.count),
    limit: limit - priority.movies.length,
  })
  return [...priority.movies, ...remaining.movies]
}

/*
  Compatibilité temporaire.

  Cette fonction n'est plus utilisée
  par la nouvelle Home, mais on la garde
  si un autre fichier l'appelle encore.
*/
export async function getOldMoviesWithFutureSessions(
  search: string = ''
): Promise<Movie[]> {
  return getHomeMovies({
    search,
    futureSessionsOnly: true,
    offset: 0,
    limit: 18,
  })
}
export async function getWatchlistMovieIds(): Promise<number[]> {
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError) throw authError
  if (!session) return []
  const ids: number[] = []
  const pageSize = 200
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from('list_movies')
      .select('movie_id, lists!inner()')
      .eq('lists.user_id', session.user.id)
      .eq('lists.type', 'system')
      .eq('lists.name', 'À voir au cinema')
      .order('movie_id', { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error) throw error
    const page = data ?? []
    ids.push(...page.map(row => row.movie_id as number))
    if (page.length < pageSize) break
  }
  return ids
}
