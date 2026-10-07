import {
  View,
  Text,
  StyleSheet,
} from 'react-native'

import { COLORS } from '../../theme/colors'

export default function Badge({
  label,
}: {
  label: string
}) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,

    backgroundColor: COLORS.secondary,

    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.contours,
  },

  text: {
    color: COLORS.text2,

    fontSize: 11,
    fontWeight: '600',
  },
})