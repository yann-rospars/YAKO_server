import { View, Text, StyleSheet } from 'react-native'
import { C } from '../../theme/colors'

export default function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: C.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  text: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '600',
  },
})