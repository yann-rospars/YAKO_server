import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native'

import { MovieSession } from '../types/session'
import Badge from './ui/Badge'
import { COLORS } from '../theme/colors'

const formatSessionTime = (
  date: string
) =>
  new Date(
    date.includes('T')
      ? date
      : date.replace(' ', 'T')
  ).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

export default function SessionCard({
  session,
}: {
  session: MovieSession
}) {
  const openBooking = async () => {
    if (!session.booking_url) return

    const canOpen = await Linking.canOpenURL(
      session.booking_url
    )

    if (canOpen) {
      await Linking.openURL(
        session.booking_url
      )
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        <View style={styles.timeBox}>
          <Text style={styles.time}>
            {formatSessionTime(session.starts_at)}
          </Text>
        </View>

        <View style={styles.cinemaInformation}>
          <Text
            style={styles.cinemaName}
            numberOfLines={2}
          >
            {session.cinema?.name ||
              'Cinéma inconnu'}
          </Text>

          {!!session.cinema?.postal_code && (
            <Text style={styles.postalCode}>
              {session.cinema.postal_code}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.sessionMetaRow}>
          {!!session.version && (
            <Badge label={session.version} />
          )}

          {!!session.projection && (
            <Badge label={session.projection} />
          )}
        </View>

        {!!session.booking_url && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openBooking}
            style={styles.bookingButton}
          >
            <Text style={styles.bookingButtonText}>
              RÉSERVER →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // ── CARD ─────────────────────────────

  card: {
    marginBottom: 12,
    padding: 12,

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 14,
  },

  // ── MAIN ROW ─────────────────────────

  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 12,
  },

  timeColumn: {
    width: 86,

    flexShrink: 0,
    alignItems: 'center',
  },

  timeBox: {
    width: 82,
    minHeight: 44,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 10,
  },

  time: {
    color: COLORS.text2,

    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  // ── CINEMA INFORMATION ───────────────

  information: {
    flex: 1,
    minWidth: 0,

    justifyContent: 'space-between',
  },

  cinemaInformation: {
    flex: 1,
    minWidth: 0,
  },

  cinemaName: {
    color: COLORS.text2,

    fontSize: 14,
    fontWeight: '900',
    lineHeight: 17,
  },

  address: {
    marginTop: 5,

    color: COLORS.text2,

    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },

  location: {
    marginTop: 2,

    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '700',
  },

  postalCode: {
    marginTop: 4,

    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '800',
  },

  // ── BOTTOM ROW ───────────────────────

  bottomRow: {
    marginTop: 10,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,
  },

  badges: {
    width: '100%',

    marginTop: 9,

    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',

    gap: 5,
  },

  // ── BOOKING BUTTON ───────────────────

  bookingRow: {
    marginTop: 10,

    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  bookingButton: {
    minHeight: 32,

    paddingHorizontal: 12,
    paddingVertical: 4,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 9,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 3,
  },

  bookingButtonText: {
    color: COLORS.text2,

    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
})