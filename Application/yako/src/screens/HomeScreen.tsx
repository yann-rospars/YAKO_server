import { ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import HeaderSearch from '../components/HeaderSearch';
import MovieHorizontalSection from '../components/MovieHorizontalSection';
import { fetchPopularMovies } from '../services/movies.service';
import { Movie } from '../types/movie';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';

export default function HomeScreen() {
  const [trending, setTrending] = useState<Movie[]>([]);
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  useEffect(() => {
    fetchPopularMovies().then(setTrending);
  }, []);

  const handleMoviePress = (movieId: number) => {
    navigation.navigate('MovieDetail', { movieId });
  };

  return (
    <ScrollView>
      <HeaderSearch />

      <MovieHorizontalSection
        title="Trending actuelle"
        movies={trending}
        onMoviePress={handleMoviePress}
      />

      <MovieHorizontalSection
        title="Coming back in Paris"
        movies={trending}
        onMoviePress={handleMoviePress}
      />

      <MovieHorizontalSection
        title="Maybe this one is your cam"
        movies={trending}
        onMoviePress={handleMoviePress}
      />
    </ScrollView>
  );
}
