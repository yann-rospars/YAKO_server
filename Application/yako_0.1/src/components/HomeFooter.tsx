import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type HomeFooterProps = {
  activeTab: string | null
  onHomePress: () => void
  onCalendarPress: () => void
  onAccountPress: () => void
  onListsPress: () => void
}

export default function HomeFooter({
  activeTab,
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
          active={activeTab === 'Home'}
          label="Accueil"
          icon={
            <MaterialIcons
              name="home"
              size={22}
              color={activeTab === 'Home' ? '#FFFFFF' : '#111111'}
            />
          }
          onPress={onHomePress}
        />

        <FooterButton
          active={activeTab === 'Calendar'}
          label="Calendrier"
          icon={
            <MaterialIcons
              name="calendar-month"
              size={22}
              color={activeTab === 'Calendar' ? '#FFFFFF' : '#111111'}
            />
          }
          onPress={onCalendarPress}
        />

        <FooterButton
          active={activeTab === 'Account'}
          label="Compte"
          icon={
            <MaterialIcons
              name="person"
              size={22}
              color={activeTab === 'Account' ? '#FFFFFF' : '#111111'}
            />
          }
          onPress={onAccountPress}
        />

        <FooterButton
          active={activeTab === 'Lists'}
          label="Listes"
          icon={
            <MaterialIcons
              name="bookmark"
              size={22}
              color={activeTab === 'Lists' ? '#FFFFFF' : '#111111'}
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
  active: boolean
  label: string
  icon: React.ReactNode
  onPress: () => void
}

function FooterButton({
  active,
  label,
  icon,
  onPress,
}: FooterButtonProps) {
  return (
    <Pressable
      style={styles.footerButton}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
    >
      <View
        style={[
          styles.footerIconContainer,
          active && styles.footerIconContainerActive,
        ]}
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

  footerIconContainerActive: {
    backgroundColor: '#111111',
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
