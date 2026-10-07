import {
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from 'react-native'
import { COLORS } from '../theme/colors'

type Props = {
  days: {
    key: string
    label: string
  }[]
  selectedDate: string | null
  setSelectedDate: (date: string) => void
}

export default function SessionCalendar({
  days,
  selectedDate,
  setSelectedDate,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {days.map((day, index) => {
        const previousDay = days[index - 1]

        const isGap = previousDay
          ? new Date(day.key).getTime() -
              new Date(previousDay.key).getTime() >
            86400000
          : false

        const isSelected =
          selectedDate === day.key

        return (
          <View
            key={day.key}
            style={styles.dayWrapper}
          >
            {isGap && (
              <Text style={styles.gap}>
                ···
              </Text>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setSelectedDate(day.key)
              }
              style={[
                styles.dayButton,
                isSelected &&
                  styles.dayButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  isSelected &&
                    styles.dayTextSelected,
                ]}
              >
                {day.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  // ── LAYOUT ───────────────────────────

  content: {
    paddingVertical: 6,
    paddingRight: 4,
  },

  dayWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ── DAY BUTTON ───────────────────────

  dayButton: {
    minHeight: 42,

    marginRight: 10,
    paddingHorizontal: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 11,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 4,
  },

  dayButtonSelected: {
    backgroundColor: COLORS.primary,
  },

  dayText: {
    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  dayTextSelected: {
    color: COLORS.text2,
  },

  // ── GAP ──────────────────────────────

  gap: {
    marginRight: 10,

    color: COLORS.text2,

    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
})