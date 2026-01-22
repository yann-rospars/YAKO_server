import { View, Text, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';
import { fetchMovieById } from '../services/movieDetail.service';
import { MovieDetail } from '../types/movieDetail';
import { getPosterUrl } from '../lib/tmdb';

type MovieDetailRouteProp = RouteProp<
  HomeStackParamList,
  'MovieDetail'
>;

export default function MovieDetailScreen() {
  const route = useRoute<MovieDetailRouteProp>();
  const { movieId } = route.params;

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovieById(movieId)
      .then(setMovie)
      .finally(() => setLoading(false));
  }, [movieId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Film introuvable</Text>
      </View>
    );
  }

  const posterUrl = getPosterUrl(movie);

  return (
    <ScrollView style={{ padding: 16 }}>
      {posterUrl && (
        <Image
          source={{ uri: posterUrl }}
          style={{
            width: '100%',
            height: 400,
            borderRadius: 12,
            marginBottom: 16,
            backgroundColor: '#ddd',
          }}
          resizeMode="cover"
        />
      )}

      <Text style={{ fontSize: 22, fontWeight: '700' }}>
        {movie.title}
      </Text>

      {movie.original_title !== movie.title && (
        <Text style={{ fontStyle: 'italic', marginBottom: 8 }}>
          {movie.original_title}
        </Text>
      )}

      <Text style={{ marginBottom: 8 }}>
        {movie.release_date} • {movie.runtime} min
      </Text>

      <Text style={{ marginBottom: 16 }}>
        {movie.vote_average}
      </Text>

      {movie.overview && (
        <Text style={{ lineHeight: 20 }}>
          {movie.overview}
        </Text>
      )}
    </ScrollView>
  );
}
