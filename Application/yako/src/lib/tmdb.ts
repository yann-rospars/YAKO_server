import { Movie } from '../types/movie';

export function getPosterUrl(
  movie: Movie,
  size: 'w200' | 'w300' | 'w500' = 'w300'
): string | null {
  // Film non validé → pas d’image
  if (!movie.tmdb_id) return null;

  // Poster TMDB obligatoire
  if (!movie.poster_path) return null;

  return `https://image.tmdb.org/t/p/${size}${movie.poster_path}`;
}
