import { supabase } from '../lib/supabase'
import { Movie } from '../types/movie'
import {
  getCurrentISOString,
} from '../utils/date'

export type HomeMovieFilters = {
  search?: string
  minYear?: string
  maxYear?: string
  genreIds?: number[]
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
export async function getHomeMovies({
  search = '',
  minYear = '',
  maxYear = '',
  genreIds = [],
  futureSessionsOnly = false,
  offset = 0,
  limit = 18,
}: HomeMovieFilters = {}): Promise<Movie[]> {
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
      return []
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
      `)
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
      `)
  }

  /*
    ----------------------------------
    RECHERCHE
    ----------------------------------
  */

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
    .range(
      offset,
      offset + limit - 1
    )

  const { data, error } =
    await query

  if (error) {
    throw error
  }

  return cleanMovies(
    (data ?? []) as MovieRow[]
  )
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