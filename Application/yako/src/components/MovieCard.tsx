import { View, Text, Image, Pressable } from 'react-native';
import { Movie } from '../types/movie';
import { getPosterUrl } from '../lib/tmdb';

type Props = {
  movie: Movie;
  onPress: () => void;
};

export default function MovieCard({ movie, onPress }: Props) {
  const posterUrl = getPosterUrl(movie);

  return (
    <Pressable
      onPress={onPress}
      style={{ width: 120, marginHorizontal: 8 }}
    >
      {posterUrl ? (
        <Image
          source={{ uri: posterUrl }}
          style={{
            width: 120,
            height: 180,
            borderRadius: 8,
            marginBottom: 6,
            backgroundColor: '#ddd',
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 120,
            height: 180,
            backgroundColor: '#eee',
            borderRadius: 8,
            marginBottom: 6,
          }}
        />
      )}

      <Text numberOfLines={2}>{movie.title}</Text>
    </Pressable>
  );
}
