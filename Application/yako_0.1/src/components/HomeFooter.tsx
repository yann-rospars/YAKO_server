import {
  Pressable,
  StyleSheet,
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
    <View>
      {/* FOOTER */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom:
              insets.bottom > 0
                ? 0
                : 10,
          },
        ]}
      >
        <FooterButton
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

      {/* SAFE AREA BASSE DYNAMIQUE */}
      {insets.bottom > 0 && (
        <View
          style={[
            styles.bottomSafeArea,
            {
              height: insets.bottom,
            },
          ]}
        />
      )}
    </View>
  )
}

type FooterButtonProps = {
  icon: React.ReactNode
  onPress: () => void
}

function FooterButton({
  icon,
  onPress,
}: FooterButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.footerButton,
        pressed &&
          styles.footerButtonPressed,
      ]}
      onPress={onPress}
    >
      <View
        style={
          styles.footerIconContainer
        }
      >
        {icon}
      </View>
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

  bottomSafeArea: {
    backgroundColor: '#FFE17A',
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

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#FFFFFF',

    borderWidth: 2,
    borderColor: '#111111',
    borderRadius: 8,
  },
})