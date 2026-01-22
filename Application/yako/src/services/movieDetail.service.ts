import { supabase } from '../lib/supabase';

export async function fetchMovieById(movieId: number) {
  const { data, error } = await supabase
    .from('movies')
    .select(`
      id,
      title,
      original_title,
      overview,
      release_date,
      runtime,
      vote_average,
      poster_path,
      tmdb_id
    `)
    .eq('id', movieId)
    .single();

  if (error) {
    console.error('Error fetching movie detail:', error);
    throw error;
  }

  return data;
}
