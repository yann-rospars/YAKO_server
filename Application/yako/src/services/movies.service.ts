import { supabase } from '../lib/supabase';
import { Movie } from '../types/movie';

export async function fetchPopularMovies(): Promise<Movie[]> {
  const { data, error } = await supabase
    .from('movies')
    .select('id, title, poster_path, release_date, popularity, tmdb_id')
    .not('tmdb_id', 'is', null)        // ✅ films validés
    .not('popularity', 'is', null)    // ✅ tri fiable
    .order('popularity', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }

  return data ?? [];
}

