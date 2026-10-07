import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native'

import { COLORS } from '../theme/colors'

type AddButtonProps = {
  onPress: () => void
}

export default function AddButton({
  onPress,
}: AddButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ajouter"
    >
      <Text style={styles.text}>+</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 11,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 3,
  },

  text: {
    marginTop: -3,

    color: COLORS.icon,

    fontSize: 25,
    fontWeight: '900',
  },
})