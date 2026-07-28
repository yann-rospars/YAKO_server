import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type HomeFooterProps = {
  onHomePress: () => void
  onCalendarPress: () => void
  onAccountPress: () => void
  onListsPress: () => void
}

export default function HomeFooter({
  onHomePress,
  onCalendarPress,
  onAccountPress,
  onListsPress,
}: HomeFooterProps) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.footer,
        {
          paddingBottom: Math.max(
            insets.bottom + 4,
            10
          ),
        },
      ]}
    >
      <FooterButton
        label="HOME"
        icon={
          <MaterialIcons
            name="home"
            size={22}
            color="#111111"
          />
        }
        onPress={onHomePress}
      />

      <FooterButton
        label="CALENDRIER"
        icon={
          <MaterialIcons
            name="calendar-month"
            size={22}
            color="#111111"
          />
        }
        onPress={onCalendarPress}
      />

      <FooterButton
        label="COMPTE"
        icon={
          <MaterialIcons
            name="person"
            size={22}
            color="#111111"
          />
        }
        onPress={onAccountPress}
      />

      <FooterButton
        label="LISTES"
        icon={
          <MaterialIcons
            name="bookmark"
            size={22}
            color="#111111"
          />
        }
        onPress={onListsPress}
      />
    </View>
  )
}

type FooterButtonProps = {
  label: string
  icon: React.ReactNode
  onPress: () => void
}

function FooterButton({
  label,
  icon,
  onPress,
}: FooterButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.footerButton,
        pressed && styles.footerButtonPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.footerIconContainer}>
        {icon}
      </View>

      <Text
        style={styles.footerLabel}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 8,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFE17A',
    borderTopWidth: 3,
    borderTopColor: '#111111',
  },

  footerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerButtonPressed: {
    opacity: 0.55,
    transform: [
      {
        translateY: 2,
      },
    ],
  },

  footerIconContainer: {
    width: 31,
    height: 29,
    marginBottom: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#111111',
    borderRadius: 8,
  },

  footerLabel: {
    maxWidth: '100%',
    color: '#111111',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.25,
    textAlign: 'center',
  },
})