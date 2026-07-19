import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

type HomeFooterProps = {
  onCalendarPress: () => void
  onSessionsPress: () => void
  onAccountPress: () => void
  onListsPress: () => void
}

export default function HomeFooter({
  onCalendarPress,
  onSessionsPress,
  onAccountPress,
  onListsPress,
}: HomeFooterProps) {
  return (
    <View style={styles.footer}>
      <FooterButton
        label="CALENDRIER"
        icon="▦"
        onPress={onCalendarPress}
      />

      <FooterButton
        label="SÉANCES"
        icon="▶"
        onPress={onSessionsPress}
      />

      <FooterButton
        label="COMPTE"
        icon="●"
        onPress={onAccountPress}
      />

      <FooterButton
        label="LISTES"
        icon="☰"
        onPress={onListsPress}
      />
    </View>
  )
}

type FooterButtonProps = {
  label: string
  icon: string
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
        <Text style={styles.footerIcon}>
          {icon}
        </Text>
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
    minHeight: 10,
    paddingHorizontal: 8,
    paddingTop: 5,
    paddingBottom: 0,
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

  footerIcon: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
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