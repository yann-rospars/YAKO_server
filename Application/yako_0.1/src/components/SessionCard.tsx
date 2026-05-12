import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { MovieSession } from '../types/session'
import Badge from './ui/Badge'
import { C } from '../theme/colors'

const formatSessionTime = (d: string) =>
  new Date(d.includes('T') ? d : d.replace(' ', 'T'))
    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export default function SessionCard({ session }: { session: MovieSession }) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.time}>{formatSessionTime(session.starts_at)}</Text>

        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          {session.version && <Badge label={session.version} />}
          {session.projection && <Badge label={session.projection} />}
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.name} numberOfLines={1}>
          {session.cinema?.name}
        </Text>

        <Text style={styles.address} numberOfLines={1}>
          {session.cinema?.address}
        </Text>

        {session.booking_url && (
          <TouchableOpacity
            onPress={() => {
                if (session.booking_url) {
                    Linking.openURL(session.booking_url)
                }
            }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Réserver →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  left: { alignItems: 'center', minWidth: 52 },
  time: { color: C.green, fontSize: 18, fontWeight: '800' },
  right: { flex: 1 },
  name: { color: C.text, fontWeight: '700' },
  address: { color: C.muted, fontSize: 12 },
  button: {
    marginTop: 8,
    backgroundColor: C.accent,
    padding: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '700' },
})