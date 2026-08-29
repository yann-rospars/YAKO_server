import { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '../theme/colors'

export default function CompleteProfileScreen({
  onComplete,
}: {
  onComplete: () => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!username) {
      alert('Enter a username')
      return
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('User not found')
      setLoading(false)
      return
    }

    const { error: profileError, data: profileData } = await supabase
      .from('users')
      .update({ username })
      .eq('id', user.id)
      .select()

    console.log('profileData:', profileData)
    console.log('profileError:', profileError)

    if (profileError) {
      if (
        profileError.message.toLowerCase().includes('duplicate') ||
        profileError.message.toLowerCase().includes('username')
      ) {
        alert("Ce pseudo est déjà pris. Choisis-en un autre.")
      } else {
        alert("Une erreur est survenue. Réessaie dans quelques instants.")
        console.error(profileError)
      }

      setLoading(false)
      return
    }

    const { error: passwordError } = await supabase.auth.updateUser({
      password: password,
    })

    if (passwordError) {
      alert(passwordError.message)
      setLoading(false)
      return
    }

    await supabase.auth.refreshSession()
    onComplete()
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.primary}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>YAKO</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.decorativeLine} />

          <View style={styles.card}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>DERNIÈRE ÉTAPE</Text>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>COMPLÈTE TON PROFIL</Text>

            </View>

            {/* <View style={styles.fieldContainer}>
              <Text style={styles.label}>PSEUDO</Text>

              <TextInput
                placeholder="Ton pseudo"
                placeholderTextColor={COLORS.grey}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>MOT DE PASSE</Text>

              <TextInput
                key="profile-password"
                placeholder="6 caractères minimum"
                placeholderTextColor={COLORS.grey}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="new-password"
                allowFontScaling={false}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>CONFIRMER LE MOT DE PASSE</Text>

              <TextInput
                key="profile-confirm-password"
                placeholder="Encore"
                placeholderTextColor={COLORS.grey}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="new-password"
                allowFontScaling={false}
                style={styles.input}
              />
            </View> */}

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>PSEUDO</Text>

              <View style={styles.inputWrapper}>
                {!username && (
                  <Text pointerEvents="none" style={styles.customPlaceholder}>
                    Ton pseudo
                  </Text>
                )}

                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  allowFontScaling={false}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>MOT DE PASSE</Text>

              <View style={styles.inputWrapper}>
                {!password && (
                  <Text pointerEvents="none" style={styles.customPlaceholder}>
                    6 caractères minimum
                  </Text>
                )}

                <TextInput
                  key="profile-password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  allowFontScaling={false}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>CONFIRMER LE MOT DE PASSE</Text>

              <View style={styles.inputWrapper}>
                {!confirmPassword && (
                  <Text pointerEvents="none" style={styles.customPlaceholder}>
                    Encore
                  </Text>
                )}

                <TextInput
                  key="profile-confirm-password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  allowFontScaling={false}
                  style={styles.input}
                />
              </View>
            </View>

            <Pressable
              disabled={loading}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !loading && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={COLORS.text1}
                  />

                  <Text style={styles.primaryButtonText}>
                    ENREGISTREMENT...
                  </Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>
                  TERMINER MON PROFIL
                </Text>
              )}
            </Pressable>
          </View>

          <View style={styles.informationCard}>
            <View style={styles.informationIcon}>
              <Text style={styles.informationIconText}>!</Text>
            </View>

            <Text style={styles.informationText}>
              Ton pseudo pourra être modifié plus tard depuis ton compte.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  // ── LAYOUT ───────────────────────────

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  keyboardView: {
    flex: 1,
  },

  header: {
    minHeight: 80,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderBottomWidth: 3,
    borderBottomColor: COLORS.contours,
  },

  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,

    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 34,

    backgroundColor: COLORS.background,
  },

  // ── LOGO ─────────────────────────────

  logoContainer: {
    paddingHorizontal: 22,
    paddingVertical: 7,

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 14,
  },

  logoText: {
    color: COLORS.text1,

    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 4,
  },

  decorativeLine: {
    width: 48,
    height: 7,

    alignSelf: 'center',
    marginBottom: 20,

    backgroundColor: COLORS.primary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 50,
  },

  // ── PROFILE CARD ─────────────────────

  card: {
    width: '100%',
    padding: 20,

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 22,
  },

  stepBadge: {
    alignSelf: 'flex-start',

    marginBottom: 18,

    paddingHorizontal: 12,
    paddingVertical: 7,

    backgroundColor: COLORS.primary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 9,
  },

  stepBadgeText: {
    color: COLORS.text1,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  titleContainer: {
    marginBottom: 28,
  },

  title: {
    color: COLORS.text1,

    fontSize: 20,
    fontWeight: '900',
    lineHeight: 31,
    letterSpacing: 1.3,
  },

  subtitle: {
    marginTop: 9,

    color: COLORS.text2,

    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  // ── FIELDS ───────────────────────────

  fieldContainer: {
    marginBottom: 20,
  },

  label: {
    marginBottom: 8,
    marginLeft: 3,

    color: COLORS.text1,

    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  inputWrapper: {
    position: 'relative',
    minHeight: 54,
  },

  input: {
    minHeight: 54,

    paddingHorizontal: 16,
    paddingVertical: 13,

    color: COLORS.text1,
    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 13,

    fontFamily:
      Platform.OS === 'ios'
        ? 'Arial'
        : 'sans-serif',

    fontSize: 15,
    fontWeight: '400',
  },

  customPlaceholder: {
    position: 'absolute',

    zIndex: 1,

    left: 19,
    top: 17,

    color: COLORS.text2,

    fontFamily:
      Platform.OS === 'ios'
        ? 'Arial'
        : 'sans-serif',

    fontSize: 15,
    fontWeight: '400',
  },

  helperText: {
    marginTop: 7,
    marginLeft: 4,

    color: COLORS.text2,

    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },

  // ── PRIMARY BUTTON ───────────────────

  primaryButton: {
    minHeight: 56,

    marginTop: 4,

    paddingHorizontal: 16,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 13,

    shadowColor: COLORS.contours,

    shadowOffset: {
      width: 4,
      height: 4,
    },

    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 4,
  },

  primaryButtonText: {
    color: COLORS.text1,

    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,

    textAlign: 'center',
  },

  buttonPressed: {
    transform: [
      {
        translateX: 3,
      },
      {
        translateY: 3,
      },
    ],

    shadowOffset: {
      width: 1,
      height: 1,
    },

    elevation: 1,
    opacity: 0.9,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 10,
  },

  // ── INFORMATION ──────────────────────

  informationCard: {
    marginTop: 28,

    padding: 15,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 14,
  },

  informationIcon: {
    width: 30,
    height: 30,

    marginRight: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.warning,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 15,
  },

  informationIconText: {
    color: COLORS.icon,

    fontSize: 15,
    fontWeight: '900',
  },

  informationText: {
    flex: 1,

    color: COLORS.text2,

    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
})