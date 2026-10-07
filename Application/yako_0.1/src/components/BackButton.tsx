import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { COLORS } from '../theme/colors'

export const BACK_BUTTON_SIZE = 44

type BackButtonProps = {
  onPress: () => void
  accessibilityLabel?: string
}

export default function BackButton({
  onPress,
  accessibilityLabel = 'Retour',
}: BackButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.button}
    >
      <Text style={styles.arrow}>{'\u2190'}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 12,
    shadowColor: COLORS.contours,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  arrow: {
    marginTop: -2,
    color: COLORS.return,
    fontSize: 24,
    fontWeight: '900',
  },
})
