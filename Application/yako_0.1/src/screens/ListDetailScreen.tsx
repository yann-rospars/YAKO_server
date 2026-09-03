import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native'

import { COLORS } from '../theme/colors'

type LoadingStateProps = {
  fullScreen?: boolean
  inline?: boolean
}

export default function LoadingState({
  fullScreen = false,
  inline = false,
}: LoadingStateProps) {
  if (inline) {
    return (
      <ActivityIndicator
        size="small"
        color={COLORS.icon}
      />
    )
  }

  return (
    <View
      style={[
        styles.container,
        fullScreen &&
          styles.fullScreen,
      ]}
    >
      <ActivityIndicator
        size="large"
        color={COLORS.icon}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: 180,

    alignItems: 'center',
    justifyContent: 'center',
  },

  fullScreen: {
    flex: 1,

    backgroundColor:
      COLORS.background,
  },
})