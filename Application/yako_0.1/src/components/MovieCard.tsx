import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Movie } from '../types/movie'

const COLORS = {
  primary: '#FFE17A',
  white: '#FFFFFF',
  black: '#111111',
  grey: '#777777',
  lightGrey: '#F4F1E8',
}

type Props = {
  movie: Movie
  onPress: () => void
}

export default function MovieCard({ movie, onPress }: Props) {
  const getImageUrl = () => {
    if (!movie.poster_path) return null

    if (
      movie.poster_path.startsWith('http://') ||
      movie.poster_path.startsWith('https://')
    ) {
      return movie.poster_path
    }

    if (movie.poster_path.startsWith('/img')) {
      return `https://fr.web.img6.acsta.net${movie.poster_path}`
    }

    return `https://image.tmdb.org/t/p/w500${movie.poster_path}`
  }

  const getReleaseYear = () => {
    if (!movie.release_date) return null

    const date = new Date(movie.release_date)

    if (Number.isNaN(date.getTime())) return null

    return date.getFullYear()
  }

  const imageUrl = getImageUrl()
  const releaseYear = getReleaseYear()

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrapper,
        pressed && styles.wrapperPressed,
      ]}
    >
      <View style={styles.card}>
        <View style={styles.posterContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              resizeMode="cover"
              style={styles.poster}
            />
          ) : (
            <View style={styles.posterPlaceholder}>
              <Text style={styles.placeholderIcon}>🎬</Text>

              <Text style={styles.placeholderText}>
                AFFICHE{'\n'}INDISPONIBLE
              </Text>
            </View>
          )}
        </View>

        <View style={styles.information}>
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            allowFontScaling={false}
            style={styles.title}
          >
            {movie.title}
          </Text>

          {releaseYear !== null && (
            <Text
              allowFontScaling={false}
              style={styles.releaseYear}
            >
              {releaseYear}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 15,
  },

  wrapperPressed: {
    transform: [
      {
        translateX: 2,
      },
      {
        translateY: 2,
      },
    ],
    opacity: 0.9,
  },

  card: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    borderWidth: 2.5,
    borderColor: COLORS.black,
    borderRadius: 10,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },

  posterContainer: {
    width: '100%',
    aspectRatio: 2 / 3,
    overflow: 'hidden',
    backgroundColor: COLORS.lightGrey,
    borderBottomWidth: 2.5,
    borderBottomColor: COLORS.black,
  },

  poster: {
    width: '100%',
    height: '100%',
  },

  posterPlaceholder: {
    flex: 1,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },

  placeholderIcon: {
    marginBottom: 8,
    fontSize: 24,
  },

  placeholderText: {
    color: COLORS.black,
    fontSize: 7,
    fontWeight: '900',
    lineHeight: 10,
    letterSpacing: 0.4,
    textAlign: 'center',
  },

  information: {
    paddingHorizontal: 7,
    paddingTop: 7,
    paddingBottom: 6,
  },

  title: {
    height: 24,
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },

  releaseYear: {
    marginTop: 2,
    color: COLORS.grey,
    fontSize: 9,
    fontWeight: '800',
  },
})

