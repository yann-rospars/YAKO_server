import { supabase } from '../lib/supabase';

export async function fetchMainFrenchTrailer(movieId: number) {
  const { data, error } = await supabase
    .from('movie_trailers')
    .select('youtube_key')
    .eq('movie_id', movieId)
    .eq('language', 'fr')
    .eq('is_main', true)
    .limit(1)
    .single();

  if (error) {
    // Pas une vraie erreur : juste aucun trailer
    return null;
  }

  return data.youtube_key;
}
