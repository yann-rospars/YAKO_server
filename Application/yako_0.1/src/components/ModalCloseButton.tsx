import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { COLORS } from '../theme/colors'

type Props = {
  onPress: () => void
  disabled?: boolean
}

export default function ModalCloseButton({ onPress, disabled = false }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Fermer"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
    >
      <Text style={styles.cross}>{'\u00D7'}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,

    marginLeft: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 10,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 3,
  },

  cross: {
    marginTop: -3,

    color: COLORS.icon,

    fontSize: 24,
    fontWeight: '900',
  },

})
