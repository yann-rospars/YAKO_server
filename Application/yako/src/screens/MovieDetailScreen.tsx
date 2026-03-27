import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { useEffect, useState } from 'react';
import {
  RouteProp,
  useRoute,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';
import { fetchMovieById } from '../services/movieDetail.service';
import { MovieDetail } from '../types/movieDetail';
import { getPosterUrl } from '../lib/tmdb';
import { fetchMainFrenchTrailer } from '../services/movieTrailer.service';
import { WebView } from 'react-native-webview';


type MovieDetailRouteProp = RouteProp<
  HomeStackParamList,
  'MovieDetail'
>;

type NavigationProp = NativeStackNavigationProp<
  HomeStackParamList
>;

export default function MovieDetailScreen() {
  const route = useRoute<MovieDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { movieId } = route.params;

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  // 1️⃣ Chargement du film
  useEffect(() => {
    fetchMovieById(movieId)
      .then(setMovie)
      .finally(() => setLoading(false));
  }, [movieId]);

  // 2️⃣ Chargement de la bande-annonce FR principale
  useEffect(() => {
    if (!movie) return;

    fetchMainFrenchTrailer(movie.id)
      .then(setTrailerKey)
      .catch(() => setTrailerKey(null));
  }, [movie]);

  // Loader
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Film introuvable
  if (!movie) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Film introuvable</Text>
      </View>
    );
  }

  const posterUrl = getPosterUrl(movie); // ERREUR ICI

  return (
    <ScrollView style={{ padding: 16 }}>
      {/* Affiche */}
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

      {/* Titres */}
      <Text style={{ fontSize: 22, fontWeight: '700' }}>
        {movie.title}
      </Text>

      {movie.original_title !== movie.title && (
        <Text style={{ fontStyle: 'italic', marginBottom: 8 }}>
          {movie.original_title}
        </Text>
      )}

      {/* Infos */}
      <Text style={{ marginBottom: 8 }}>
        {movie.release_date} • {movie.runtime} min
      </Text>

      <Text style={{ marginBottom: 16 }}>
        ⭐ {movie.vote_average}
      </Text>

      {/* Synopsis */}
      {movie.overview && (
        <Text style={{ lineHeight: 20, marginBottom: 16 }}>
          {movie.overview}
        </Text>
      )}

      {/* Bouton bande-annonce */}
      {trailerKey && (
        <Pressable
          onPress={() =>
            navigation.navigate('Trailer', {
              youtubeKey: trailerKey,
            })
          }
          style={{
            marginTop: 20,
            padding: 14,
            backgroundColor: '#000',
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              color: '#fff',
              textAlign: 'center',
              fontSize: 16,
            }}
          >
            ▶️ Voir la bande-annonce
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
