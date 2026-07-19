import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { Cinema } from '../types/cinema'

type CinemaCardProps = {
  cinema: Cinema
  onPress: () => void
}

export default function CinemaCard({
  cinema,
  onPress,
}: CinemaCardProps) {
  const location = [cinema.postal_code, cinema.city]
    .filter(Boolean)
    .join(' ')

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      {cinema.image ? (
        <Image
          source={{ uri: cinema.image }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>🎬</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text
          style={styles.name}
          numberOfLines={2}
        >
          {cinema.name}
        </Text>

        {!!location && (
          <Text
            style={styles.location}
            numberOfLines={1}
          >
            {location}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 18,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',

    shadowColor: '#111111',
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },

  cardPressed: {
    transform: [
      { translateX: 3 },
      { translateY: 3 },
    ],
    shadowOffset: {
      width: 2,
      height: 2,
    },
    elevation: 2,
  },

  image: {
    width: '100%',
    aspectRatio: 1,
    borderBottomWidth: 3,
    borderBottomColor: '#111111',
    backgroundColor: '#E8E8E8',
  },

  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#111111',
    backgroundColor: '#FFE17A',
  },

  placeholderText: {
    fontSize: 42,
  },

    content: {
    minHeight: 52,
    paddingHorizontal: 7,
    paddingTop: 7,
    paddingBottom: 6,
    },

    name: {
    height: 24,          // réserve 2 lignes comme pour MovieCard
    color: '#111111',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
    textAlign: 'center',
    },

    location: {
    marginTop: 2,
    color: '#666666',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    },
})