import {
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.content}>
        <Text
          style={styles.name}
          numberOfLines={2}
        >
          {cinema.name}
        </Text>

        {!!cinema.address && (
          <Text
            style={styles.address}
            numberOfLines={2}
          >
            {cinema.address}
          </Text>
        )}
      </View>

      <Text style={styles.arrow}>
        ›
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 58,

    marginBottom: 8,

    paddingHorizontal: 14,
    paddingVertical: 10,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderWidth: 2,
    borderColor: '#111111',
    borderRadius: 10,

    shadowColor: '#111111',
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },

  cardPressed: {
    transform: [
      {
        translateX: 2,
      },
      {
        translateY: 2,
      },
    ],

    shadowOffset: {
      width: 1,
      height: 1,
    },

    elevation: 1,
  },

  content: {
    flex: 1,
    minWidth: 0,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  name: {
    flex: 1,

    marginRight: 16,

    color: '#111111',

    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },

  address: {
    width: '38%',

    color: '#666666',

    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,

    textAlign: 'right',
  },

  arrow: {
    marginLeft: 10,

    color: '#111111',

    fontSize: 24,
    fontWeight: '900',
    lineHeight: 25,
  },
})