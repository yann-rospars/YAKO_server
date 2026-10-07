import { Pressable, StyleSheet, Text } from 'react-native'
import { COLORS } from '../theme/colors'

type Props = {
  onPress: () => void
}

export default function SearchClearButton({ onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Effacer la recherche"
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text allowFontScaling={false} style={styles.cross}>{'\u00D7'}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 30,
    alignSelf: 'stretch',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  cross: {
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: COLORS.icon,
    fontSize: 33,
    fontWeight: '600',
    lineHeight: 35,
  },
})
