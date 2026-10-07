export type Movie = {
  id: number
  title: string
  original_title?: string

  release_date: string
  runtime?: number

  original_language?: string
  is_adult?: boolean

  overview?: string

  poster_path?: string
  backdrop_path?: string

  popularity?: number

  vote_average?: number
  vote_count?: number

  tmdb_id?: number | null
}