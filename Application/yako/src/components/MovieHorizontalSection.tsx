import { View, Text, FlatList } from 'react-native';
import { Movie } from '../types/movie';
import MovieCard from './MovieCard';

type Props = {
  title: string;
  movies: Movie[];
  onMoviePress: (movieId: number) => void;
};

export default function MovieHorizontalSection({
  title,
  movies,
  onMoviePress,
}: Props) {
  return (
    <View style={{ marginVertical: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 12 }}>
        {title}
      </Text>

      <FlatList
        data={movies}
        horizontal
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <MovieCard
            movie={item}
            onPress={() => onMoviePress(item.id)}
          />
        )}
      />
    </View>
  );
}
