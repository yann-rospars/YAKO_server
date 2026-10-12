import { useMemo, useRef, useState } from 'react'
import { PanResponder, StyleSheet, Text, View } from 'react-native'
import { COLORS } from '../theme/colors'

export type TimeRange = [number, number]
const MAX = 1439
const format = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`

export default function TimeRangeFilter({ value, onChange }: {
  value: TimeRange
  onChange: (value: TimeRange) => void
}) {
  const [draft, setDraft] = useState<TimeRange | null>(null)
  const [width, setWidth] = useState(0)
  const current = useRef({ value, onChange, width })
  current.current = { value, onChange, width }
  const drag = useRef<{ range: TimeRange; start: number } | null>(null)
  const responders = useMemo(() => [0, 1].map(index => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      drag.current = { range: [...current.current.value], start: current.current.value[index] }
      setDraft([...current.current.value])
    },
    onPanResponderMove: (_, gesture) => {
      if (!drag.current) return
      const raw = drag.current.start + gesture.dx / Math.max(1, current.current.width - 24) * MAX
      const snapped = raw >= MAX - 7 ? MAX : Math.round(raw / 15) * 15
      const range: TimeRange = [...drag.current.range]
      range[index] = index === 0 ? Math.max(0, Math.min(snapped, range[1]))
        : Math.min(MAX, Math.max(snapped, range[0]))
      drag.current.range = range
      setDraft(range)
    },
    onPanResponderRelease: () => {
      if (drag.current) current.current.onChange(drag.current.range)
      drag.current = null
      setDraft(null)
    },
    onPanResponderTerminate: () => { drag.current = null; setDraft(null) },
    onPanResponderTerminationRequest: () => false,
  })), [])
  const range = draft ?? value
  const trackWidth = Math.max(0, width - 24)
  return (
    <View style={styles.container} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
        {format(range[0])} - {format(range[1])}
      </Text>
      <View style={styles.slider}>
        <View style={styles.track} />
        <View style={[styles.selection, { left: 12 + range[0] / MAX * trackWidth,
          width: (range[1] - range[0]) / MAX * trackWidth }]} />
        {responders.map((responder, index) => (
          <View key={index} {...responder.panHandlers}
            accessible accessibilityRole="adjustable"
            accessibilityLabel={index === 0 ? 'Heure de début' : 'Heure de fin'}
            accessibilityValue={{ min: 0, max: MAX, now: range[index], text: format(range[index]) }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={event => {
              const next: TimeRange = [...value]
              const delta = event.nativeEvent.actionName === 'increment' ? 15 : -15
              next[index] = Math.max(index === 0 ? 0 : next[0], Math.min(index === 0 ? next[1] : MAX, next[index] + delta))
              onChange(next)
            }}
            style={[styles.handleArea, { left: range[index] / MAX * trackWidth }]}>
            <View style={styles.handle} />
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, minWidth: 0 },
  label: { fontSize: 10, lineHeight: 12, includeFontPadding: false, fontWeight: '900', color: COLORS.text2, textAlign: 'center' },
  slider: { height: 20, position: 'relative', marginTop: -8 },
  track: { position: 'absolute', left: 12, right: 12, top: 12, height: 4, borderRadius: 2, backgroundColor: COLORS.secondary },
  selection: { position: 'absolute', top: 12, height: 4, backgroundColor: COLORS.contours },
  handleArea: { position: 'absolute', top: 0, width: 24, height: 28, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.secondary, borderWidth: 2, borderColor: COLORS.contours },
})
