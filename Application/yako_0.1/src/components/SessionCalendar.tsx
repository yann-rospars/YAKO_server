import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native'
import { C } from '../theme/colors'

type Props = {
  days: { key: string; label: string }[]
  selectedDate: string | null
  setSelectedDate: (d: string) => void
}

export default function SessionCalendar({ days, selectedDate, setSelectedDate }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 4 }}
    >
      {days.map((day, index) => {
        const prev = days[index - 1]
        const isGap = prev
          ? new Date(day.key).getTime() - new Date(prev.key).getTime() > 86400000
          : false
        const isSelected = selectedDate === day.key

        return (
          <View key={day.key} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isGap && (
              <Text style={styles.gap}>···</Text>
            )}
            <TouchableOpacity
              onPress={() => setSelectedDate(day.key)}
              style={[styles.btn, isSelected && styles.selected]}
            >
              <Text style={[styles.text, isSelected && styles.textSelected]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          </View>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  btn: {
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  selected: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  text: {
    color: C.muted,
    fontWeight: '600',
    fontSize: 12,
  },
  textSelected: {
    color: 'white',
  },
  gap: {
    color: C.muted,
    marginRight: 8,
    fontSize: 14,
    letterSpacing: 2,
  },
})