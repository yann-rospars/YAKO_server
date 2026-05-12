import { View, Text, Image, TouchableOpacity } from 'react-native'
import { Movie } from '../types/movie'

type Props = {
  movie: Movie
  onPress: () => void
}

const CARD_WIDTH = 120
const CARD_HEIGHT = 180

export default function MovieCard({ movie, onPress }: Props) {
  const getImageUrl = () => {
    if (!movie.poster_path) return null

    if (movie.poster_path.startsWith('/img')) {
      return `https://fr.web.img6.acsta.net${movie.poster_path}`
    }

    return `https://image.tmdb.org/t/p/w500${movie.poster_path}`
  }

  const imageUrl = getImageUrl()

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        marginRight: 12,
        width: CARD_WIDTH
      }}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          resizeMode="cover"
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: 10
          }}
        />
      ) : (
        <View
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            backgroundColor: '#444',
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>No Image</Text>
        </View>
      )}

      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          marginTop: 5,
          fontSize: 12,
          fontWeight: '500',
          color: '#fff'
        }}
      >
        {movie.title}
      </Text>
    </TouchableOpacity>
  )
}