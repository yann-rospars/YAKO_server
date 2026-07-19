import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native'

export default function LoadingState() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator
          size="large"
          color="#111111"
        />

        <Text style={styles.text}>
          CHARGEMENT...
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  card: {
    minWidth: 180,
    paddingHorizontal: 25,
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#FFE17A',
    borderWidth: 3,
    borderColor: '#111111',
    borderRadius: 17,

    shadowColor: '#111111',
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 6,
  },

  text: {
    marginTop: 14,
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
})